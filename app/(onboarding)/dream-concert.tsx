import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { PrimaryButton } from "@/components/primary-button";
import { SurfaceCard } from "@/components/surface-card";
import { buildProfileSignal } from "@/features/profile/profile-personalization";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

export default function DreamConcertScreen() {
  const { draftProfile, updateDraftProfile } = useReplayApp();
  const signal = buildProfileSignal(draftProfile);
  const canContinue = draftProfile.dreamConcert.trim().length > 0;

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("dream-concert") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Memory anchor"
      title="Give the app one answer it can keep calling back to"
      subtitle="This should be specific enough that it instantly sounds like you and not like a generic 90s playlist ad."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Dream concert, 1995 to 1999</Text>
        <TextInput
          multiline
          onChangeText={(value) => updateDraftProfile({ dreamConcert: value })}
          placeholder="No Doubt at a county fair"
          placeholderTextColor={tokens.colors.textFaint}
          style={styles.textArea}
          textAlignVertical="top"
          value={draftProfile.dreamConcert}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>What Replay is already picking up</Text>
        <Text style={styles.copy}>{signal.hometownLine}</Text>
        <Text style={styles.copy}>{signal.tasteLine}</Text>
        <Text style={styles.copy}>{signal.teaserLine}</Text>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back"
            onPress={() => goBackOrReplace("/(onboarding)/taste")}
            variant="secondary"
          />
          <PrimaryButton
            label="Continue to the yearbook look"
            onPress={() => router.push("/(onboarding)/avatar")}
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
  copy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});
