import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { SurfaceCard } from "@/components/surface-card";
import {
  useReplayNotificationPermission,
  useRequestReplayNotificationPermission,
} from "@/features/memory/memory-notification-service";
import { nightlyDeliveryTimeOptions } from "@/features/profile/profile-options";
import { formatNotificationTimeLabel } from "@/features/profile/profile-personalization";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

function PreferenceRow({
  body,
  title,
  value,
  onToggle,
}: {
  body: string;
  title: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceCopy}>
        <Text style={styles.preferenceTitle}>{title}</Text>
        <Text style={styles.preferenceBody}>{body}</Text>
      </View>
      <Switch
        onValueChange={onToggle}
        thumbColor={value ? tokens.colors.accentMint : "#F4F3F4"}
        trackColor={{ false: "rgba(255,255,255,0.14)", true: "rgba(155,255,174,0.4)" }}
        value={value}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const { notificationDraft, updateNotificationDraft } = useReplayApp();
  const notificationPermissionQuery = useReplayNotificationPermission();
  const requestNotificationPermissionMutation = useRequestReplayNotificationPermission();
  const [errorText, setErrorText] = useState("");

  const handleAllowNightlyAlerts = async () => {
    setErrorText("");
    try {
      await requestNotificationPermissionMutation.mutateAsync(notificationDraft);
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "We couldn't enable nightly alerts. Check the OS notification settings and try again.",
      );
    }
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("notifications") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Delivery setup"
      title="Choose when Replay should show up"
      subtitle="Pick a nightly window and which reminders you want. You can change any of this later from Settings."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Nightly drop window</Text>
        <Text style={styles.copy}>
          Current timezone: {notificationDraft.timezone}
        </Text>
        <View style={styles.chipRow}>
          {nightlyDeliveryTimeOptions.map((option) => (
            <OptionChip
              key={option.value}
              label={option.label}
              onPress={() => updateNotificationDraft({ nightlyDeliveryTime: option.value })}
              selected={notificationDraft.nightlyDeliveryTime === option.value}
            />
          ))}
        </View>
        <Text style={styles.helperText}>
          Replay will aim for {formatNotificationTimeLabel(notificationDraft.nightlyDeliveryTime)} on this device timezone.
        </Text>
        <Text style={styles.helperText}>
          {notificationPermissionQuery.data?.granted
            ? "Nightly alerts are already enabled on this device."
            : notificationPermissionQuery.data?.isSupported === false
              ? "Native nightly alerts are only available in iOS or Android builds."
              : "You can allow alerts now, or turn them on from Tonight later."}
        </Text>
        <PrimaryButton
          label={
            requestNotificationPermissionMutation.isPending
              ? "Enabling..."
              : notificationPermissionQuery.data?.granted
                ? "Nightly alerts enabled"
                : "Allow nightly alerts"
          }
          onPress={() => {
            void handleAllowNightlyAlerts();
          }}
          disabled={
            requestNotificationPermissionMutation.isPending ||
            notificationPermissionQuery.data?.granted ||
            notificationPermissionQuery.data?.isSupported === false
          }
          variant="secondary"
        />
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Notification preferences</Text>
        <View style={styles.preferenceColumn}>
          <PreferenceRow
            title="Daily memory prompts"
            body="Keep the nightly nudge on for the Tonight flow."
            value={notificationDraft.dailyEnabled}
            onToggle={() =>
              updateNotificationDraft({ dailyEnabled: !notificationDraft.dailyEnabled })
            }
          />
          <PreferenceRow
            title="Weekend quest reminders"
            body="Let Replay surface Saturday quest drops separately."
            value={notificationDraft.weekendQuestEnabled}
            onToggle={() =>
              updateNotificationDraft({
                weekendQuestEnabled: !notificationDraft.weekendQuestEnabled,
              })
            }
          />
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back"
            onPress={() => goBackOrReplace("/(onboarding)/avatar")}
            variant="secondary"
          />
          <PrimaryButton
            label="Review the profile"
            onPress={() => router.push("/(onboarding)/done")}
          />
        </View>
      </SurfaceCard>
    </OnboardingShell>
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
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  helperText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  preferenceColumn: {
    gap: tokens.spacing.md,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: tokens.spacing.md,
  },
  preferenceCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  preferenceTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 15,
  },
  preferenceBody: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});
