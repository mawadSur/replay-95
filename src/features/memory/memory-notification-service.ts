import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import type { NotificationResponse } from "expo-notifications";
import { Platform } from "react-native";

import { formatNotificationTimeLabel } from "@/features/profile/profile-personalization";
import type { NotificationPreferences } from "@/types/replay";

const replayNotificationPermissionKey = ["replay-notification-permission"];
const nightlyMemoryChannelId = "nightly-memory";
const nightlyMemoryRoute = "/(tabs)/today";
const nightlyMemoryNotificationStorageKey = "replay95.nightlyMemoryNotificationId";
const knownReplayRoutes = new Set<string>([
  nightlyMemoryRoute,
  "/(tabs)/notes",
  "/(tabs)/quests",
  "/(tabs)/bedroom",
]);

let hasConfiguredNotificationHandler = false;
let hasConfiguredAndroidChannel = false;

function configureNotificationHandler() {
  if (hasConfiguredNotificationHandler || Platform.OS === "web") {
    return;
  }

  hasConfiguredNotificationHandler = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android" || hasConfiguredAndroidChannel) {
    return;
  }

  await Notifications.setNotificationChannelAsync(nightlyMemoryChannelId, {
    name: "Nightly Memory Channel",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });

  hasConfiguredAndroidChannel = true;
}

function parseHourMinute(value: string) {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Invalid notification time: ${value}`);
  }

  return { hour, minute };
}

export type ReplayNotificationPermissionState = {
  canAskAgain: boolean;
  granted: boolean;
  isSupported: boolean;
  status: string;
};

export type ReplayNotificationRoute = {
  id: string;
  params: { entry: string };
  route: string;
};

export async function getReplayNotificationPermissionState(): Promise<ReplayNotificationPermissionState> {
  if (Platform.OS === "web") {
    return {
      canAskAgain: false,
      granted: false,
      isSupported: false,
      status: "unsupported",
    };
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();

    return {
      canAskAgain: permissions.canAskAgain,
      granted: permissions.granted,
      isSupported: true,
      status: permissions.status,
    };
  } catch {
    return {
      canAskAgain: false,
      granted: false,
      isSupported: false,
      status: "unsupported",
    };
  }
}

export async function requestReplayNotificationPermissions() {
  if (Platform.OS === "web") {
    return {
      canAskAgain: false,
      granted: false,
      isSupported: false,
      status: "unsupported",
    } satisfies ReplayNotificationPermissionState;
  }

  const permissions = await Notifications.requestPermissionsAsync();

  return {
    canAskAgain: permissions.canAskAgain,
    granted: permissions.granted,
    isSupported: true,
    status: permissions.status,
  } satisfies ReplayNotificationPermissionState;
}

async function getStoredNightlyMemoryNotificationId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(nightlyMemoryNotificationStorageKey);
  } catch {
    return null;
  }
}

async function persistNightlyMemoryNotificationId(identifier: string | null) {
  try {
    if (identifier) {
      await AsyncStorage.setItem(nightlyMemoryNotificationStorageKey, identifier);
    } else {
      await AsyncStorage.removeItem(nightlyMemoryNotificationStorageKey);
    }
  } catch {
    // Storage failure should not block scheduling.
  }
}

async function cancelStoredNightlyMemoryNotification() {
  const storedId = await getStoredNightlyMemoryNotificationId();
  if (!storedId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(storedId);
  } catch {
    // The identifier may be stale (e.g. notification already fired or was
    // cancelled out-of-band). Falling through is safe — we'll re-schedule next.
  }

  await persistNightlyMemoryNotificationId(null);
}

export async function clearNightlyMemoryNotifications() {
  if (Platform.OS === "web") {
    return;
  }

  await cancelStoredNightlyMemoryNotification();
}

export async function syncNightlyMemoryNotifications(
  notificationPreferences: NotificationPreferences,
) {
  configureNotificationHandler();

  if (Platform.OS === "web") {
    return null;
  }

  await ensureAndroidNotificationChannel();

  if (!notificationPreferences.dailyEnabled) {
    await clearNightlyMemoryNotifications();
    return null;
  }

  const permissionState = await getReplayNotificationPermissionState();
  if (!permissionState.granted) {
    return null;
  }

  const { hour, minute } = parseHourMinute(notificationPreferences.nightlyDeliveryTime);
  await cancelStoredNightlyMemoryNotification();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Tonight's Memory Channel is ready",
      body: `Jump back in around ${formatNotificationTimeLabel(
        notificationPreferences.nightlyDeliveryTime,
      )} and drop into tonight's prompts.`,
      data: {
        entry: "notification",
        route: nightlyMemoryRoute,
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await persistNightlyMemoryNotificationId(identifier);

  return identifier;
}

export async function scheduleTestNightlyMemoryNotification() {
  configureNotificationHandler();

  if (Platform.OS === "web") {
    throw new Error("Local nightly test reminders require a native build.");
  }

  await ensureAndroidNotificationChannel();

  const permissionState = await getReplayNotificationPermissionState();
  if (!permissionState.granted) {
    throw new Error("Enable nightly alerts before scheduling a test reminder.");
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Replay '95 test reminder",
      body: "Tap this and it should drop you straight into Tonight.",
      data: {
        entry: "notification",
        route: nightlyMemoryRoute,
      },
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}

export function extractReplayNotificationRoute(
  response: NotificationResponse | null,
): ReplayNotificationRoute | null {
  if (!response) {
    return null;
  }

  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  const rawRoute = typeof data?.route === "string" ? data.route : null;

  if (!rawRoute || !knownReplayRoutes.has(rawRoute)) {
    return null;
  }

  const entry = typeof data?.entry === "string" ? data.entry : "notification";

  return {
    id: response.notification.request.identifier,
    params: { entry },
    route: rawRoute,
  };
}

export function useReplayNotificationPermission() {
  return useQuery({
    queryKey: replayNotificationPermissionKey,
    queryFn: getReplayNotificationPermissionState,
  });
}

export function useRequestReplayNotificationPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationPreferences?: NotificationPreferences) => {
      const permissionState = await requestReplayNotificationPermissions();

      if (permissionState.granted && notificationPreferences) {
        await syncNightlyMemoryNotifications(notificationPreferences);
      }

      return permissionState;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: replayNotificationPermissionKey });
    },
  });
}

export function useScheduleTestNightlyMemoryNotification() {
  return useMutation({
    mutationFn: scheduleTestNightlyMemoryNotification,
  });
}
