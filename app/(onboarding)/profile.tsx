import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { PrimaryButton } from "@/components/primary-button";
import { SurfaceCard } from "@/components/surface-card";
import {
  getBirthYearValidationMessage,
  isBirthYearInRange,
} from "@/features/profile/profile-personalization";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

export default function ProfileScreen() {
  const { draftProfile, updateDraftProfile } = useReplayApp();
  const [birthYearInput, setBirthYearInput] = useState(
    Number.isFinite(draftProfile.birthYear) ? String(draftProfile.birthYear) : "",
  );

  const trimmedBirthYear = birthYearInput.trim();
  const birthYear = trimmedBirthYear ? Number(trimmedBirthYear) : null;
  let birthYearError = "";

  if (!trimmedBirthYear) {
    birthYearError =
      "Enter your birth year so the beta knows which slice of the decade to use.";
  } else if (!/^\d{4}$/.test(trimmedBirthYear)) {
    birthYearError = "Use all four digits.";
  } else {
    birthYearError = getBirthYearValidationMessage(birthYear);
  }

  const isFormValid =
    draftProfile.name.trim().length > 0 &&
    draftProfile.hometown.trim().length > 0 &&
    !!trimmedBirthYear &&
    !birthYearError &&
    birthYear !== null &&
    isBirthYearInRange(birthYear);

  const handleContinue = () => {
    if (!isFormValid || birthYear === null) {
      return;
    }

    updateDraftProfile({
      birthYear,
      hometown: draftProfile.hometown.trim(),
      name: draftProfile.name.trim(),
    });
    router.push("/(onboarding)/taste");
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("profile") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="School-photo basics"
      title="Start with the stuff a yearbook would know"
      subtitle="These fields drive tone, age framing, and the first wave of prompt personalization."
    >
      <SurfaceCard style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>First name or nickname</Text>
          <TextInput
            onChangeText={(value) => updateDraftProfile({ name: value })}
            placeholder="Alex"
            placeholderTextColor={tokens.colors.textFaint}
            style={styles.input}
            value={draftProfile.name}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Hometown</Text>
          <TextInput
            onChangeText={(value) => updateDraftProfile({ hometown: value })}
            placeholder="Philadelphia, PA"
            placeholderTextColor={tokens.colors.textFaint}
            style={styles.input}
            value={draftProfile.hometown}
          />
          <Text style={styles.helperText}>Keep it to city and state for beta privacy rules.</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Birth year</Text>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setBirthYearInput}
            placeholder="1988"
            placeholderTextColor={tokens.colors.textFaint}
            style={styles.input}
            value={birthYearInput}
          />
          <Text style={birthYearError ? styles.errorText : styles.helperText}>
            {birthYearError || "Birth year keeps the prompt framing from feeling random."}
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Back"
            onPress={() => goBackOrReplace("/(onboarding)/welcome")}
            variant="secondary"
          />
          <PrimaryButton label="Continue to taste" onPress={handleContinue} disabled={!isFormValid} />
        </View>
      </SurfaceCard>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.md,
  },
  fieldGroup: {
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
  helperText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
});
