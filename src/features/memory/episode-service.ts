import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trackBetaEvent } from "@/features/analytics/analytics-service";
import { supabase } from "@/lib/supabase";
import type { ReplayProfile } from "@/types/replay";

import { buildTonightEpisode } from "./build-tonight-episode";

const noop = () => {};

function buildProfileFingerprint(profile: ReplayProfile | null) {
  if (!profile) {
    return null;
  }

  return [
    profile.hometown,
    profile.mallStore,
    profile.birthYear,
    profile.channelBlock,
    profile.musicMood,
    profile.dreamConcert,
    profile.consoleChoice,
  ].join("|");
}

type TonightEpisodeRpc = {
  id: string;
  title: string;
  subtitle: string;
  themeSlug: string;
  unlockAt?: string | null;
  montageTags: string[] | null;
  mediaItems:
    | Array<{
        id: string;
        mediaType: "image" | "audio" | "video" | "copy_only";
        storagePath: string | null;
        durationSeconds: number | null;
        metadata: Record<string, unknown> | null;
      }>
    | null;
  prompts:
    | Array<{
        id: string;
        order: number;
        text: string;
        responseType: "text" | "voice";
      }>
    | null;
  savedTextResponse: string | null;
  savedResponseId: string | null;
};

type EpisodeResponseRow = {
  created_at: string;
  episode_id: string;
  id: string;
  media_path: string | null;
  prompt_id: string | null;
  response_type: "text" | "voice";
  text_body: string | null;
  updated_at: string;
};

type EpisodeHistoryRow = EpisodeResponseRow & {
  daily_episodes: Array<{
    id: string;
    subtitle: string;
    title: string;
    unlock_at: string;
  }>;
};

export type TonightEpisode = {
  id: string | null;
  title: string;
  subtitle: string;
  themeSlug: string;
  unlockAt: string | null;
  montageTags: string[];
  mediaItems: Array<{
    id: string;
    mediaType: "image" | "audio" | "video" | "copy_only";
    storagePath: string | null;
    durationSeconds: number | null;
    metadata: Record<string, unknown>;
  }>;
  prompts: Array<{
    id: string;
    order: number;
    text: string;
    responseType: "text" | "voice";
  }>;
  savedTextResponse: string;
  savedResponseId: string | null;
  isFallback: boolean;
};

export type EpisodeResponse = {
  createdAt: string;
  episodeId: string;
  id: string;
  mediaPath: string | null;
  promptId: string | null;
  responseType: "text" | "voice";
  textBody: string | null;
  updatedAt: string;
};

export type PromptProgress = {
  isComplete: boolean;
  promptId: string;
  promptOrder: number;
  promptText: string;
  responseType: "text" | "voice";
  textResponse: EpisodeResponse | null;
  voiceResponse: EpisodeResponse | null;
};

export type EpisodeHistoryEntry = {
  completedAt: string;
  dayKey: string;
  dayLabel: string;
  episodeId: string;
  id: string;
  responseCount: number;
  subtitle: string;
  title: string;
};

export type EpisodeHistorySummary = {
  entries: EpisodeHistoryEntry[];
  streak: number;
  totalResponses: number;
  uniqueResponseDays: number;
};

const tonightEpisodeKey = (userId: string | undefined, profileFingerprint: string | null) => [
  "tonight-episode",
  userId,
  profileFingerprint,
];
const episodeResponsesKey = (userId: string | undefined, episodeId: string | null) => [
  "episode-responses",
  userId,
  episodeId,
];
const episodeHistoryKey = (userId: string | undefined) => ["episode-history", userId];

function toLocalDayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatHistoryDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const value = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(value);
}

function dayDiff(laterDayKey: string, earlierDayKey: string) {
  const later = new Date(`${laterDayKey}T12:00:00`);
  const earlier = new Date(`${earlierDayKey}T12:00:00`);

  return Math.round((later.getTime() - earlier.getTime()) / 86_400_000);
}

function calculateCurrentStreak(dayKeys: string[]) {
  if (dayKeys.length === 0) {
    return 0;
  }

  const uniqueSorted = [...new Set(dayKeys)].sort((left, right) =>
    left > right ? -1 : left < right ? 1 : 0,
  );
  const todayKey = toLocalDayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDayKey(yesterday);

  if (uniqueSorted[0] !== todayKey && uniqueSorted[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueSorted.length; index += 1) {
    if (dayDiff(uniqueSorted[index - 1], uniqueSorted[index]) !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function mapEpisodeResponse(row: EpisodeResponseRow): EpisodeResponse {
  return {
    createdAt: row.created_at,
    episodeId: row.episode_id,
    id: row.id,
    mediaPath: row.media_path,
    promptId: row.prompt_id,
    responseType: row.response_type,
    textBody: row.text_body,
    updatedAt: row.updated_at,
  };
}

function inferAudioMimeType(uri: string) {
  if (uri.endsWith(".webm")) {
    return "audio/webm";
  }

  if (uri.endsWith(".caf")) {
    return "audio/x-caf";
  }

  if (uri.endsWith(".aac")) {
    return "audio/aac";
  }

  return "audio/mp4";
}

function buildFallbackEpisode(profile: ReplayProfile | null): TonightEpisode {
  const fallback = buildTonightEpisode(profile);

  return {
    id: null,
    title: fallback.title,
    subtitle: fallback.subtitle,
    themeSlug: "fallback-memory-channel",
    unlockAt: null,
    montageTags: fallback.montageTags,
    mediaItems: [
      {
        id: "fallback-editorial-card",
        mediaType: "copy_only",
        storagePath: null,
        durationSeconds: null,
        metadata: {
          caption: "Fallback editorial card while the published daily episode spins up.",
        },
      },
    ],
    prompts: fallback.prompts.map((prompt, index) => ({
      id: `fallback-${index + 1}`,
      order: index + 1,
      text: prompt,
      responseType: "text",
    })),
    savedTextResponse: "",
    savedResponseId: null,
    isFallback: true,
  };
}

function normalizeEpisode(
  payload: TonightEpisodeRpc | null,
  profile: ReplayProfile | null,
): TonightEpisode {
  if (!payload?.id) {
    return buildFallbackEpisode(profile);
  }

  return {
    id: payload.id,
    title: payload.title,
    subtitle: payload.subtitle,
    themeSlug: payload.themeSlug,
    unlockAt: payload.unlockAt ?? null,
    montageTags: payload.montageTags ?? [],
    mediaItems:
      payload.mediaItems?.map((mediaItem) => ({
        id: mediaItem.id,
        mediaType: mediaItem.mediaType,
        storagePath: mediaItem.storagePath ?? null,
        durationSeconds: mediaItem.durationSeconds ?? null,
        metadata: mediaItem.metadata ?? {},
      })) ?? [],
    prompts:
      payload.prompts?.map((prompt) => ({
        id: prompt.id,
        order: prompt.order,
        text: prompt.text,
        responseType: prompt.responseType,
      })) ?? [],
    savedTextResponse: payload.savedTextResponse ?? "",
    savedResponseId: payload.savedResponseId ?? null,
    isFallback: false,
  };
}

export function useTonightEpisode(userId: string | undefined, profile: ReplayProfile | null) {
  const profileFingerprint = buildProfileFingerprint(profile);

  return useQuery({
    queryKey: tonightEpisodeKey(userId, profileFingerprint),
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_tonight_episode");
      if (error) {
        throw error;
      }

      return normalizeEpisode((data ?? null) as TonightEpisodeRpc | null, profile);
    },
    initialData: () => buildFallbackEpisode(profile),
  });
}

export function useEpisodeResponses(userId: string | undefined, episodeId: string | null) {
  return useQuery({
    queryKey: episodeResponsesKey(userId, episodeId),
    enabled: Boolean(userId && episodeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episode_responses")
        .select(
          "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at",
        )
        .eq("episode_id", episodeId!)
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });

      if (error) {
        throw error;
      }

      return ((data ?? []) as EpisodeResponseRow[]).map(mapEpisodeResponse);
    },
    initialData: [],
  });
}

export function buildPromptProgress(
  prompts: TonightEpisode["prompts"],
  responses: EpisodeResponse[],
): PromptProgress[] {
  return prompts.map((prompt) => {
    const promptResponses = responses.filter((response) => response.promptId === prompt.id);
    const textResponse =
      promptResponses.find((response) => response.responseType === "text") ?? null;
    const voiceResponse =
      promptResponses.find((response) => response.responseType === "voice") ?? null;

    return {
      isComplete: Boolean(textResponse || voiceResponse),
      promptId: prompt.id,
      promptOrder: prompt.order,
      promptText: prompt.text,
      responseType: prompt.responseType,
      textResponse,
      voiceResponse,
    };
  });
}

export function useEpisodeHistory(userId: string | undefined) {
  return useQuery({
    queryKey: episodeHistoryKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<EpisodeHistorySummary> => {
      const { data, error } = await supabase
        .from("episode_responses")
        .select(
          "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at, daily_episodes!inner(id, title, subtitle, unlock_at)",
        )
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false })
        .limit(60);

      if (error) {
        throw error;
      }

      const rows = (data ?? []) as EpisodeHistoryRow[];
      const groupedEntries = new Map<string, EpisodeHistoryEntry>();
      const dayKeys: string[] = [];

      rows.forEach((row) => {
        const episodeDetails = row.daily_episodes[0];

        if (!episodeDetails) {
          return;
        }

        const dayKey = toLocalDayKey(row.updated_at);
        const entryKey = `${dayKey}-${row.episode_id}`;
        dayKeys.push(dayKey);

        const current = groupedEntries.get(entryKey);

        if (current) {
          current.responseCount += 1;
          if (row.updated_at > current.completedAt) {
            current.completedAt = row.updated_at;
          }
          return;
        }

        groupedEntries.set(entryKey, {
          completedAt: row.updated_at,
          dayKey,
          dayLabel: formatHistoryDayLabel(dayKey),
          episodeId: row.episode_id,
          id: entryKey,
          responseCount: 1,
          subtitle: episodeDetails.subtitle,
          title: episodeDetails.title,
        });
      });

      const entries = [...groupedEntries.values()].sort((left, right) =>
        left.completedAt > right.completedAt ? -1 : left.completedAt < right.completedAt ? 1 : 0,
      );

      return {
        entries,
        streak: calculateCurrentStreak(dayKeys),
        totalResponses: rows.length,
        uniqueResponseDays: new Set(dayKeys).size,
      };
    },
    initialData: {
      entries: [],
      streak: 0,
      totalResponses: 0,
      uniqueResponseDays: 0,
    },
  });
}

export function useSaveTextEpisodeResponse(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      existingResponseId,
      episodeId,
      promptId,
      textBody,
    }: {
      existingResponseId: string | null;
      episodeId: string | null;
      promptId: string;
      textBody: string;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before saving a memory.");
      }

      if (!episodeId) {
        throw new Error("Tonight's episode hasn't dropped yet — check back at the scheduled hour.");
      }

      const trimmedText = textBody.trim();
      if (!trimmedText) {
        throw new Error("Write something before saving the memory.");
      }

      if (existingResponseId) {
        const { data, error } = await supabase
          .from("episode_responses")
          .update({ prompt_id: promptId, text_body: trimmedText })
          .eq("id", existingResponseId)
          .eq("user_id", userId)
          .select(
            "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        return mapEpisodeResponse(data as EpisodeResponseRow);
      }

      const { data, error } = await supabase
        .from("episode_responses")
        .insert({
          episode_id: episodeId,
          prompt_id: promptId,
          user_id: userId,
          response_type: "text",
          text_body: trimmedText,
        })
        .select(
          "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return mapEpisodeResponse(data as EpisodeResponseRow);
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: episodeResponsesKey(userId, variables.episodeId),
      });
      void queryClient.invalidateQueries({ queryKey: episodeHistoryKey(userId) });
      void queryClient.invalidateQueries({ queryKey: ["tonight-episode", userId] });

      if (variables.episodeId != null) {
        void trackBetaEvent({
          eventName: "prompt_save",
          metadata: {
            episodeId: variables.episodeId,
            promptId: variables.promptId,
            mode: "text" as const,
          },
        }).catch(noop);
      }
    },
  });
}

export function useSaveVoiceEpisodeResponse(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      episodeId,
      existingResponseId,
      promptId,
      recordingUri,
    }: {
      episodeId: string | null;
      existingResponseId: string | null;
      promptId: string;
      recordingUri: string;
    }) => {
      if (!userId) {
        throw new Error("You need to sign in before saving a voice memo.");
      }

      if (!episodeId) {
        throw new Error("Tonight's episode hasn't dropped yet — check back at the scheduled hour.");
      }

      if (!recordingUri) {
        throw new Error("Record a voice memo before saving it.");
      }

      const extension = recordingUri.includes(".")
        ? recordingUri.split(".").pop()?.toLowerCase() ?? "m4a"
        : "m4a";
      const storagePath = `${userId}/${episodeId}/${promptId}-${Date.now()}.${extension}`;

      const recordingResponse = await fetch(recordingUri);
      const recordingBuffer = await recordingResponse.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from("voice-replies")
        .upload(storagePath, recordingBuffer, {
          contentType: inferAudioMimeType(recordingUri),
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      if (existingResponseId) {
        const { data, error } = await supabase
          .from("episode_responses")
          .update({
            media_path: storagePath,
            prompt_id: promptId,
          })
          .eq("id", existingResponseId)
          .eq("user_id", userId)
          .select(
            "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at",
          )
          .single();

        if (error) {
          throw error;
        }

        return mapEpisodeResponse(data as EpisodeResponseRow);
      }

      const { data, error } = await supabase
        .from("episode_responses")
        .insert({
          episode_id: episodeId,
          prompt_id: promptId,
          user_id: userId,
          response_type: "voice",
          media_path: storagePath,
        })
        .select(
          "id, episode_id, prompt_id, response_type, text_body, media_path, created_at, updated_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return mapEpisodeResponse(data as EpisodeResponseRow);
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({
        queryKey: episodeResponsesKey(userId, variables.episodeId),
      });
      void queryClient.invalidateQueries({ queryKey: episodeHistoryKey(userId) });

      if (variables.episodeId != null) {
        void trackBetaEvent({
          eventName: "prompt_save",
          metadata: {
            episodeId: variables.episodeId,
            promptId: variables.promptId,
            mode: "voice" as const,
          },
        }).catch(noop);
      }
    },
  });
}

export async function getSignedVoiceReplyUrl(path: string) {
  const { data, error } = await supabase.storage
    .from("voice-replies")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
