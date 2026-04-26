import { Redirect, Slot, router } from "expo-router";

import { LoadingScreen } from "@/components/loading-screen";
import { useReplayApp } from "@/state/replay-context";

export const ONBOARDING_STEPS = [
  "welcome",
  "profile",
  "taste",
  "dream-concert",
  "avatar",
  "notifications",
  "done",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function goBackOrReplace(fallbackHref: Parameters<typeof router.replace>[0]) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallbackHref);
}

export default function OnboardingLayout() {
  const { hasCompletedOnboarding, isBootstrapping, session } = useReplayApp();

  if (isBootstrapping) {
    return (
      <LoadingScreen
        title="Loading your onboarding tape"
        subtitle="Checking auth and getting the first setup flow ready."
      />
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/today" />;
  }

  return <Slot />;
}
