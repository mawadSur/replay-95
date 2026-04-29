import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { OnboardingShell } from "@/components/onboarding-shell";
import { PrimaryButton } from "@/components/primary-button";
import { SchoolPhotoCard } from "@/components/school-photo-card";
import { SurfaceCard } from "@/components/surface-card";
import {
  buildProfileSignal,
  formatNotificationTimeLabel,
} from "@/features/profile/profile-personalization";
import { STARTING_POG_BALANCE } from "@/features/profile/profile-service";
import { reportError } from "@/lib/error-reporting";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

import { ONBOARDING_STEPS, goBackOrReplace } from "./_layout";

// Supabase PostgrestError is not an Error instance but has these fields.
function describeSaveError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: string; details?: string; hint?: string; code?: string };
    const parts = [e.message, e.details, e.hint, e.code ? `(code ${e.code})` : null].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" — ");
    }
  }
  return "We couldn't save your profile yet. Try again.";
}

export default function DoneScreen() {
  const {
    completeOnboarding,
    draftProfile,
    isSavingOnboarding,
    notificationDraft,
  } = useReplayApp();
  const [errorText, setErrorText] = useState("");
  const signal = buildProfileSignal(draftProfile);

  const handleEnterReplay = async () => {
    setErrorText("");

    try {
      await completeOnboarding();
      // The onboarding layout (`(onboarding)/_layout.tsx`) redirects to
      // `/(tabs)/today` once `hasCompletedOnboarding` flips, so we don't
      // race a manual `router.replace` against that gate here.
    } catch (error) {
      reportError(error, { stage: "onboarding.completeOnboarding" });
      setErrorText(describeSaveError(error));
    }
  };

  return (
    <OnboardingShell
      step={ONBOARDING_STEPS.indexOf("done") + 1}
      totalSteps={ONBOARDING_STEPS.length}
      eyebrow="Profile locked"
      title="The nostalgia profile is ready to save"
      subtitle="One final review, then we save your profile, kick off your pog balance, and drop you into Tonight."
    >
      <SurfaceCard style={styles.card}>
        <SchoolPhotoCard
          caption="Final school-photo card"
          profile={draftProfile}
          footerNote={`Nightly delivery is set for ${formatNotificationTimeLabel(
            notificationDraft.nightlyDeliveryTime,
          )} in ${notificationDraft.timezone}.`}
        />
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Profile signal</Text>
        <Text style={styles.copy}>{signal.hometownLine}</Text>
        <Text style={styles.copy}>{signal.tasteLine}</Text>
        <Text style={styles.copy}>{signal.concertLine}</Text>
        <Text style={styles.copy}>
          Opening balance: {STARTING_POG_BALANCE} pogs.
        </Text>
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        <PrimaryButton
          label={isSavingOnboarding ? "Saving your Replay..." : "Enter Replay '95'"}
          onPress={() => {
            void handleEnterReplay();
          }}
          disabled={isSavingOnboarding}
        />
        <PrimaryButton
          label="Back"
          onPress={() => goBackOrReplace("/(onboarding)/notifications")}
          variant="secondary"
          disabled={isSavingOnboarding}
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
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
