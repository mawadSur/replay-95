import { useState } from "react";
import { Redirect, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import {
  formatReplayPlusStatus,
  useIsBetaAdmin,
  useReplayPlusState,
  useRestoreReplayPlus,
  useSaveNotificationPreferences,
} from "@/features/account/account-service";
import {
  useReplayNotificationPermission,
  useRequestReplayNotificationPermission,
  useScheduleTestNightlyMemoryNotification,
} from "@/features/memory/memory-notification-service";
import { nightlyDeliveryTimeOptions } from "@/features/profile/profile-options";
import { formatNotificationTimeLabel } from "@/features/profile/profile-personalization";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";
import type { NotificationPreferences } from "@/types/replay";

function formatExpiry(value: string | null) {
  if (!value) {
    return "No active renewal window";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function SettingsScreen() {
  const { notificationDraft, profile, session, signOut, updateNotificationDraft } = useReplayApp();
  const replayPlusQuery = useReplayPlusState(session?.user.id);
  const isBetaAdminQuery = useIsBetaAdmin();
  const notificationPermissionQuery = useReplayNotificationPermission();
  const requestPermissionMutation = useRequestReplayNotificationPermission();
  const scheduleTestMutation = useScheduleTestNightlyMemoryNotification();
  const restoreMutation = useRestoreReplayPlus(session?.user.id);
  const saveNotificationPreferencesMutation = useSaveNotificationPreferences(session?.user.id);
  const [draft, setDraft] = useState<NotificationPreferences>(notificationDraft);
  const [errorText, setErrorText] = useState("");

  if (!session) {
    return <Redirect href="/login" />;
  }

  const replayPlusState = replayPlusQuery.data;
  const notificationPermission = notificationPermissionQuery.data;

  const handleSavePreferences = async () => {
    setErrorText("");

    try {
      const saved = await saveNotificationPreferencesMutation.mutateAsync(draft);
      updateNotificationDraft(saved);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't save notification settings.",
      );
    }
  };

  const handleEnableNotifications = async () => {
    setErrorText("");

    try {
      await requestPermissionMutation.mutateAsync(draft);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't request notification permissions.",
      );
    }
  };

  const handleScheduleTestReminder = async () => {
    setErrorText("");

    try {
      await scheduleTestMutation.mutateAsync();
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Replay '95 couldn't schedule the test reminder.",
      );
    }
  };

  const handleRestore = async () => {
    setErrorText("");

    try {
      await restoreMutation.mutateAsync();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't restore Replay+.",
      );
    }
  };

  const handleSignOut = async () => {
    setErrorText("");

    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't sign out right now.",
      );
    }
  };

  return (
    <RetroScreen
      eyebrow="Settings"
      title={`${profile?.name ?? "Your"} account and nightly timing`}
      subtitle="Replay+ status, notification timing, and account controls in one place."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Replay+ status</Text>
        {replayPlusQuery.isLoading || !replayPlusState ? (
          <Text style={styles.copy}>Loading Replay+ status…</Text>
        ) : (
          <>
            <Text style={styles.copy}>
              {formatReplayPlusStatus(replayPlusState.status)}. Expiry window:{" "}
              {formatExpiry(replayPlusState.expiresAt)}.
            </Text>
            <View style={styles.buttonColumn}>
              {!replayPlusState.isPaid ? (
                <PrimaryButton label="Open Replay+" onPress={() => router.push("/paywall")} />
              ) : null}
              <PrimaryButton
                label={restoreMutation.isPending ? "Restoring..." : "Restore Replay+ status"}
                onPress={() => {
                  void handleRestore();
                }}
                disabled={restoreMutation.isPending}
                variant="secondary"
              />
            </View>
          </>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Notification timing</Text>
        <Text style={styles.copy}>
          Current nightly window: {formatNotificationTimeLabel(draft.nightlyDeliveryTime)} in{" "}
          {draft.timezone}.
        </Text>
        <View style={styles.preferenceBlock}>
          <Text style={styles.label}>Nightly delivery time</Text>
          <View style={styles.chipRow}>
            {nightlyDeliveryTimeOptions.map((option) => (
              <OptionChip
                key={option.value}
                label={option.label}
                onPress={() =>
                  setDraft((current) => ({
                    ...current,
                    nightlyDeliveryTime: option.value,
                  }))
                }
                selected={draft.nightlyDeliveryTime === option.value}
              />
            ))}
          </View>
        </View>
        <View style={styles.preferenceBlock}>
          <Text style={styles.label}>Nightly reminders</Text>
          <View style={styles.chipRow}>
            <OptionChip
              label="Enabled"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  dailyEnabled: true,
                }))
              }
              selected={draft.dailyEnabled}
            />
            <OptionChip
              label="Paused"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  dailyEnabled: false,
                }))
              }
              selected={!draft.dailyEnabled}
            />
          </View>
        </View>
        <View style={styles.preferenceBlock}>
          <Text style={styles.label}>Weekend quest reminders</Text>
          <View style={styles.chipRow}>
            <OptionChip
              label="Enabled"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  weekendQuestEnabled: true,
                }))
              }
              selected={draft.weekendQuestEnabled}
            />
            <OptionChip
              label="Paused"
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  weekendQuestEnabled: false,
                }))
              }
              selected={!draft.weekendQuestEnabled}
            />
          </View>
        </View>
        <PrimaryButton
          label={
            saveNotificationPreferencesMutation.isPending ? "Saving..." : "Save notification settings"
          }
          onPress={() => {
            void handleSavePreferences();
          }}
          disabled={saveNotificationPreferencesMutation.isPending}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Device notification access</Text>
        <Text style={styles.copy}>
          {notificationPermission?.granted
            ? "Push access is enabled on this device."
            : notificationPermission?.isSupported === false
              ? "Push notifications require a native iOS or Android build."
              : "Push access is still off on this device."}
        </Text>
        <View style={styles.buttonColumn}>
          {!notificationPermission?.granted ? (
            <PrimaryButton
              label={
                requestPermissionMutation.isPending
                  ? "Requesting..."
                  : "Enable device notifications"
              }
              onPress={() => {
                void handleEnableNotifications();
              }}
              disabled={
                requestPermissionMutation.isPending ||
                notificationPermission?.isSupported === false
              }
            />
          ) : null}
          <PrimaryButton
            label={scheduleTestMutation.isPending ? "Scheduling..." : "Send 5-second test reminder"}
            onPress={() => {
              void handleScheduleTestReminder();
            }}
            disabled={!notificationPermission?.granted || scheduleTestMutation.isPending}
            variant="secondary"
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.copy}>
          Sign out clears your session on this device. Sign back in anytime with the same email.
        </Text>
        {isBetaAdminQuery.data ? (
          <PrimaryButton
            label="Open beta dashboard"
            onPress={() => router.push("/analytics")}
            variant="secondary"
          />
        ) : null}
        <PrimaryButton
          label="Sign out"
          onPress={() => {
            void handleSignOut();
          }}
          variant="secondary"
        />
      </SurfaceCard>

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
  label: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  preferenceBlock: {
    gap: tokens.spacing.sm,
  },
  buttonColumn: {
    gap: tokens.spacing.sm,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
