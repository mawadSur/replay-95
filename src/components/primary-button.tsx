import { Pressable, StyleSheet, Text, View } from "react-native";

import { tokens } from "@/theme/tokens";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" ? styles.secondaryButton : styles.primaryButton,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <View>
        <Text style={[styles.label, variant === "secondary" ? styles.secondaryLabel : null]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.lg,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: tokens.colors.accentMint,
    borderColor: tokens.colors.accentMint,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: tokens.colors.lineStrong,
  },
  disabledButton: {
    opacity: 0.42,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: tokens.colors.background,
    fontFamily: tokens.typography.label,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  secondaryLabel: {
    color: tokens.colors.text,
  },
});

