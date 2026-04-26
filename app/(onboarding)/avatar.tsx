import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { OptionChip } from "@/components/option-chip";
import { PrimaryButton } from "@/components/primary-button";
import { SchoolPhotoCard } from "@/components/school-photo-card";
import { SurfaceCard } from "@/components/surface-card";
import {
  braceletOptions,
  outfitOptions,
  trapperOptions,
} from "@/features/profile/profile-options";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

export default function AvatarScreen() {
  const { draftProfile, updateAvatar } = useReplayApp();

  const canContinue =
    draftProfile.avatar.outfit.trim().length > 0 &&
    draftProfile.avatar.trapperPattern.trim().length > 0 &&
    draftProfile.avatar.braceletColor.trim().length > 0;

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("avatar") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Yearbook mode"
      title="Pick the photo they would print forever"
      subtitle="The beta avatar is intentionally simple, but it should still feel like a recognizable version of your school-photo self."
    >
      <SurfaceCard style={styles.card}>
        <SchoolPhotoCard
          caption="1995 school-photo preview"
          profile={draftProfile}
          footerNote="The outfit, pattern, and bracelet stay visible together so the profile card always reads as one look."
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.label}>Outfit</Text>
        <View style={styles.chipRow}>
          {outfitOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateAvatar({ outfit: option })}
              selected={draftProfile.avatar.outfit === option}
            />
          ))}
        </View>

        <Text style={styles.label}>Trapper Keeper pattern</Text>
        <View style={styles.chipRow}>
          {trapperOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateAvatar({ trapperPattern: option })}
              selected={draftProfile.avatar.trapperPattern === option}
            />
          ))}
        </View>

        <Text style={styles.label}>Slap bracelet color</Text>
        <View style={styles.chipRow}>
          {braceletOptions.map((option) => (
            <OptionChip
              key={option}
              label={option}
              onPress={() => updateAvatar({ braceletColor: option })}
              selected={draftProfile.avatar.braceletColor === option}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back"
            onPress={() => goBackOrReplace("/(onboarding)/dream-concert")}
            variant="secondary"
          />
          <PrimaryButton
            label="Continue to delivery setup"
            onPress={() => router.push("/(onboarding)/notifications")}
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
