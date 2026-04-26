import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { reportError } from "@/lib/error-reporting";
import { supabase } from "@/lib/supabase";
import { useReplayApp } from "@/state/replay-context";
import type { NotificationPreferences } from "@/types/replay";

import {
  isPurchasesAvailable,
  restoreReplayPlusFromStore,
} from "./revenuecat-service";

export type ReplaySubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type ReplayPlusState = {
  expiresAt: string | null;
  isPaid: boolean;
  planCode: string | null;
  provider: string | null;
  status: ReplaySubscriptionStatus;
};

const replayPlusStateKey = (userId: string | undefined) => ["replay-plus-state", userId];

export const isBetaAdminKey = (userId: string | undefined) => [
  "account",
  "is-beta-admin",
  userId ?? "anonymous",
];

const initialReplayPlusState: ReplayPlusState = {
  expiresAt: null,
  isPaid: false,
  planCode: null,
  provider: null,
  status: "free",
};

export function formatReplayPlusStatus(status: ReplaySubscriptionStatus): string {
  switch (status) {
    case "trialing":
      return "Replay+ beta preview";
    case "active":
      return "Replay+ active";
    case "past_due":
      return "Payment issue";
    case "canceled":
      return "Replay+ expired";
    default:
      return "Free tier";
  }
}

async function fetchReplayPlusState(): Promise<ReplayPlusState> {
  const { data, error } = await supabase.rpc("get_replay_plus_state");

  if (error) {
    throw error;
  }

  return {
    expiresAt:
      typeof data?.expiresAt === "string" && data.expiresAt.length > 0 ? data.expiresAt : null,
    isPaid: Boolean(data?.isPaid),
    planCode: typeof data?.planCode === "string" ? data.planCode : null,
    provider: typeof data?.provider === "string" ? data.provider : null,
    status:
      data?.status === "trialing" ||
      data?.status === "active" ||
      data?.status === "past_due" ||
      data?.status === "canceled"
        ? data.status
        : "free",
  };
}

export function useReplayPlusState(userId: string | undefined) {
  return useQuery({
    queryKey: replayPlusStateKey(userId),
    enabled: Boolean(userId),
    queryFn: fetchReplayPlusState,
    placeholderData: initialReplayPlusState,
  });
}

export function useStartReplayPlusTrial(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("You need to sign in before starting Replay+.");
      }

      const { data, error } = await supabase.rpc("begin_beta_replay_plus_trial");

      if (error) {
        throw error;
      }

      return data;
    },
    onMutate: async () => {
      const queryKey = replayPlusStateKey(userId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReplayPlusState>(queryKey);
      const optimistic: ReplayPlusState = {
        expiresAt: previous?.expiresAt ?? null,
        isPaid: true,
        planCode: previous?.planCode ?? null,
        provider: previous?.provider ?? null,
        status: "trialing",
      };
      queryClient.setQueryData<ReplayPlusState>(queryKey, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(replayPlusStateKey(userId), context.previous);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: replayPlusStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ["viewer", userId] }),
        queryClient.invalidateQueries({ queryKey: ["note-compose-state", userId] }),
      ]);
    },
  });
}

export function useRestoreReplayPlus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("You need to sign in before restoring Replay+.");
      }

      // Prefer the real RevenueCat receipt path when available.
      if (isPurchasesAvailable()) {
        try {
          const restored = await restoreReplayPlusFromStore();
          if (restored) {
            return restored;
          }
        } catch (error) {
          reportError(error, { stage: "restoreReplayPlusFromStore" });
          throw error instanceof Error
            ? error
            : new Error("Replay '95 couldn't restore Replay+ from the App Store.");
        }
      }

      // Fallback: refresh updated_at on the existing subscription row.
      // Used when RevenueCat keys aren't configured (web, dev) — never
      // promotes a never-paid account to paid.
      const { data, error } = await supabase.rpc("restore_replay_plus_access");

      if (error) {
        throw error;
      }

      return data;
    },
    onMutate: async () => {
      // Don't optimistically promote to paid — restore on a never-paid account
      // legitimately stays free. We rely on `mutation.isPending` for the
      // "Restoring..." state in the UI, but cancel any in-flight refetch so
      // it doesn't race with the upcoming invalidation.
      await queryClient.cancelQueries({ queryKey: replayPlusStateKey(userId) });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: replayPlusStateKey(userId) }),
        queryClient.invalidateQueries({ queryKey: ["viewer", userId] }),
        queryClient.invalidateQueries({ queryKey: ["note-compose-state", userId] }),
      ]);
    },
  });
}

export function useIsBetaAdmin() {
  const { session } = useReplayApp();
  const userId = session?.user.id;
  return useQuery({
    queryKey: isBetaAdminKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_beta_admin");
      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveNotificationPreferences(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationPreferences: NotificationPreferences) => {
      if (!userId) {
        throw new Error("You need to sign in before updating notification preferences.");
      }

      const { data, error } = await supabase.rpc("save_notification_preferences", {
        p_timezone: notificationPreferences.timezone,
        p_nightly_delivery_time: notificationPreferences.nightlyDeliveryTime,
        p_daily_enabled: notificationPreferences.dailyEnabled,
        p_weekend_quest_enabled: notificationPreferences.weekendQuestEnabled,
      });

      if (error) {
        throw error;
      }

      return {
        dailyEnabled: Boolean(data?.dailyEnabled),
        nightlyDeliveryTime:
          typeof data?.nightlyDeliveryTime === "string"
            ? data.nightlyDeliveryTime
            : notificationPreferences.nightlyDeliveryTime,
        timezone:
          typeof data?.timezone === "string" ? data.timezone : notificationPreferences.timezone,
        weekendQuestEnabled: Boolean(data?.weekendQuestEnabled),
      } satisfies NotificationPreferences;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["viewer", userId] });
    },
  });
}
