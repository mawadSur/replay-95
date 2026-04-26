import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { tokens } from "@/theme/tokens";

type StatusPanelProps = {
  actionLabel?: string;
  message: string;
  onActionPress?: () => void;
  title: string;
  tone?: "empty" | "error" | "loading";
};

export function StatusPanel({
  actionLabel,
  message,
  onActionPress,
  title,
  tone = "empty",
}: StatusPanelProps) {
  return (
    <View
      style={[
        styles.card,
        tone === "error" ? styles.errorCard : null,
        tone === "loading" ? styles.loadingCard : null,
      ]}
    >
      {tone === "loading" ? (
        <ActivityIndicator color={tokens.colors.accentMint} />
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onActionPress ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onActionPress}
          variant={tone === "error" ? "secondary" : "primary"}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  loadingCard: {
    backgroundColor: "rgba(122, 199, 255, 0.08)",
    borderColor: "rgba(122, 199, 255, 0.24)",
  },
  errorCard: {
    backgroundColor: "rgba(255, 125, 125, 0.08)",
    borderColor: "rgba(255, 125, 125, 0.28)",
  },
  title: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 22,
  },
  message: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
