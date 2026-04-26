import { Platform } from "react-native";

const displayFont = Platform.select({
  ios: "AvenirNext-Heavy",
  android: "sans-serif-condensed",
  default: "System",
});

const labelFont = Platform.select({
  ios: "AvenirNext-DemiBold",
  android: "sans-serif-medium",
  default: "System",
});

const bodyFont = Platform.select({
  ios: "AvenirNext-Regular",
  android: "sans-serif",
  default: "System",
});

export const tokens = {
  colors: {
    background: "#130F20",
    backgroundAlt: "#24193A",
    panel: "rgba(32, 24, 52, 0.84)",
    panelStrong: "#31234A",
    line: "rgba(255, 255, 255, 0.12)",
    lineStrong: "rgba(255, 255, 255, 0.22)",
    text: "#FFF6E9",
    textMuted: "#D1C7E6",
    textFaint: "#AA9FC5",
    accentMint: "#9BFFAE",
    accentCoral: "#FF7D7D",
    accentGold: "#FFCB69",
    accentSky: "#7AC7FF",
    accentBubble: "#F4A7FF",
    shadow: "#09050F",
    success: "#79E1A8",
    warning: "#FFD787",
    dioramaWall: "#3B2A5A",
    dioramaWallTint: "#58417B",
    dioramaFloor: "#A8774C",
    dioramaTv: "#2A2136",
    dioramaTvScreen: "#8AE4FF",
    dioramaTvText: "#1E1942",
    dioramaBeanBag: "#FF7D7D",
    dioramaTrim: "#5D4A7A",
    dioramaShadow: "#1B1525",
    dioramaLampShade: "#FFD36B",
    dioramaLavaLamp: "#7AC7FF",
    dioramaJar: "#FFCB69",
    dioramaLightsLine: "#D5CFFF",
    dioramaLightsBall: "#FFFFFF",
    dioramaSurface: "#0F0A18",
    dioramaPermissionFallback: "#20173A",
  },
  gradients: {
    background: ["#120D1D", "#20173A", "#2D1E44"] as const,
    hero: ["#F46B8C", "#FFB85C", "#7AC7FF"] as const,
    card: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.02)"] as const,
    mint: ["#9BFFAE", "#7AC7FF"] as const,
    coral: ["#FF7D7D", "#F4A7FF"] as const,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  radii: {
    sm: 12,
    md: 18,
    lg: 24,
    pill: 999,
  },
  typography: {
    display: displayFont,
    label: labelFont,
    body: bodyFont,
  },
  shadows: {
    panel: {
      shadowColor: "#09050F",
      shadowOpacity: 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  },
} as const;

