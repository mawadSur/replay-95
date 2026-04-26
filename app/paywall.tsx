import { useState } from "react";
import { Redirect, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  formatReplayPlusStatus,
  useReplayPlusState,
  useRestoreReplayPlus,
  useStartReplayPlusTrial,
} from "@/features/account/account-service";
import {
  isPurchasesAvailable,
  type ReplayPlusPlanType,
  useReplayPlusOfferings,
  usePurchaseReplayPlus,
} from "@/features/account/revenuecat-service";
import { useReplayApp } from "@/state/replay-context";
import { PrimaryButton } from "@/components/primary-button";
import { RetroScreen } from "@/components/retro-screen";
import { SurfaceCard } from "@/components/surface-card";
import { tokens } from "@/theme/tokens";

function formatExpiry(value: string | null) {
  if (!value) {
    return "No active renewal window";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PaywallScreen() {
  const { session } = useReplayApp();
  const replayPlusQuery = useReplayPlusState(session?.user.id);
  const startTrialMutation = useStartReplayPlusTrial(session?.user.id);
  const restoreMutation = useRestoreReplayPlus(session?.user.id);
  const offeringsQuery = useReplayPlusOfferings();
  const purchaseMutation = usePurchaseReplayPlus(session?.user.id);
  const replayPlusState = replayPlusQuery.data;
  const [errorText, setErrorText] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<ReplayPlusPlanType>("yearly");

  if (!session) {
    return <Redirect href="/login" />;
  }

  const offerings = offeringsQuery.data;
  const hasMonthly = Boolean(offerings?.monthly);
  const hasYearly = Boolean(offerings?.yearly);
  const offeringsAvailable = isPurchasesAvailable() && (hasMonthly || hasYearly);

  // If only one package exists, force the selection to it.
  const effectivePlan: ReplayPlusPlanType = !hasMonthly && hasYearly
    ? "yearly"
    : hasMonthly && !hasYearly
      ? "monthly"
      : selectedPlan;

  const monthlyPrice = offerings?.monthly?.product.priceString ?? "$3.99";
  const yearlyPrice = offerings?.yearly?.product.priceString ?? "$29.99";

  const handlePurchase = async () => {
    setErrorText("");

    try {
      await purchaseMutation.mutateAsync(effectivePlan);
    } catch (error) {
      // RevenueCat returns userCancelled on cancel; suppress that one to keep tone gentle.
      const message = error instanceof Error ? error.message : String(error);
      if (/cancel/i.test(message)) {
        return;
      }
      setErrorText(message || "Replay '95 couldn't complete the purchase.");
    }
  };

  const handleStartTrial = async () => {
    setErrorText("");

    try {
      await startTrialMutation.mutateAsync();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't start Replay+.",
      );
    }
  };

  const handleRestore = async () => {
    setErrorText("");

    try {
      await restoreMutation.mutateAsync();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Replay '95 couldn't restore Replay+.",
      );
    }
  };

  return (
    <RetroScreen
      eyebrow="Replay+"
      title="A little extra room, no algorithm"
      subtitle="Replay+ widens the weekly note allowance and supports the app. Everything else — pogs, quests, unlockables — stays the same."
    >
      <SurfaceCard style={styles.heroCard}>
        {replayPlusQuery.isLoading || !replayPlusState ? (
          <Text style={styles.planCopy}>Loading Replay+ status…</Text>
        ) : (
          <>
            <Text style={styles.planLabel}>{formatReplayPlusStatus(replayPlusState.status)}</Text>
            <Text style={styles.planHeadline}>
              {replayPlusState.isPaid ? "Paid access is active on this account." : "Free tier is still the default state."}
            </Text>
            <Text style={styles.planCopy}>
              Current expiry window: {formatExpiry(replayPlusState.expiresAt)}.
            </Text>

            {!replayPlusState.isPaid && offeringsAvailable ? (
              <View style={styles.planColumn}>
                <View style={styles.planTabs}>
                  {hasYearly ? (
                    <Pressable
                      onPress={() => setSelectedPlan("yearly")}
                      style={[
                        styles.planTab,
                        effectivePlan === "yearly" ? styles.planTabActive : null,
                      ]}
                    >
                      <Text style={styles.planTabLabel}>Yearly</Text>
                      <Text style={styles.planTabPrice}>{yearlyPrice}</Text>
                      <Text style={styles.planTabHint}>Best value</Text>
                    </Pressable>
                  ) : null}
                  {hasMonthly ? (
                    <Pressable
                      onPress={() => setSelectedPlan("monthly")}
                      style={[
                        styles.planTab,
                        effectivePlan === "monthly" ? styles.planTabActive : null,
                      ]}
                    >
                      <Text style={styles.planTabLabel}>Monthly</Text>
                      <Text style={styles.planTabPrice}>{monthlyPrice}</Text>
                      <Text style={styles.planTabHint}>Cancel anytime</Text>
                    </Pressable>
                  ) : null}
                </View>
                <PrimaryButton
                  label={
                    purchaseMutation.isPending
                      ? "Opening App Store..."
                      : `Subscribe — ${effectivePlan === "yearly" ? yearlyPrice + "/yr" : monthlyPrice + "/mo"}`
                  }
                  onPress={() => {
                    void handlePurchase();
                  }}
                  disabled={purchaseMutation.isPending}
                />
                <Text style={styles.legalText}>
                  Auto-renews until canceled. Manage or cancel from your device's subscription settings at least 24 hours before the renewal date.
                </Text>
              </View>
            ) : null}

            {!replayPlusState.isPaid && !offeringsAvailable ? (
              <View style={styles.planColumn}>
                <PrimaryButton
                  label={
                    startTrialMutation.isPending
                      ? "Starting beta preview..."
                      : "Start 7-day Replay+ beta preview"
                  }
                  onPress={() => {
                    void handleStartTrial();
                  }}
                  disabled={startTrialMutation.isPending}
                />
                <Text style={styles.legalText}>
                  Beta preview is a closed test — paid plans appear here once App Store offerings sync.
                </Text>
              </View>
            ) : null}

            {replayPlusState.isPaid ? (
              <PrimaryButton
                label="Manage in Settings"
                onPress={() => router.push("/settings")}
              />
            ) : null}

            <PrimaryButton
              label={restoreMutation.isPending ? "Restoring..." : "Restore Replay+ status"}
              onPress={() => {
                void handleRestore();
              }}
              disabled={restoreMutation.isPending}
              variant="secondary"
            />
          </>
        )}
      </SurfaceCard>

      <SurfaceCard style={styles.featureCard}>
        <Text style={styles.sectionTitle}>What changes with Replay+</Text>
        <View style={styles.featureColumn}>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>01</Text>
            <Text style={styles.featureText}>Unlimited classroom notes (free tier is 3/week)</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>02</Text>
            <Text style={styles.featureText}>Restore your status on a new device anytime</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureBullet}>03</Text>
            <Text style={styles.featureText}>Same pogs, same quests, same unlockables — no paywalled content</Text>
          </View>
        </View>
        <Text style={styles.helperText}>
          You'll never need Replay+ to earn pogs or finish a quest.
        </Text>
      </SurfaceCard>

      <SurfaceCard style={styles.featureCard}>
        <PrimaryButton
          label="Back"
          onPress={() => router.back()}
          variant="secondary"
        />
      </SurfaceCard>

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    gap: tokens.spacing.md,
  },
  planLabel: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  planHeadline: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 28,
    lineHeight: 32,
  },
  planCopy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  planColumn: {
    gap: tokens.spacing.sm,
  },
  planTabs: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  planTab: {
    flex: 1,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.panel,
    gap: 4,
  },
  planTabActive: {
    borderColor: tokens.colors.accentGold,
    backgroundColor: tokens.colors.panelStrong,
  },
  planTabLabel: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  planTabPrice: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 22,
  },
  planTabHint: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 12,
  },
  legalText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 12,
    lineHeight: 18,
  },
  featureCard: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 24,
  },
  featureColumn: {
    gap: tokens.spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing.md,
  },
  featureBullet: {
    color: tokens.colors.accentBubble,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingTop: 4,
  },
  featureText: {
    flex: 1,
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  helperText: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: tokens.colors.accentCoral,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
