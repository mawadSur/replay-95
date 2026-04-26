import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { PrimaryButton } from "@/components/primary-button";
import { SurfaceCard } from "@/components/surface-card";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS } from "./_layout";

function GateRow({
  body,
  isEnabled,
  title,
  onToggle,
}: {
  body: string;
  isEnabled: boolean;
  title: string;
  onToggle: () => void;
}) {
  return (
    <View style={styles.gateRow}>
      <View style={styles.gateCopy}>
        <Text style={styles.gateTitle}>{title}</Text>
        <Text style={styles.gateBody}>{body}</Text>
      </View>
      <Switch
        onValueChange={onToggle}
        thumbColor={isEnabled ? tokens.colors.accentMint : "#F4F3F4"}
        trackColor={{ false: "rgba(255,255,255,0.14)", true: "rgba(155,255,174,0.4)" }}
        value={isEnabled}
      />
    </View>
  );
}

export default function WelcomeScreen() {
  const [hasConfirmedAge, setHasConfirmedAge] = useState(false);
  const [hasConfirmedCohort, setHasConfirmedCohort] = useState(false);

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("welcome") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Welcome"
      title="Build the nostalgia profile first"
      subtitle="Replay '95 works best when it knows which version of the decade actually belonged to you."
    >
      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Beta fit check</Text>
        <Text style={styles.copy}>
          This beta is intentionally narrow. It is built for adults who can answer 90s prompts from lived memory, not from retro mood-board guesswork.
        </Text>
        <View style={styles.gateColumn}>
          <GateRow
            title="I am 18 or older."
            body="The launch beta is adults-only and framed around personal memory prompts."
            isEnabled={hasConfirmedAge}
            onToggle={() => setHasConfirmedAge((current) => !current)}
          />
          <GateRow
            title="I understand this cohort is tuned for birth years 1980-1995."
            body="If you are outside that range, the profile flow will stop before save so the prompt tone stays coherent."
            isEnabled={hasConfirmedCohort}
            onToggle={() => setHasConfirmedCohort((current) => !current)}
          />
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>What happens next</Text>
        <Text style={styles.copy}>
          You will set the yearbook basics, taste anchors, one memory-heavy concert answer, a school-photo look, and the nightly delivery window.
        </Text>
        <PrimaryButton
          label="Start the profile"
          onPress={() => router.push("/(onboarding)/profile")}
          disabled={!hasConfirmedAge || !hasConfirmedCohort}
        />
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
  gateColumn: {
    gap: tokens.spacing.md,
  },
  gateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: tokens.spacing.md,
  },
  gateCopy: {
    flex: 1,
    gap: tokens.spacing.xs,
  },
  gateTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 15,
  },
  gateBody: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
