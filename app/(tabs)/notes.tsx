import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";

import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useBedroomState } from "@/features/bedroom/bedroom-service";
import {
  type NoteDelayMinutes,
  type NotePaperTheme,
  noteDelayPresets,
  notePaperThemes,
} from "@/features/notes/note-constants";
import {
  useConnectFriendWithInviteCode,
  useInboxNotes,
  useNoteComposeState,
  useNotesSocialState,
  useSendNote,
} from "@/features/notes/note-service";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

const DEFAULT_PAPER_THEME: NotePaperTheme = "Ripped notebook";

function formatResetAt(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCountdown(scheduledFor: string) {
  const target = new Date(scheduledFor).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (Number.isNaN(target)) {
    return "Arrival pending";
  }

  if (diffMs <= 0) {
    return "Arriving any moment";
  }

  const totalMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (totalMinutes < 60) {
    return `arrives in ~${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `arrives in ~${hours} h`;
  }

  return `arrives in ~${hours} h ${minutes} min`;
}

export default function NotesScreen() {
  const router = useRouter();
  const { session } = useReplayApp();
  const socialStateQuery = useNotesSocialState(session?.user.id);
  const composeStateQuery = useNoteComposeState(session?.user.id);
  const notesQuery = useInboxNotes(session?.user.id);
  const bedroomStateQuery = useBedroomState(session?.user.id);
  const connectFriendMutation = useConnectFriendWithInviteCode(session?.user.id);
  const sendNoteMutation = useSendNote(session?.user.id);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [paperStyle, setPaperStyle] = useState<NotePaperTheme>(DEFAULT_PAPER_THEME);
  const [delayMinutes, setDelayMinutes] = useState<NoteDelayMinutes>(
    noteDelayPresets[1].minutes,
  );
  const [draft, setDraft] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState("");
  const [errorText, setErrorText] = useState("");
  const [copyHint, setCopyHint] = useState("");

  useEffect(() => {
    if (!selectedFriendId && socialStateQuery.data.acceptedFriends[0]) {
      setSelectedFriendId(socialStateQuery.data.acceptedFriends[0].id);
    }
  }, [selectedFriendId, socialStateQuery.data.acceptedFriends]);

  const userId = session?.user.id;
  const ownedPaperNames = useMemo(() => {
    const names = new Set<string>();
    for (const item of bedroomStateQuery.data.notePapers) {
      if (item.owned) {
        names.add(item.name);
      }
    }
    return names;
  }, [bedroomStateQuery.data.notePapers]);

  const availablePaperThemes = useMemo<NotePaperTheme[]>(() => {
    return notePaperThemes.filter(
      (theme) => theme === DEFAULT_PAPER_THEME || ownedPaperNames.has(theme),
    );
  }, [ownedPaperNames]);

  useEffect(() => {
    if (!availablePaperThemes.includes(paperStyle)) {
      setPaperStyle(DEFAULT_PAPER_THEME);
    }
  }, [availablePaperThemes, paperStyle]);

  const inboxSections = useMemo(() => {
    const delivered = notesQuery.data.filter((note) => note.status === "delivered");
    const inTransit = notesQuery.data.filter((note) => note.status === "queued");
    const blockedAll = notesQuery.data.filter((note) => note.status === "blocked");
    const blockedOutgoing = blockedAll.filter((note) => note.fromId === userId);
    const blockedIncomingCount = blockedAll.length - blockedOutgoing.length;

    return {
      blocked: blockedOutgoing,
      blockedIncomingCount,
      delivered,
      inTransit,
    };
  }, [notesQuery.data, userId]);

  const inviteCode = socialStateQuery.data.ownInviteCode;
  const isPaidTier =
    composeStateQuery.data.subscriptionStatus === "active" ||
    composeStateQuery.data.subscriptionStatus === "trialing";

  const handleConnectFriend = async () => {
    setErrorText("");

    try {
      await connectFriendMutation.mutateAsync({
        inviteCode: inviteCodeInput.trim().toUpperCase(),
      });
      setInviteCodeInput("");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't add that friend yet.",
      );
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) {
      return;
    }
    // expo-clipboard is not in package.json — fall back to Share so users can still copy out.
    try {
      await Share.share({ message: inviteCode });
      setCopyHint("Shared!");
    } catch {
      setCopyHint("");
    }
  };

  const handleShareInviteCode = async () => {
    if (!inviteCode) {
      return;
    }
    try {
      await Share.share({ message: inviteCode });
      setCopyHint("Shared!");
    } catch {
      setCopyHint("");
    }
  };

  const handleSend = async () => {
    setErrorText("");

    try {
      await sendNoteMutation.mutateAsync({
        recipientId: selectedFriendId,
        paperStyle,
        body: draft,
        delayMinutes,
      });
      setDraft("");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't queue that note yet.",
      );
    }
  };

  return (
    <RetroScreen
      eyebrow="Classroom notes"
      title="Pass it, don't post it"
      subtitle="Invite-only inbox, delayed delivery windows, and safety tools — built for quiet exchanges, not a feed."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Invite-only connections</Text>
        <Text style={styles.copy}>Your code:</Text>
        <Pressable
          accessibilityRole="button"
          disabled={!inviteCode}
          onPress={() => {
            void handleCopyInviteCode();
          }}
          style={styles.inviteCodeChip}
        >
          <Text style={styles.inviteCodeText}>
            {inviteCode || "Loading..."}
          </Text>
          <Text style={styles.inviteCodeHint}>Tap to copy</Text>
        </Pressable>
        <PrimaryButton
          label="Share code"
          onPress={() => {
            void handleShareInviteCode();
          }}
          disabled={!inviteCode}
          variant="secondary"
        />
        {copyHint ? <Text style={styles.helperText}>{copyHint}</Text> : null}
        <TextInput
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={setInviteCodeInput}
          placeholder="Enter a friend's code"
          placeholderTextColor={tokens.colors.textFaint}
          style={styles.input}
          value={inviteCodeInput}
        />
        <PrimaryButton
          label={connectFriendMutation.isPending ? "Adding..." : "Add friend by code"}
          onPress={() => {
            void handleConnectFriend();
          }}
          disabled={!inviteCodeInput.trim() || connectFriendMutation.isPending}
        />
        {socialStateQuery.data.blockedFriends.length ? (
          <View style={styles.friendColumn}>
            <Text style={styles.label}>Blocked</Text>
            <View style={styles.chipRow}>
              {socialStateQuery.data.blockedFriends.map((friend) => (
                <View key={friend.id} style={styles.blockedChip}>
                  <Text style={styles.blockedChipLabel}>{friend.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Compose a folded note</Text>
        <Text style={styles.copy}>
          {composeStateQuery.data.remainingNotes} notes left this week out of{" "}
          {composeStateQuery.data.weeklyLimit}. Reset at {formatResetAt(composeStateQuery.data.resetAt)}.
        </Text>
        {!isPaidTier ? (
          <Text style={styles.helperText}>
            Replay+ widens this lane to 12 notes per week.
          </Text>
        ) : null}
        {socialStateQuery.data.acceptedFriends.length ? (
          <>
            <View style={styles.friendColumn}>
              <Text style={styles.label}>Send to</Text>
              <View style={styles.chipRow}>
                {socialStateQuery.data.acceptedFriends.map((friend) => (
                  <OptionChip
                    key={friend.id}
                    label={friend.isMuted ? `${friend.name} (Muted)` : friend.name}
                    onPress={() => setSelectedFriendId(friend.id)}
                    selected={selectedFriendId === friend.id}
                  />
                ))}
              </View>
            </View>

            <View style={styles.friendColumn}>
              <Text style={styles.label}>Paper theme</Text>
              <View style={styles.chipRow}>
                {availablePaperThemes.map((theme) => (
                  <OptionChip
                    key={theme}
                    label={theme}
                    onPress={() => setPaperStyle(theme)}
                    selected={paperStyle === theme}
                  />
                ))}
              </View>
            </View>

            <View style={styles.friendColumn}>
              <Text style={styles.label}>Delivery window</Text>
              <View style={styles.chipRow}>
                {noteDelayPresets.map((delay) => (
                  <OptionChip
                    key={delay.minutes}
                    label={delay.label}
                    onPress={() => setDelayMinutes(delay.minutes)}
                    selected={delayMinutes === delay.minutes}
                  />
                ))}
              </View>
              <Text style={styles.helperText}>
                {noteDelayPresets.find((delay) => delay.minutes === delayMinutes)?.subtitle}
              </Text>
            </View>

            <TextInput
              maxLength={140}
              multiline
              onChangeText={setDraft}
              placeholder="Keep it short. Quiet, specific, and not built for a feed."
              placeholderTextColor={tokens.colors.textFaint}
              style={styles.textArea}
              textAlignVertical="top"
              value={draft}
            />
            <View style={styles.counterRow}>
              <Text style={styles.counter}>{140 - draft.length} chars left</Text>
            </View>
            <PrimaryButton
              disabled={
                !draft.trim() ||
                !selectedFriendId ||
                sendNoteMutation.isPending ||
                composeStateQuery.data.remainingNotes <= 0
              }
              label={sendNoteMutation.isPending ? "Queueing..." : "Fold and send"}
              onPress={() => {
                void handleSend();
              }}
            />
          </>
        ) : (
          <Text style={styles.helperText}>
            Add a friend first, then the composer opens with invite-only recipients.
          </Text>
        )}
      </SurfaceCard>

      {composeStateQuery.data.remainingNotes <= 0 && !isPaidTier ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>Free tier tapped out</Text>
          <Text style={styles.copy}>
            You've used your free weekly notes. Replay+ expands this lane from 3 to 12.
          </Text>
          <View style={styles.friendColumn}>
            <PrimaryButton label="See Replay+" onPress={() => router.push("/paywall")} />
            <PrimaryButton
              label="Open Settings"
              onPress={() => router.push("/settings")}
              variant="secondary"
            />
          </View>
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Delivered inbox</Text>
        {inboxSections.delivered.length ? (
          <View style={styles.noteColumn}>
            {inboxSections.delivered.map((note) => (
              <Pressable
                key={note.id}
                onPress={() =>
                  router.push({
                    pathname: "/notes/[id]",
                    params: { id: note.id },
                  })
                }
                style={[
                  styles.noteCard,
                  note.isIncoming && !note.isRead ? styles.unreadNoteCard : null,
                ]}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteFrom}>{note.partnerName}</Text>
                  <Text style={styles.noteStatus}>
                    {note.isIncoming && !note.isRead ? "Unread" : "Delivered"}
                  </Text>
                </View>
                <Text style={styles.paper}>{note.paperStyle}</Text>
                <Text numberOfLines={3} style={styles.noteBody}>
                  {note.body}
                </Text>
                <Text style={styles.delivery}>{note.deliveryWindow}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            Delivered notes land here once the queue matures.
          </Text>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>In transit</Text>
        {inboxSections.inTransit.length ? (
          <View style={styles.noteColumn}>
            {inboxSections.inTransit.map((note) => (
              <Pressable
                key={note.id}
                onPress={() =>
                  router.push({
                    pathname: "/notes/[id]",
                    params: { id: note.id },
                  })
                }
                style={styles.noteCard}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteFrom}>{note.partnerName}</Text>
                  <Text style={[styles.noteStatus, styles.inTransit]}>
                    In transit
                  </Text>
                </View>
                <Text style={styles.paper}>{note.paperStyle}</Text>
                <Text numberOfLines={2} style={styles.noteBody}>
                  {note.body}
                </Text>
                <Text style={styles.delivery}>{formatCountdown(note.scheduledFor)}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <Text style={styles.helperText}>
            Queued notes wait here until their delivery window opens.
          </Text>
        )}
      </SurfaceCard>

      {inboxSections.blocked.length || inboxSections.blockedIncomingCount > 0 ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>Blocked by safety</Text>
          {inboxSections.blockedIncomingCount > 0 ? (
            <Text style={styles.helperText}>
              {inboxSections.blockedIncomingCount} blocked{" "}
              {inboxSections.blockedIncomingCount === 1 ? "note" : "notes"} hidden from your inbox.
            </Text>
          ) : null}
          {inboxSections.blocked.length ? (
            <View style={styles.noteColumn}>
              {inboxSections.blocked.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteFrom}>{note.partnerName}</Text>
                    <Text style={[styles.noteStatus, styles.blockedStatus]}>Blocked</Text>
                  </View>
                  <Text style={styles.paper}>{note.paperStyle}</Text>
                  <Text numberOfLines={2} style={styles.noteBody}>
                    {note.body}
                  </Text>
                  <Text style={styles.delivery}>{note.deliveryWindow}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </SurfaceCard>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  copy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  helperText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  friendColumn: {
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 52,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: tokens.spacing.md,
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
  },
  inviteCodeChip: {
    minHeight: 52,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    justifyContent: "center",
  },
  inviteCodeText: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 22,
    letterSpacing: 1.5,
  },
  inviteCodeHint: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  blockedChip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: "rgba(255, 125, 125, 0.35)",
    backgroundColor: "rgba(255, 125, 125, 0.08)",
  },
  blockedChipLabel: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.label,
    fontSize: 14,
  },
  textArea: {
    minHeight: 120,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
  },
  counterRow: {
    alignItems: "flex-end",
  },
  counter: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  noteColumn: {
    gap: tokens.spacing.md,
  },
  noteCard: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    gap: tokens.spacing.sm,
  },
  unreadNoteCard: {
    borderColor: tokens.colors.accentMint,
    backgroundColor: "rgba(155,255,174,0.07)",
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  noteFrom: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 22,
  },
  noteStatus: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inTransit: {
    color: tokens.colors.accentGold,
  },
  blockedStatus: {
    color: tokens.colors.accentCoral,
  },
  paper: {
    color: tokens.colors.accentBubble,
    fontFamily: tokens.typography.label,
    fontSize: 13,
  },
  noteBody: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    lineHeight: 23,
  },
  delivery: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
