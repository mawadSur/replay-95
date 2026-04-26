import { supabase } from "@/lib/supabase";
import type { NotificationPreferences, ReplayProfile } from "@/types/replay";

import {
  buildDefaultNotificationTime,
  resolveDeviceTimezone,
} from "./profile-personalization";

export const STARTING_POG_BALANCE = 125;

type ProfileRow = {
  display_name: string;
  hometown: string;
  birth_year: number;
  console_choice: string;
  mall_store: string;
  channel_block: string;
  dream_concert: string;
  music_mood: string;
};

type AvatarRow = {
  outfit: string;
  trapper_pattern: string;
  bracelet_color: string;
};

type WalletRow = {
  balance?: number;
};

type NotificationRow = {
  nightly_delivery_time?: string;
  timezone?: string;
  daily_enabled?: boolean;
  weekend_quest_enabled?: boolean;
};

type SubscriptionRow = {
  expires_at?: string | null;
  status?: "free" | "trialing" | "active" | "past_due" | "canceled";
};

export type ReplayViewerState = {
  profile: ReplayProfile;
  walletBalance: number;
  notificationPreferences: NotificationPreferences;
  subscriptionStatus: "free" | "trialing" | "active" | "past_due" | "canceled";
};

function normalizeSubscriptionStatus(
  subscription: SubscriptionRow | null,
): "free" | "trialing" | "active" | "past_due" | "canceled" {
  const status = subscription?.status ?? "free";

  if (
    (status === "active" || status === "trialing") &&
    subscription?.expires_at &&
    new Date(subscription.expires_at).getTime() <= Date.now()
  ) {
    return "canceled";
  }

  return status;
}

function mapProfile(profile: ProfileRow, avatar: AvatarRow | null): ReplayProfile {
  return {
    name: profile.display_name,
    hometown: profile.hometown,
    birthYear: profile.birth_year,
    consoleChoice: profile.console_choice,
    mallStore: profile.mall_store,
    channelBlock: profile.channel_block,
    dreamConcert: profile.dream_concert,
    musicMood: profile.music_mood,
    avatar: {
      outfit: avatar?.outfit ?? "Denim jacket",
      trapperPattern: avatar?.trapper_pattern ?? "Galaxy checker",
      braceletColor: avatar?.bracelet_color ?? "Slime green",
    },
  };
}

export async function fetchViewerState(userId: string): Promise<ReplayViewerState | null> {
  const [
    profileResult,
    avatarResult,
    walletResult,
    notificationResult,
    subscriptionResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, hometown, birth_year, console_choice, mall_store, channel_block, dream_concert, music_mood",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("avatar_choices")
      .select("outfit, trapper_pattern, bracelet_color")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("pog_wallets").select("balance").eq("user_id", userId).maybeSingle(),
    supabase
      .from("notification_preferences")
      .select("nightly_delivery_time, timezone, daily_enabled, weekend_quest_enabled")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("subscription_status")
      .select("status, expires_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (avatarResult.error) {
    throw avatarResult.error;
  }
  if (walletResult.error) {
    throw walletResult.error;
  }
  if (notificationResult.error) {
    throw notificationResult.error;
  }
  if (subscriptionResult.error) {
    throw subscriptionResult.error;
  }

  const profile = profileResult.data as ProfileRow | null;
  const avatar = avatarResult.data as AvatarRow | null;
  const wallet = walletResult.data as WalletRow | null;
  const notification = notificationResult.data as NotificationRow | null;
  const subscription = subscriptionResult.data as SubscriptionRow | null;

  if (!profile) {
    return null;
  }

  return {
    profile: mapProfile(profile, avatar),
    walletBalance: wallet?.balance ?? STARTING_POG_BALANCE,
    notificationPreferences: {
      nightlyDeliveryTime:
        notification?.nightly_delivery_time ?? buildDefaultNotificationTime(),
      timezone: notification?.timezone ?? resolveDeviceTimezone(),
      dailyEnabled: notification?.daily_enabled ?? true,
      weekendQuestEnabled: notification?.weekend_quest_enabled ?? true,
    },
    subscriptionStatus: normalizeSubscriptionStatus(subscription),
  };
}

export async function saveOnboardingProfile(
  userId: string,
  draftProfile: ReplayProfile,
  notificationPreferences: NotificationPreferences,
) {
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      display_name: draftProfile.name,
      hometown: draftProfile.hometown,
      birth_year: draftProfile.birthYear,
      console_choice: draftProfile.consoleChoice,
      mall_store: draftProfile.mallStore,
      channel_block: draftProfile.channelBlock,
      dream_concert: draftProfile.dreamConcert,
      music_mood: draftProfile.musicMood,
    },
    { onConflict: "user_id" },
  );

  if (profileError) {
    throw profileError;
  }

  const [avatarResult, walletResult, notificationResult] = await Promise.all([
    supabase.from("avatar_choices").upsert(
      {
        user_id: userId,
        outfit: draftProfile.avatar.outfit,
        trapper_pattern: draftProfile.avatar.trapperPattern,
        bracelet_color: draftProfile.avatar.braceletColor,
      },
      { onConflict: "user_id" },
    ),
    supabase.from("pog_wallets").upsert(
      {
        user_id: userId,
        balance: STARTING_POG_BALANCE,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    ),
    supabase.from("notification_preferences").upsert(
      {
        user_id: userId,
        timezone: notificationPreferences.timezone || resolveDeviceTimezone(),
        nightly_delivery_time:
          notificationPreferences.nightlyDeliveryTime || buildDefaultNotificationTime(),
        daily_enabled: notificationPreferences.dailyEnabled,
        weekend_quest_enabled: notificationPreferences.weekendQuestEnabled,
      },
      { onConflict: "user_id" },
    ),
  ]);

  if (avatarResult.error) {
    throw avatarResult.error;
  }
  if (walletResult.error) {
    throw walletResult.error;
  }
  if (notificationResult.error) {
    throw notificationResult.error;
  }

  const viewer = await fetchViewerState(userId);
  if (!viewer) {
    throw new Error("Onboarding save succeeded, but the profile could not be reloaded.");
  }

  return viewer;
}
