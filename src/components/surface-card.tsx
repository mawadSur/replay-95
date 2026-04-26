import { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

type SurfaceCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.panel,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    padding: tokens.spacing.lg,
    ...tokens.shadows.panel,
  },
});

