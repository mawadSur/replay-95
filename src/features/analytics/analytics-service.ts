import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type BetaTrendPoint = {
  day: string;
  label: string;
  opens?: number;
  claims?: number;
  uniqueUsers: number;
};

export type ReplayBetaDashboard = {
  dailyOpenRate7d: number;
  exports7d: number;
  onboardedToday: number;
  openTrend: BetaTrendPoint[];
  questCompletionRate: number;
  questTrend: BetaTrendPoint[];
  questUsers: number;
  totalProfiles: number;
};

const betaDashboardKey = (userId: string | undefined) => ["beta-dashboard", userId];

export const initialBetaDashboard: ReplayBetaDashboard = {
  dailyOpenRate7d: 0,
  exports7d: 0,
  onboardedToday: 0,
  openTrend: [],
  questCompletionRate: 0,
  questTrend: [],
  questUsers: 0,
  totalProfiles: 0,
};

export async function trackBetaEvent({
  dedupeKey,
  eventName,
  metadata,
}: {
  dedupeKey?: string | null;
  eventName: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await supabase.rpc("track_beta_event", {
    p_dedupe_key: dedupeKey ?? null,
    p_event_name: eventName,
    p_metadata: metadata ?? {},
  });

  if (error) {
    throw error;
  }

  return data;
}

export function useTrackBetaEvent(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackBetaEvent,
    retry: 0,
    gcTime: 0,
    networkMode: "online",
    meta: { userId },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: betaDashboardKey(userId) });
    },
  });
}

// Note: camera_still_exported / camera_loop_exported events are tracked without a
// dedupe key on purpose — count semantics are intentional (each export increments).
export function useBetaDashboard(userId: string | undefined) {
  return useQuery({
    queryKey: betaDashboardKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<ReplayBetaDashboard> => {
      const { data, error } = await supabase.rpc("get_beta_dashboard");

      if (error) {
        throw error;
      }

      const openTrend = Array.isArray(data?.openTrend)
        ? (data.openTrend as BetaTrendPoint[])
        : [];
      const questTrend = Array.isArray(data?.questTrend)
        ? (data.questTrend as BetaTrendPoint[])
        : [];

      return {
        dailyOpenRate7d: Number(data?.dailyOpenRate7d ?? 0),
        exports7d: Number(data?.exports7d ?? 0),
        onboardedToday: Number(data?.onboardedToday ?? 0),
        openTrend,
        questCompletionRate: Number(data?.questCompletionRate ?? 0),
        questTrend,
        questUsers: Number(data?.questUsers ?? 0),
        totalProfiles: Number(data?.totalProfiles ?? 0),
      };
    },
    placeholderData: initialBetaDashboard,
  });
}
