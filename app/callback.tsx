import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { LoadingScreen } from "@/components/loading-screen";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

const HYDRATE_TIMEOUT_MS = 8000;

export default function CallbackScreen() {
  const { authCallbackError, clearAuthCallbackError, isBootstrapping, session } =
    useReplayApp();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (session) {
      return;
    }

    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, HYDRATE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [session]);

  if (!isBootstrapping && session) {
    return <Redirect href="/" />;
  }

  const shouldShowRetry = authCallbackError !== null || (hasTimedOut && !session);

  if (shouldShowRetry) {
    const handleTryAgain = () => {
      clearAuthCallbackError();
      router.replace("/login");
    };

    return (
      <RetroScreen
        eyebrow="Sign-in"
        title="Couldn't open that link"
        subtitle="The magic link may have expired or been opened on a different device."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.copy}>
            {authCallbackError ??
              "We didn't get a session back from that link. Request a new one and open it on this device."}
          </Text>
          <PrimaryButton label="Request a new link" onPress={handleTryAgain} />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  if (!isBootstrapping && !session) {
    return <Redirect href="/login" />;
  }

  return (
    <LoadingScreen
      title="Opening your sign-in tape"
      subtitle="Checking the Replay '95 link from your email."
    />
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.md,
  },
  copy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
