import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { configurePurchases } from "@/features/account/revenuecat-service";
import { extractReplayNotificationRoute } from "@/features/memory/memory-notification-service";
import { initErrorReporting } from "@/lib/error-reporting";
import { queryClient } from "@/lib/query-client";
import { ReplayAppProvider } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

initErrorReporting();
void configurePurchases();

export default function RootLayout() {
  const router = useRouter();
  const lastHandledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    const handleNotificationRoute = (response: Notifications.NotificationResponse | null) => {
      const route = extractReplayNotificationRoute(response);

      if (!route || lastHandledNotificationId.current === route.id) {
        return;
      }

      lastHandledNotificationId.current = route.id;
      router.push({
        pathname: route.route as never,
        params: route.params,
      });
    };

    if (Platform.OS !== "web") {
      handleNotificationRoute(Notifications.getLastNotificationResponse());

      const subscription = Notifications.addNotificationResponseReceivedListener(
        handleNotificationRoute,
      );

      return () => {
        subscription.remove();
      };
    }
  }, [router]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ReplayAppProvider>
          <StatusBar barStyle="light-content" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: tokens.colors.background },
            }}
          />
        </ReplayAppProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
