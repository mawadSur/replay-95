import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { RetroScreen } from "@/components/retro-screen";
import { tokens } from "@/theme/tokens";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export function LoadingScreen({
  title = "Spinning up Replay '95",
  subtitle = "Checking your session and loading the nightly tape.",
}: LoadingScreenProps) {
  return (
    <RetroScreen eyebrow="Loading" title={title} subtitle={subtitle}>
      <View style={styles.card}>
        <ActivityIndicator color={tokens.colors.accentMint} />
        <Text style={styles.copy}>One second. The app shell is syncing with Supabase.</Text>
      </View>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    backgroundColor: tokens.colors.panel,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.md,
    padding: tokens.spacing.lg,
    ...tokens.shadows.panel,
  },
  copy: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
