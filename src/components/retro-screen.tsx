import { type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { tokens } from "@/theme/tokens";

type RetroScreenProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function RetroScreen({ eyebrow, title, subtitle, children }: RetroScreenProps) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={tokens.gradients.background} style={StyleSheet.absoluteFill} />
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: 120,
    gap: tokens.spacing.lg,
  },
  header: {
    gap: tokens.spacing.xs,
  },
  eyebrow: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 34,
    lineHeight: 38,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
  },
  glowOrbTop: {
    position: "absolute",
    top: 80,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(244, 167, 255, 0.14)",
  },
  glowOrbBottom: {
    position: "absolute",
    bottom: 120,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(122, 199, 255, 0.12)",
  },
});

