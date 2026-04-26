import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/loading-screen";
import { useReplayApp } from "@/state/replay-context";

export default function Index() {
  const { hasCompletedOnboarding, isBootstrapping, session } = useReplayApp();

  if (isBootstrapping) {
    return (
      <LoadingScreen
        title="Loading your Replay"
        subtitle="Checking auth, session state, and the current profile."
      />
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={hasCompletedOnboarding ? "/(tabs)/today" : "/(onboarding)"} />;
}
