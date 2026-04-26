import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useReplayPlusState } from "@/features/account/account-service";
import { useTrackBetaEvent } from "@/features/analytics/analytics-service";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import {
  buildPromptProgress,
  getSignedVoiceReplyUrl,
  useEpisodeHistory,
  useEpisodeResponses,
  useSaveTextEpisodeResponse,
  useSaveVoiceEpisodeResponse,
  useTonightEpisode,
} from "@/features/memory/episode-service";
import {
  useReplayNotificationPermission,
  useRequestReplayNotificationPermission,
  useScheduleTestNightlyMemoryNotification,
} from "@/features/memory/memory-notification-service";
import {
  buildProfileSignal,
  formatNotificationTimeLabel,
} from "@/features/profile/profile-personalization";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

function formatDurationMillis(durationMillis: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function formatEpisodeDate(value: string | null) {
  if (!value) {
    return "Ready tonight";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLastDropLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  const dropDate = new Date(value);
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const dropKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dropDate);

  if (dropKey === todayKey) {
    return "Tonight";
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);

  if (dropKey === yesterdayKey) {
    return "Last night";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(dropDate);
}

function describePromptStatus(hasText: boolean, hasVoice: boolean) {
  if (hasText && hasVoice) {
    return "Text + voice saved";
  }

  if (hasVoice) {
    return "Voice saved";
  }

  if (hasText) {
    return "Text saved";
  }

  return "Still open";
}

export default function TodayScreen() {
  const params = useLocalSearchParams<{ entry?: string }>();
  const router = useRouter();
  const { notificationDraft, pogs, profile, session } = useReplayApp();
  const replayPlusQuery = useReplayPlusState(session?.user.id);
  const trackBetaEventMutation = useTrackBetaEvent(session?.user.id);
  const episodeQuery = useTonightEpisode(session?.user.id, profile);
  const episode = episodeQuery.data;
  const responsesQuery = useEpisodeResponses(session?.user.id, episode?.id ?? null);
  const historyQuery = useEpisodeHistory(session?.user.id);
  const saveTextMutation = useSaveTextEpisodeResponse(session?.user.id);
  const saveVoiceMutation = useSaveVoiceEpisodeResponse(session?.user.id);
  const notificationPermissionQuery = useReplayNotificationPermission();
  const requestNotificationPermissionMutation = useRequestReplayNotificationPermission();
  const scheduleTestNotificationMutation = useScheduleTestNightlyMemoryNotification();
  const profileSignal = profile ? buildProfileSignal(profile) : null;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const voicePlayer = useAudioPlayer();
  const voicePlayerStatus = useAudioPlayerStatus(voicePlayer);
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState("");
  const [voiceErrorText, setVoiceErrorText] = useState("");
  const [previewVoiceUri, setPreviewVoiceUri] = useState<string | null>(null);

  const promptProgress = useMemo(
    () => buildPromptProgress(episode?.prompts ?? [], responsesQuery.data),
    [episode?.prompts, responsesQuery.data],
  );

  useEffect(() => {
    if (!episode?.prompts.length) {
      setActivePromptId(null);
      return;
    }

    setActivePromptId((current) =>
      current && episode.prompts.some((prompt) => prompt.id === current)
        ? current
        : episode.prompts[0].id,
    );
  }, [episode?.id, episode?.prompts]);

  const activePrompt =
    promptProgress.find((prompt) => prompt.promptId === activePromptId) ??
    promptProgress[0] ??
    null;

  const activePromptKey = activePrompt?.promptId ?? null;
  const activeDraft = activePromptKey ? drafts[activePromptKey] ?? "" : "";

  useEffect(() => {
    if (!activePromptKey) {
      return;
    }

    setDrafts((current) => {
      if (Object.prototype.hasOwnProperty.call(current, activePromptKey)) {
        return current;
      }

      return {
        ...current,
        [activePromptKey]: activePrompt?.textResponse?.textBody ?? "",
      };
    });
    setErrorText("");
    setVoiceErrorText("");
    setPreviewVoiceUri(null);
  }, [activePromptKey, activePrompt?.textResponse?.id, activePrompt?.textResponse?.textBody]);

  const completedPromptCount = promptProgress.filter((prompt) => prompt.isComplete).length;
  const totalPrompts = promptProgress.length;
  const isEpisodeComplete = totalPrompts > 0 && completedPromptCount === totalPrompts;
  const historySummary = historyQuery.data;
  const notificationPermission = notificationPermissionQuery.data;
  const isOpenedFromNotification = params.entry === "notification";
  const replayPlusState = replayPlusQuery.data ?? { isPaid: false };
  const isReplayPlusPaid = replayPlusState.isPaid ?? false;

  useEffect(() => {
    if (!session?.user.id) {
      return;
    }

    const dayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    void trackBetaEventMutation
      .mutateAsync({
        eventName: "today_open",
        dedupeKey: `${episode?.id ?? "fallback"}-${dayKey}`,
        metadata: {
          entry: params.entry ?? "tab",
          themeSlug: episode?.themeSlug ?? "fallback-memory-channel",
        },
      })
      .catch(() => {
        // Analytics should not block the nightly screen.
      });
  }, [
    episode?.id,
    episode?.themeSlug,
    params.entry,
    session?.user.id,
    trackBetaEventMutation,
  ]);

  const handleSaveText = async () => {
    if (!activePrompt) {
      return;
    }

    setErrorText("");

    try {
      await saveTextMutation.mutateAsync({
        existingResponseId: activePrompt.textResponse?.id ?? null,
        episodeId: episode?.id ?? null,
        promptId: activePrompt.promptId,
        textBody: activeDraft,
      });
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "We couldn't save the memory right now.",
      );
    }
  };

  const handleDraftChange = (nextValue: string) => {
    if (!activePromptKey) {
      return;
    }

    setDrafts((current) => ({ ...current, [activePromptKey]: nextValue }));
  };

  const handleStartRecording = async () => {
    setVoiceErrorText("");

    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error("Microphone access is required to record a voice memo.");
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      setVoiceErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't start recording.",
      );
    }
  };

  const handleStopRecording = async () => {
    setVoiceErrorText("");

    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const nextPreviewUri = recorder.getStatus().url ?? recorderState.url;
      if (!nextPreviewUri) {
        throw new Error("The recording stopped, but no audio file was created.");
      }

      setPreviewVoiceUri(nextPreviewUri);
    } catch (error) {
      setVoiceErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't finish the recording.",
      );
    }
  };

  const handleSaveVoice = async () => {
    if (!activePrompt) {
      return;
    }

    setVoiceErrorText("");

    try {
      const recordingUri = previewVoiceUri;
      if (!recordingUri) {
        throw new Error("Record a voice memo before saving it.");
      }

      await saveVoiceMutation.mutateAsync({
        episodeId: episode?.id ?? null,
        existingResponseId: activePrompt.voiceResponse?.id ?? null,
        promptId: activePrompt.promptId,
        recordingUri,
      });

      setPreviewVoiceUri(null);
    } catch (error) {
      setVoiceErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't save the voice memo.",
      );
    }
  };

  const handlePlayVoice = async () => {
    setVoiceErrorText("");

    try {
      if (voicePlayerStatus.playing) {
        voicePlayer.pause();
        return;
      }

      const nextSource =
        previewVoiceUri ??
        (activePrompt?.voiceResponse?.mediaPath
          ? await getSignedVoiceReplyUrl(activePrompt.voiceResponse.mediaPath)
          : null);

      if (!nextSource) {
        throw new Error("Record or save a voice memo before trying to play it.");
      }

      voicePlayer.replace({ uri: nextSource });
      // `replace` is synchronous but the source swap happens on the native
      // side; run `play` in a microtask so the player binds to the new source
      // before kicking off playback.
      await Promise.resolve();
      voicePlayer.play();
    } catch (error) {
      setVoiceErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't play the voice memo.",
      );
    }
  };

  const handleEnableNotifications = async () => {
    setErrorText("");

    try {
      await requestNotificationPermissionMutation.mutateAsync(notificationDraft);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't enable nightly alerts.",
      );
    }
  };

  const handleScheduleTestReminder = async () => {
    setErrorText("");

    try {
      await scheduleTestNotificationMutation.mutateAsync();
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't schedule the test reminder.",
      );
    }
  };

  return (
    <RetroScreen
      eyebrow="Memory Channel"
      title="Tonight is ready to play."
      subtitle="Tonight's prompts, your text and voice replies, and your nightly streak — all in one place."
    >
      {isOpenedFromNotification ? (
        <SurfaceCard style={styles.notificationEntryCard}>
          <Text style={styles.notificationEntryLabel}>Opened from nightly reminder</Text>
          <Text style={styles.copy}>
            Welcome back. Tonight's prompts are ready.
          </Text>
        </SurfaceCard>
      ) : null}

      <LinearGradient colors={tokens.gradients.hero} style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>
          {`${episode?.isFallback ? "Preview · " : ""}${
            notificationDraft.dailyEnabled
              ? `Nightly drop at ${formatNotificationTimeLabel(
                  notificationDraft.nightlyDeliveryTime,
                )}`
              : "Nightly reminders paused"
          }`}
        </Text>
        <Text style={styles.heroTitle}>{episode?.title ?? "Memory Channel loading..."}</Text>
        <Text style={styles.heroSubtitle}>
          {episode?.subtitle ?? "Checking for tonight's published episode."}
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Completed</Text>
            <Text style={styles.heroStatValue}>
              {completedPromptCount}/{Math.max(totalPrompts, 1)}
            </Text>
          </View>
          <View style={[styles.heroStat, episode?.isFallback ? styles.heroStatMuted : null]}>
            <Text style={styles.heroStatLabel}>Streak</Text>
            <Text
              style={[
                styles.heroStatValue,
                episode?.isFallback ? styles.heroStatValueMuted : null,
              ]}
            >
              {episode?.isFallback ? "—" : historySummary.streak}
            </Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Pogs</Text>
            <Text style={styles.heroStatValue}>{pogs}</Text>
          </View>
        </View>
      </LinearGradient>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Replay+ and settings</Text>
        <Text style={styles.copy}>
          {isReplayPlusPaid
            ? "Replay+ is active on this account. Manage timing and restore from Settings."
            : "You're on the free tier. Replay+ widens the weekly note allowance and unlocks more of the shell."}
        </Text>
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={isReplayPlusPaid ? "Manage Replay+" : "See Replay+"}
            onPress={() =>
              router.push(isReplayPlusPaid ? "/settings" : "/paywall")
            }
          />
          <PrimaryButton
            label="Open Memory Booth"
            onPress={() => router.push("/camera")}
            variant="secondary"
          />
          <PrimaryButton
            label="Settings"
            onPress={() => router.push("/settings")}
            variant="secondary"
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Notification entry</Text>
        <Text style={styles.copy}>
          {notificationPermission?.granted
            ? "Nightly alerts are enabled on this device. Use the 5-second test reminder to verify the tap-in flow without waiting for the scheduled window."
            : notificationPermission?.isSupported === false
              ? "Nightly alerts require a native iOS or Android build."
              : "Enable notifications so Replay '95 can deliver the nightly reminder and route you back into Tonight."}
        </Text>
        <Text style={styles.helperText}>
          Scheduled window: {formatNotificationTimeLabel(notificationDraft.nightlyDeliveryTime)}
        </Text>
        <View style={styles.buttonRow}>
          {!notificationPermission?.granted ? (
            <PrimaryButton
              label={
                requestNotificationPermissionMutation.isPending
                  ? "Enabling..."
                  : "Enable nightly alerts"
              }
              onPress={() => {
                void handleEnableNotifications();
              }}
              disabled={
                requestNotificationPermissionMutation.isPending ||
                notificationPermission?.isSupported === false
              }
            />
          ) : null}
          <PrimaryButton
            label={
              scheduleTestNotificationMutation.isPending
                ? "Scheduling..."
                : "Send 5-second test reminder"
            }
            onPress={() => {
              void handleScheduleTestReminder();
            }}
            disabled={!notificationPermission?.granted || scheduleTestNotificationMutation.isPending}
            variant="secondary"
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Episode player shell</Text>
        <Text style={styles.helperText}>
          Unlock window: {formatEpisodeDate(episode?.unlockAt ?? null)}
        </Text>
        <View style={styles.playerRail}>
          {(episode?.mediaItems ?? []).map((mediaItem, index) => {
            const caption =
              typeof mediaItem.metadata.caption === "string"
                ? mediaItem.metadata.caption
                : "Editorial montage placeholder";

            return (
              <View key={mediaItem.id} style={styles.mediaCard}>
                <Text style={styles.mediaStep}>Scene {index + 1}</Text>
                <Text style={styles.mediaType}>{mediaItem.mediaType.replace("_", " ")}</Text>
                <Text style={styles.mediaCaption}>{caption}</Text>
              </View>
            );
          })}
        </View>
        {episode?.isFallback ? (
          <Text style={styles.helperText}>
            Tonight's published episode hasn't dropped yet — this is a placeholder until it does.
          </Text>
        ) : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Prompt cards</Text>
        <View style={styles.promptColumn}>
          {promptProgress.map((prompt) => {
            const hasText = Boolean(prompt.textResponse);
            const hasVoice = Boolean(prompt.voiceResponse);
            const isActive = prompt.promptId === activePrompt?.promptId;

            return (
              <Pressable
                key={prompt.promptId}
                onPress={() => setActivePromptId(prompt.promptId)}
                style={[
                  styles.promptCard,
                  isActive ? styles.promptCardActive : null,
                ]}
              >
                <View style={styles.promptHeader}>
                  <Text style={styles.promptLabel}>Prompt {prompt.promptOrder}</Text>
                  <Text style={styles.promptState}>
                    {describePromptStatus(hasText, hasVoice)}
                  </Text>
                </View>
                <Text style={styles.promptText}>{prompt.promptText}</Text>
              </Pressable>
            );
          })}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Text reply flow</Text>
        <Text style={styles.copy}>
          {activePrompt
            ? `Replying to prompt ${activePrompt.promptOrder}. Saving updates this prompt's answer.`
            : "Choose a prompt first."}
        </Text>
        <TextInput
          multiline
          onChangeText={handleDraftChange}
          placeholder="Type the version of the memory you'd actually tell a friend."
          placeholderTextColor={tokens.colors.textFaint}
          style={styles.textArea}
          textAlignVertical="top"
          value={activeDraft}
        />
        {activePrompt?.textResponse?.textBody ? (
          <View style={styles.savedCard}>
            <Text style={styles.savedLabel}>Latest saved text</Text>
            <Text style={styles.savedText}>{activePrompt.textResponse.textBody}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label={saveTextMutation.isPending ? "Saving..." : "Save text reply"}
          onPress={() => {
            void handleSaveText();
          }}
          disabled={
            !activePrompt ||
            !activeDraft.trim() ||
            saveTextMutation.isPending ||
            episode?.isFallback === true
          }
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Voice memo flow</Text>
        <Text style={styles.copy}>
          Record an answer to the active prompt, listen back, then save it to your private voice replies.
        </Text>
        <View style={styles.voiceMetaRow}>
          <View style={styles.voiceMetaCard}>
            <Text style={styles.voiceMetaLabel}>Recording</Text>
            <Text style={styles.voiceMetaValue}>
              {recorderState.isRecording ? "Live" : "Idle"}
            </Text>
          </View>
          <View style={styles.voiceMetaCard}>
            <Text style={styles.voiceMetaLabel}>Timer</Text>
            <Text style={styles.voiceMetaValue}>
              {formatDurationMillis(recorderState.durationMillis)}
            </Text>
          </View>
          <View style={styles.voiceMetaCard}>
            <Text style={styles.voiceMetaLabel}>Playback</Text>
            <Text style={styles.voiceMetaValue}>
              {voicePlayerStatus.playing ? "Playing" : "Stopped"}
            </Text>
          </View>
        </View>
        {previewVoiceUri ? (
          <Text style={styles.helperText}>Voice preview is ready to save.</Text>
        ) : activePrompt?.voiceResponse?.mediaPath ? (
          <Text style={styles.helperText}>A saved voice memo already exists for this prompt.</Text>
        ) : (
          <Text style={styles.helperText}>No voice memo recorded for this prompt yet.</Text>
        )}
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={recorderState.isRecording ? "Recording..." : "Start recording"}
            onPress={() => {
              void handleStartRecording();
            }}
            disabled={recorderState.isRecording || saveVoiceMutation.isPending || !activePrompt}
          />
          <PrimaryButton
            label="Stop recording"
            onPress={() => {
              void handleStopRecording();
            }}
            disabled={!recorderState.isRecording}
            variant="secondary"
          />
          <PrimaryButton
            label={voicePlayerStatus.playing ? "Pause playback" : "Play voice memo"}
            onPress={() => {
              void handlePlayVoice();
            }}
            disabled={!previewVoiceUri && !activePrompt?.voiceResponse?.mediaPath}
            variant="secondary"
          />
          <PrimaryButton
            label={saveVoiceMutation.isPending ? "Saving..." : "Save voice memo"}
            onPress={() => {
              void handleSaveVoice();
            }}
            disabled={
              !activePrompt ||
              saveVoiceMutation.isPending ||
              !previewVoiceUri ||
              episode?.isFallback === true
            }
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Completion and history</Text>
        <Text style={styles.copy}>
          {isEpisodeComplete
            ? "Tonight is complete. Every prompt has at least one saved response."
            : `${completedPromptCount} of ${totalPrompts} prompts answered so far.`}
        </Text>
        <View style={styles.historyMetaRow}>
          <View style={styles.historyMetaCard}>
            <Text style={styles.historyMetaLabel}>Current streak</Text>
            <Text style={styles.historyMetaValue}>
              {episode?.isFallback ? "—" : historySummary.streak}
            </Text>
          </View>
          <View style={styles.historyMetaCard}>
            <Text style={styles.historyMetaLabel}>Last drop</Text>
            <Text style={styles.historyMetaValue}>
              {formatLastDropLabel(historySummary.entries[0]?.completedAt ?? null)}
            </Text>
          </View>
          <View style={styles.historyMetaCard}>
            <Text style={styles.historyMetaLabel}>Days checked in</Text>
            <Text style={styles.historyMetaValue}>{historySummary.uniqueResponseDays}</Text>
          </View>
        </View>
        <View style={styles.historyColumn}>
          {historySummary.entries.length ? (
            historySummary.entries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <View style={styles.historyCopy}>
                  <Text style={styles.historyTitle}>{entry.title}</Text>
                  <Text style={styles.historySubtitle}>{entry.subtitle}</Text>
                </View>
                <View style={styles.historyMeta}>
                  <Text style={styles.historyDay}>{entry.dayLabel}</Text>
                  <Text style={styles.historyCount}>{entry.responseCount} saves</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>
              History starts the first time you save a prompt or voice memo.
            </Text>
          )}
        </View>
      </SurfaceCard>

      {profileSignal ? (
        <SurfaceCard style={styles.card}>
          <Text style={styles.sectionTitle}>Signal profile</Text>
          <Text style={styles.copy}>{profileSignal.hometownLine}</Text>
          <Text style={styles.copy}>{profileSignal.tasteLine}</Text>
          <Text style={styles.copy}>{profileSignal.concertLine}</Text>
        </SurfaceCard>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {voiceErrorText ? <Text style={styles.errorText}>{voiceErrorText}</Text> : null}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.xl,
    gap: tokens.spacing.sm,
    ...tokens.shadows.panel,
  },
  heroEyebrow: {
    color: "#35223F",
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#23152B",
    fontFamily: tokens.typography.display,
    fontSize: 30,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: "#2F2136",
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.md,
  },
  heroStat: {
    flex: 1,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  heroStatLabel: {
    color: "#2F2136",
    fontFamily: tokens.typography.label,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: "#23152B",
    fontFamily: tokens.typography.display,
    fontSize: 28,
  },
  heroStatMuted: {
    opacity: 0.55,
  },
  heroStatValueMuted: {
    color: "#5A4664",
  },
  notificationEntryCard: {
    gap: tokens.spacing.sm,
    borderColor: "rgba(155,255,174,0.35)",
    backgroundColor: "rgba(155,255,174,0.08)",
  },
  notificationEntryLabel: {
    color: tokens.colors.accentMint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
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
  buttonRow: {
    gap: tokens.spacing.md,
  },
  playerRail: {
    gap: tokens.spacing.sm,
  },
  mediaCard: {
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    gap: tokens.spacing.xs,
  },
  mediaStep: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mediaType: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 14,
    textTransform: "capitalize",
  },
  mediaCaption: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  promptColumn: {
    gap: tokens.spacing.sm,
  },
  promptCard: {
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    gap: tokens.spacing.xs,
  },
  promptCardActive: {
    borderColor: tokens.colors.accentMint,
    backgroundColor: "rgba(155,255,174,0.08)",
  },
  promptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  promptLabel: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  promptState: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  promptText: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 16,
    lineHeight: 23,
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
  savedCard: {
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(122, 199, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(122, 199, 255, 0.25)",
    gap: tokens.spacing.xs,
  },
  savedLabel: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  savedText: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  voiceMetaRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  voiceMetaCard: {
    flex: 1,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    gap: tokens.spacing.xs,
  },
  voiceMetaLabel: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  voiceMetaValue: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 20,
  },
  historyMetaRow: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  historyMetaCard: {
    flex: 1,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
    gap: tokens.spacing.xs,
  },
  historyMetaLabel: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 11,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  historyMetaValue: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 22,
  },
  historyColumn: {
    gap: tokens.spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    gap: tokens.spacing.md,
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  historyCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  historyTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 14,
  },
  historySubtitle: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  historyMeta: {
    alignItems: "flex-end",
    gap: tokens.spacing.xs,
  },
  historyDay: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  historyCount: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 12,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
