import { Redirect, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import * as accountService from "@/features/account/account-service";
import { useBetaDashboard } from "@/features/analytics/analytics-service";
import { supabase } from "@/lib/supabase";
import { useReplayApp } from "@/state/replay-context";
import { tokens } from "@/theme/tokens";

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// Fallback `useIsBetaAdmin` hook used until the monetization agent's hook lands
// in `@/features/account/account-service`. Mirrors the small shape this screen
// needs: `{ data: boolean | undefined, isLoading: boolean }`.
function useIsBetaAdminFallback(userId: string | undefined) {
  return useQuery({
    queryKey: ["is-beta-admin", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("is_beta_admin");
      if (error) {
        throw error;
      }
      return Boolean(data);
    },
  });
}

const useIsBetaAdmin =
  (accountService as { useIsBetaAdmin?: typeof useIsBetaAdminFallback }).useIsBetaAdmin ??
  useIsBetaAdminFallback;

function describeAdminError(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  if (
    message.toLowerCase().includes("admin") ||
    message.toLowerCase().includes("permission") ||
    message.toLowerCase().includes("not authorized")
  ) {
    return "You don't have admin access to this dashboard.";
  }

  return "We couldn't load the beta dashboard. Try again in a moment.";
}

export default function AnalyticsScreen() {
  const { session } = useReplayApp();
  const adminQuery = useIsBetaAdmin(session?.user.id);
  const dashboardQuery = useBetaDashboard(session?.user.id);

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (adminQuery.data === false) {
    return <Redirect href="/(tabs)/today" />;
  }

  if (adminQuery.isLoading || dashboardQuery.isLoading) {
    return (
      <RetroScreen
        eyebrow="Internal beta dashboard"
        title="Loading dashboard..."
        subtitle="Pulling the latest beta metrics from Supabase."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.metricCopy}>Loading dashboard...</Text>
        </SurfaceCard>
      </RetroScreen>
    );
  }

  if (dashboardQuery.error) {
    return (
      <RetroScreen
        eyebrow="Internal beta dashboard"
        title="Dashboard unavailable"
        subtitle="We hit a snag fetching the beta dashboard."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.metricCopy}>{describeAdminError(dashboardQuery.error)}</Text>
          <PrimaryButton
            label="Back to Settings"
            onPress={() => router.back()}
            variant="secondary"
          />
        </SurfaceCard>
      </RetroScreen>
    );
  }

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return (
      <RetroScreen
        eyebrow="Internal beta dashboard"
        title="Loading dashboard..."
        subtitle="Pulling the latest beta metrics from Supabase."
      >
        <SurfaceCard style={styles.card}>
          <Text style={styles.metricCopy}>Loading dashboard...</Text>
        </SurfaceCard>
      </RetroScreen>
    );
  }

  return (
    <RetroScreen
      eyebrow="Internal beta dashboard"
      title="Onboarding, daily opens, and quest completion"
      subtitle="A compact, operator-facing snapshot of the three core beta metrics."
    >
      <View style={styles.metricRow}>
        <SurfaceCard style={styles.metricCard}>
          <Text style={styles.metricLabel}>Profiles</Text>
          <Text style={styles.metricValue}>{dashboard.totalProfiles}</Text>
          <Text style={styles.metricCopy}>
            Onboarded users visible to the beta dashboard.
          </Text>
        </SurfaceCard>
        <SurfaceCard style={styles.metricCard}>
          <Text style={styles.metricLabel}>Opened today</Text>
          <Text style={styles.metricValue}>{formatPercent(dashboard.dailyOpenRate7d)}</Text>
          <Text style={styles.metricCopy}>
            Seven-day unique open rate against onboarded profiles.
          </Text>
        </SurfaceCard>
      </View>

      <View style={styles.metricRow}>
        <SurfaceCard style={styles.metricCard}>
          <Text style={styles.metricLabel}>Quest finishers</Text>
          <Text style={styles.metricValue}>{formatPercent(dashboard.questCompletionRate)}</Text>
          <Text style={styles.metricCopy}>
            Users who have claimed at least one quest reward.
          </Text>
        </SurfaceCard>
        <SurfaceCard style={styles.metricCard}>
          <Text style={styles.metricLabel}>Exports</Text>
          <Text style={styles.metricValue}>{dashboard.exports7d}</Text>
          <Text style={styles.metricCopy}>
            Still and loop exports over the last seven days.
          </Text>
        </SurfaceCard>
      </View>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Open trend</Text>
        <View style={styles.trendColumn}>
          {dashboard.openTrend.map((point) => (
            <View key={point.day} style={styles.trendRow}>
              <Text style={styles.trendLabel}>{point.label}</Text>
              <Text style={styles.trendMeta}>
                {point.opens ?? 0} opens / {point.uniqueUsers} users
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Quest trend</Text>
        <View style={styles.trendColumn}>
          {dashboard.questTrend.map((point) => (
            <View key={point.day} style={styles.trendRow}>
              <Text style={styles.trendLabel}>{point.label}</Text>
              <Text style={styles.trendMeta}>
                {point.claims ?? 0} claims / {point.uniqueUsers} users
              </Text>
            </View>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard style={styles.card}>
        <Text style={styles.sectionTitle}>Today</Text>
        <Text style={styles.metricCopy}>
          Onboarded today: {dashboard.onboardedToday}. Quest users overall: {dashboard.questUsers}.
        </Text>
        <PrimaryButton
          label="Back to Settings"
          onPress={() => router.back()}
          variant="secondary"
        />
      </SurfaceCard>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: "row",
    gap: tokens.spacing.md,
  },
  metricCard: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  metricLabel: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metricValue: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 34,
  },
  metricCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  trendColumn: {
    gap: tokens.spacing.sm,
  },
  trendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  trendLabel: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 14,
  },
  trendMeta: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 14,
  },
});
