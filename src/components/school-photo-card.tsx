import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { buildProfileSignal } from "@/features/profile/profile-personalization";
import { tokens } from "@/theme/tokens";
import type { ReplayProfile } from "@/types/replay";

type SchoolPhotoCardProps = {
  caption: string;
  profile: ReplayProfile;
  footerNote?: string;
};

const outfitPalette: Record<
  string,
  { backdrop: string; body: string; collar: string }
> = {
  "Band tee": { backdrop: "#B7CBE6", body: "#1D2438", collar: "#CC4B74" },
  "Corduroy overshirt": { backdrop: "#B7D0C0", body: "#7C5A37", collar: "#E2C291" },
  "Denim jacket": { backdrop: "#C8D6F0", body: "#416C9E", collar: "#E7F0FF" },
  Overalls: { backdrop: "#F4D7AF", body: "#3D6B93", collar: "#E3BC7F" },
  "Plaid shirt": { backdrop: "#D4C0E4", body: "#8B4053", collar: "#F0D8A8" },
  "Striped rugby shirt": { backdrop: "#BFE0E6", body: "#36649A", collar: "#F7F3EB" },
  "Varsity jacket": { backdrop: "#E6C1BF", body: "#7B3042", collar: "#F4D9B5" },
  Windbreaker: { backdrop: "#D8D2FF", body: "#2B7E83", collar: "#FBEA97" },
};

const trapperPalette: Record<
  string,
  { accentA: string; accentB: string; background: string; card: string; border: string }
> = {
  "Cloud wash": {
    accentA: "#FFF6E9",
    accentB: "#7AC7FF",
    background: "#BFDFF7",
    card: "#EEF7FF",
    border: "#8EC5F0",
  },
  "Flame grid": {
    accentA: "#FFCB69",
    accentB: "#FF7D7D",
    background: "#351B2A",
    card: "#4A2238",
    border: "#FF9B6C",
  },
  "Galaxy checker": {
    accentA: "#7AC7FF",
    accentB: "#F4A7FF",
    background: "#23163A",
    card: "#32224F",
    border: "#6DA7FF",
  },
  "Hologram stars": {
    accentA: "#FFCB69",
    accentB: "#9BFFAE",
    background: "#D5EEFF",
    card: "#F1FBFF",
    border: "#A3CCFF",
  },
  "Lisa Frank leopard": {
    accentA: "#F4A7FF",
    accentB: "#FFCB69",
    background: "#5D3156",
    card: "#844271",
    border: "#FF9ED6",
  },
  "Marble swirl": {
    accentA: "#7AC7FF",
    accentB: "#FFF6E9",
    background: "#DCD6FF",
    card: "#F5F1FF",
    border: "#B5AEF4",
  },
  "Memphis confetti": {
    accentA: "#FFCB69",
    accentB: "#7AC7FF",
    background: "#DCE9F9",
    card: "#F7FAFF",
    border: "#9BC0F5",
  },
  "Neon squiggle": {
    accentA: "#9BFFAE",
    accentB: "#FF7D7D",
    background: "#1E2A4A",
    card: "#263558",
    border: "#7AC7FF",
  },
};

const braceletPalette: Record<string, string> = {
  "Atomic orange": "#FF8B47",
  "Bubblegum pink": "#F88AD4",
  "Chrome silver": "#C9D1DE",
  "Clear glitter": "#D8F2FF",
  "Cobalt blue": "#5C7CFF",
  "Purple jelly": "#A16BFF",
  "Safety yellow": "#FFE352",
  "Slime green": "#9BFFAE",
};

export function SchoolPhotoCard({
  caption,
  footerNote,
  profile,
}: SchoolPhotoCardProps) {
  const outfit = outfitPalette[profile.avatar.outfit] ?? outfitPalette["Denim jacket"];
  const trapper =
    trapperPalette[profile.avatar.trapperPattern] ?? trapperPalette["Galaxy checker"];
  const braceletColor =
    braceletPalette[profile.avatar.braceletColor] ?? braceletPalette["Slime green"];
  const signal = buildProfileSignal(profile);

  return (
    <View style={styles.root}>
      <Text style={styles.caption}>{caption}</Text>
      <View style={styles.frame}>
        <LinearGradient
          colors={[trapper.background, outfit.backdrop]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.photoArea}
        >
          <View style={[styles.trapper, { backgroundColor: trapper.card, borderColor: trapper.border }]}>
            <View style={[styles.trapperAccent, { backgroundColor: trapper.accentA }]} />
            <View style={[styles.trapperAccentWide, { backgroundColor: trapper.accentB }]} />
          </View>
          <View style={styles.figure}>
            <View style={styles.head} />
            <View style={[styles.body, { backgroundColor: outfit.body }]}>
              <View style={[styles.collar, { backgroundColor: outfit.collar }]} />
              <View style={[styles.bracelet, { backgroundColor: braceletColor }]} />
            </View>
          </View>
          <View style={styles.stamp}>
            <Text style={styles.stampLabel}>{signal.cohortLabel}</Text>
          </View>
        </LinearGradient>

        <View style={styles.meta}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subline}>
            {profile.hometown} · {profile.birthYear}
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>{profile.avatar.outfit}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>{profile.mallStore}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagLabel}>{profile.musicMood}</Text>
            </View>
          </View>
          <Text style={styles.copy}>{signal.yearbookNote}</Text>
          {footerNote ? <Text style={styles.footerNote}>{footerNote}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.sm,
  },
  caption: {
    color: tokens.colors.accentGold,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  frame: {
    borderRadius: tokens.radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  photoArea: {
    minHeight: 250,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    justifyContent: "flex-end",
  },
  trapper: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 86,
    height: 110,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    transform: [{ rotate: "9deg" }],
  },
  trapperAccent: {
    position: "absolute",
    top: 14,
    left: 12,
    width: 52,
    height: 10,
    borderRadius: 999,
    opacity: 0.88,
  },
  trapperAccentWide: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 22,
    height: 16,
    borderRadius: 999,
    opacity: 0.9,
  },
  figure: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  head: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: "#6C4A36",
    marginBottom: -10,
    zIndex: 2,
  },
  body: {
    width: 170,
    height: 122,
    borderRadius: 34,
    alignItems: "center",
    paddingTop: 18,
  },
  collar: {
    width: 96,
    height: 20,
    borderRadius: 999,
  },
  bracelet: {
    position: "absolute",
    right: 28,
    bottom: 22,
    width: 34,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  stamp: {
    position: "absolute",
    left: tokens.spacing.md,
    bottom: tokens.spacing.md,
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: "rgba(19, 15, 32, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  stampLabel: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.label,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  meta: {
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    backgroundColor: "rgba(19, 15, 32, 0.76)",
  },
  name: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.display,
    fontSize: 26,
  },
  subline: {
    color: tokens.colors.textMuted,
    fontFamily: tokens.typography.body,
    fontSize: 15,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  tag: {
    borderRadius: tokens.radii.pill,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: tokens.colors.line,
  },
  tagLabel: {
    color: tokens.colors.accentSky,
    fontFamily: tokens.typography.label,
    fontSize: 12,
  },
  copy: {
    color: tokens.colors.text,
    fontFamily: tokens.typography.body,
    fontSize: 15,
    lineHeight: 22,
  },
  footerNote: {
    color: tokens.colors.textFaint,
    fontFamily: tokens.typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
