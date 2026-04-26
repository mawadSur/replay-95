import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ReplayFriend = {
  id: string;
  isMuted: boolean;
  name: string;
};

export type ReplayInboxNote = {
  body: string;
  createdAt: string;
  deliveredAt: string | null;
  deliveryWindow: string;
  from: string;
  fromId: string;
  id: string;
  isIncoming: boolean;
  isRead: boolean;
  paperStyle: string;
  partnerId: string;
  partnerMuted: boolean;
  partnerName: string;
  readAt: string | null;
  scheduledFor: string;
  status: "blocked" | "delivered" | "queued";
  to: string;
  toId: string;
};

export type ReplayComposeState = {
  remainingNotes: number;
  resetAt: string;
  sentThisWeek: number;
  subscriptionStatus: "free" | "trialing" | "active" | "past_due" | "canceled";
  weeklyLimit: number;
};

export type ReplayNotesSocialState = {
  acceptedFriends: ReplayFriend[];
  blockedFriends: ReplayFriend[];
  mutedFriendIds: string[];
  ownInviteCode: string;
};

type FriendshipRow = {
  user_id: string;
  friend_id: string;
  status: "accepted" | "blocked" | "pending";
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  invite_code?: string | null;
};

type NoteRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  paper_style: string;
  body: string;
  scheduled_for: string;
  delivered_at: string | null;
  status: "queued" | "delivered" | "blocked";
  read_at: string | null;
  created_at: string;
};

type MuteRow = {
  muted_user_id: string;
};

const socialStateKey = (userId: string | undefined) => ["notes-social-state", userId];
const notesKey = (userId: string | undefined) => ["notes", userId];
const composeStateKey = (userId: string | undefined) => ["note-compose-state", userId];

function formatDeliveryWindow(note: NoteRow) {
  const timestamp = note.delivered_at ?? note.scheduled_for;
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));

  if (note.status === "delivered") {
    return `Arrived ${label}`;
  }

  if (note.status === "blocked") {
    return "Delivery stopped by safety controls";
  }

  return `Scheduled for ${label}`;
}

async function fetchProfilesByIds(userIds: string[]) {
  if (!userIds.length) {
    return [] as ProfileRow[];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name, invite_code")
    .in("user_id", userIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRow[];
}

async function fetchNotesSocialState(userId: string): Promise<ReplayNotesSocialState> {
  const [selfProfileResult, friendshipsResult, mutedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, invite_code")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("friendships")
      .select("user_id, friend_id, status")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`),
    supabase
      .from("note_mutes")
      .select("muted_user_id")
      .eq("user_id", userId),
  ]);

  if (selfProfileResult.error) {
    throw selfProfileResult.error;
  }

  if (friendshipsResult.error) {
    throw friendshipsResult.error;
  }

  if (mutedResult.error) {
    throw mutedResult.error;
  }

  const friendshipRows = (friendshipsResult.data ?? []) as FriendshipRow[];
  const mutedRows = (mutedResult.data ?? []) as MuteRow[];
  const mutedFriendIds = mutedRows.map((row) => row.muted_user_id);
  const friendIds = [
    ...new Set(
      friendshipRows.map((row) => (row.user_id === userId ? row.friend_id : row.user_id)),
    ),
  ];
  const friendProfiles = await fetchProfilesByIds(friendIds);
  const profileMap = new Map(friendProfiles.map((profile) => [profile.user_id, profile]));

  const acceptedFriends = friendshipRows
    .filter((row) => row.status === "accepted")
    .map((row) => (row.user_id === userId ? row.friend_id : row.user_id))
    .filter((friendId, index, current) => current.indexOf(friendId) === index)
    .map((friendId) => {
      const profile = profileMap.get(friendId);

      return {
        id: friendId,
        isMuted: mutedFriendIds.includes(friendId),
        name: profile?.display_name ?? "Friend",
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const blockedFriends = friendshipRows
    .filter((row) => row.status === "blocked" && row.user_id === userId)
    .map((row) => row.friend_id)
    .filter((friendId, index, current) => current.indexOf(friendId) === index)
    .map((friendId) => ({
      id: friendId,
      isMuted: mutedFriendIds.includes(friendId),
      name: profileMap.get(friendId)?.display_name ?? "Blocked friend",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    acceptedFriends,
    blockedFriends,
    mutedFriendIds,
    ownInviteCode:
      ((selfProfileResult.data as ProfileRow | null)?.invite_code ?? "").toUpperCase(),
  };
}

export function useNotesSocialState(userId: string | undefined) {
  return useQuery({
    queryKey: socialStateKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => fetchNotesSocialState(userId!),
    initialData: {
      acceptedFriends: [],
      blockedFriends: [],
      mutedFriendIds: [],
      ownInviteCode: "",
    } satisfies ReplayNotesSocialState,
  });
}

export function useNoteComposeState(userId: string | undefined) {
  return useQuery({
    queryKey: composeStateKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ReplayComposeState> => {
      const { data, error } = await supabase.rpc("get_note_compose_state");

      if (error) {
        throw error;
      }

      return {
        remainingNotes: data?.remainingNotes ?? 0,
        resetAt: data?.resetAt ?? new Date().toISOString(),
        sentThisWeek: data?.sentThisWeek ?? 0,
        subscriptionStatus: data?.subscriptionStatus ?? "free",
        weeklyLimit: data?.weeklyLimit ?? 3,
      };
    },
    initialData: {
      remainingNotes: 0,
      resetAt: new Date().toISOString(),
      sentThisWeek: 0,
      subscriptionStatus: "free",
      weeklyLimit: 3,
    } satisfies ReplayComposeState,
  });
}

export function useInboxNotes(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: notesKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const cachedSocialState = queryClient.getQueryData<ReplayNotesSocialState>(
        socialStateKey(userId),
      );
      const [{ data: notesData, error: notesError }, socialState] = await Promise.all([
        supabase
          .from("notes")
          .select(
            "id, sender_id, recipient_id, paper_style, body, scheduled_for, delivered_at, status, read_at, created_at",
          )
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order("created_at", { ascending: false }),
        cachedSocialState ?? fetchNotesSocialState(userId!),
      ]);

      if (notesError) {
        throw notesError;
      }

      const noteRows = (notesData ?? []) as NoteRow[];
      const profileIds = [
        ...new Set(noteRows.flatMap((note) => [note.sender_id, note.recipient_id])),
      ];
      const profiles = await fetchProfilesByIds(profileIds);
      const profileMap = new Map(profiles.map((profile) => [profile.user_id, profile.display_name]));

      return noteRows.map((note) => {
        const isIncoming = note.recipient_id === userId;
        const partnerId = isIncoming ? note.sender_id : note.recipient_id;

        return {
          body: note.body,
          createdAt: note.created_at,
          deliveredAt: note.delivered_at,
          deliveryWindow: formatDeliveryWindow(note),
          from: note.sender_id === userId ? "You" : profileMap.get(note.sender_id) ?? "Friend",
          fromId: note.sender_id,
          id: note.id,
          isIncoming,
          isRead: !isIncoming || Boolean(note.read_at),
          paperStyle: note.paper_style,
          partnerId,
          partnerMuted: socialState.mutedFriendIds.includes(partnerId),
          partnerName: profileMap.get(partnerId) ?? "Friend",
          readAt: note.read_at,
          scheduledFor: note.scheduled_for,
          status: note.status,
          to: note.recipient_id === userId ? "You" : profileMap.get(note.recipient_id) ?? "Friend",
          toId: note.recipient_id,
        } satisfies ReplayInboxNote;
      });
    },
    initialData: [] as ReplayInboxNote[],
  });
}

export function useConnectFriendWithInviteCode(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteCode }: { inviteCode: string }) => {
      if (!userId) {
        throw new Error("You need to sign in before adding a friend.");
      }

      const { data, error } = await supabase.rpc("accept_friend_invite", {
        p_invite_code: inviteCode,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: notesKey(userId) }),
      ]);
    },
  });
}

export function useSendNote(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipientId,
      paperStyle,
      body,
      delayMinutes = 120,
    }: {
      recipientId: string;
      paperStyle: string;
      body: string;
      delayMinutes?: number;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before sending a note.");
      }

      const { data, error } = await supabase.rpc("queue_note", {
        p_recipient_id: recipientId,
        p_paper_style: paperStyle,
        p_body: body,
        p_delay_minutes: delayMinutes,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notesKey(userId) }),
        queryClient.invalidateQueries({ queryKey: socialStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: composeStateKey(userId) }),
      ]);
    },
  });
}

export function useMarkNoteRead(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      if (!userId) {
        throw new Error("You need to sign in before reading notes.");
      }

      const { data, error } = await supabase.rpc("mark_note_read", {
        p_note_id: noteId,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKey(userId) });
    },
  });
}

export function useMuteFriend(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      friendId,
      isMuted,
    }: {
      friendId: string;
      isMuted: boolean;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before muting a friend.");
      }

      const { data, error } = await supabase.rpc("mute_friend", {
        p_target_user_id: friendId,
        p_is_muted: isMuted,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: notesKey(userId) }),
      ]);
    },
  });
}

export function useBlockFriend(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ friendId }: { friendId: string }) => {
      if (!userId) {
        throw new Error("You need to sign in before blocking a friend.");
      }

      const { data, error } = await supabase.rpc("block_friend", {
        p_target_user_id: friendId,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: socialStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: notesKey(userId) }),
      ]);
    },
  });
}

export function useReportNote(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      reason,
    }: {
      noteId: string;
      reason: string;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before reporting a note.");
      }

      const { data, error } = await supabase.rpc("report_note", {
        p_note_id: noteId,
        p_reason: reason,
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: notesKey(userId) });
    },
  });
}
