import { type ReactNode } from "react";
import { StyleSheet, Text, View, type DimensionValue } from "react-native";

import { RetroScreen } from "@/components/retro-screen";
import { tokens } from "@/theme/tokens";

type OnboardingShellProps = {
  step: number;
  totalSteps: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function OnboardingShell({
  children,
  eyebrow,
  step,
  subtitle,
  title,
  totalSteps,
}: OnboardingShellProps) {
  const progressWidth = `${Math.max(0, Math.min(step / totalSteps, 1)) * 100}%` as DimensionValue;

  return (
    <RetroScreen eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <View style={styles.progressBlock}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>Step {step} of {totalSteps}</Text>
          <Text style={styles.progressLabel}>{Math.round((step / totalSteps) * 100)}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: progressWidth }]} />
        </View>
      </View>
      {children}
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  progressBlock: {
    gap: tokens.spacing.xs,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  track: {
    height: 10,
    borderRadius: tokens.radii.pill,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  fill: {
    height: "100%",
    borderRadius: tokens.radii.pill,
    backgroundColor: tokens.colors.accentMint,
  },
});
