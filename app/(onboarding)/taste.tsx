import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { SurfaceCard } from "@/components/surface-card";
import {
  blockOptions,
  consoleOptions,
  mallOptions,
  moodOptions,
} from "@/features/profile/profile-options";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

export default function TasteScreen() {
  const { draftProfile, updateDraftProfile } = useReplayApp();

  const canContinue =
    draftProfile.consoleChoice.trim().length > 0 &&
    draftProfile.mallStore.trim().length > 0 &&
    draftProfile.channelBlock.trim().length > 0 &&
    draftProfile.musicMood.trim().length > 0;

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("taste") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Taste anchors"
      title="Pick the preferences that actually narrow the decade down"
      subtitle="These are the short answers Replay uses to avoid one-size-fits-all nostalgia copy."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>After-school wiring</Text>

        <Text style={styles.label}>Console allegiance</Text>
        <View style={styles.chipRow}>
          {consoleOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateDraftProfile({ consoleChoice: option })}
              selected={draftProfile.consoleChoice === option}
            />
          ))}
        </View>

        <Text style={styles.label}>Mall store you pulled toward first</Text>
        <View style={styles.chipRow}>
          {mallOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateDraftProfile({ mallStore: option })}
              selected={draftProfile.mallStore === option}
            />
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.label}>TV block with actual appointment-viewing power</Text>
        <View style={styles.chipRow}>
          {blockOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateDraftProfile({ channelBlock: option })}
              selected={draftProfile.channelBlock === option}
            />
          ))}
        </View>

        <Text style={styles.label}>Music energy</Text>
        <View style={styles.chipRow}>
          {moodOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateDraftProfile({ musicMood: option })}
              selected={draftProfile.musicMood === option}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back"
            onPress={() => goBackOrReplace("/(onboarding)/profile")}
            variant="secondary"
          />
          <PrimaryButton
            label="Continue to the memory anchor"
            onPress={() => router.push("/(onboarding)/dream-concert")}
            disabled={!canContinue}
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
  actions: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});
