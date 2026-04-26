import { Redirect, Tabs } from "expo-router";

import { LoadingScreen } from "@/components/loading-screen";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

export default function TabsLayout() {
  const { hasCompletedOnboarding, isBootstrapping, session } = useReplayApp();

  if (isBootstrapping) {
    return (
      <LoadingScreen
        title="Loading the nightly loop"
        subtitle="Checking your account and hydrating the tab shell."
      />
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.accentMint,
        tabBarInactiveTintColor: tokens.colors.textFaint,
        tabBarStyle: {
          backgroundColor: "rgba(19, 15, 32, 0.96)",
          borderTopColor: tokens.colors.line,
          height: 82,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: tokens.typography.label,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen name="today" options={{ title: "Tonight" }} />
      <Tabs.Screen name="notes" options={{ title: "Notes" }} />
      <Tabs.Screen name="quests" options={{ title: "Quests" }} />
      <Tabs.Screen name="bedroom" options={{ title: "Bedroom" }} />
    </Tabs>
  );
}
