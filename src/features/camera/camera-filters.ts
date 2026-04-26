import type { ReplayProfile } from "@/types/replay";
import type { TonightEpisode } from "@/features/memory/episode-service";

export type ReplayCameraFilter = {
  grainOpacity: number;
  id: string;
  label: string;
  overlayText: string;
  scanlineOpacity: number;
  vignetteColors: readonly [string, string, string];
  washColor: string;
  washOpacity: number;
};

export const replayCameraFilters: ReplayCameraFilter[] = [
  {
    grainOpacity: 0.12,
    id: "camcorder-dusk",
    label: "Camcorder Dusk",
    overlayText: "REC",
    scanlineOpacity: 0.18,
    vignetteColors: ["rgba(18,13,29,0.0)", "rgba(122,199,255,0.12)", "rgba(18,13,29,0.46)"],
    washColor: "#7AC7FF",
    washOpacity: 0.1,
  },
  {
    grainOpacity: 0.08,
    id: "drugstore-flash",
    label: "Drugstore Flash",
    overlayText: "FLASH",
    scanlineOpacity: 0.08,
    vignetteColors: ["rgba(255,255,255,0.0)", "rgba(244,167,255,0.12)", "rgba(255,255,255,0.14)"],
    washColor: "#FFF1D8",
    washOpacity: 0.16,
  },
  {
    grainOpacity: 0.11,
    id: "mall-glow",
    label: "Mall Glow",
    overlayText: "NEON",
    scanlineOpacity: 0.14,
    vignetteColors: ["rgba(255,203,105,0.0)", "rgba(255,120,120,0.08)", "rgba(19,15,32,0.42)"],
    washColor: "#FFCB69",
    washOpacity: 0.12,
  },
  {
    grainOpacity: 0.15,
    id: "parking-lot-sodium",
    label: "Parking Lot Sodium",
    overlayText: "NITE",
    scanlineOpacity: 0.16,
    vignetteColors: ["rgba(255,125,125,0.0)", "rgba(255,203,105,0.10)", "rgba(19,15,32,0.48)"],
    washColor: "#FF9F5C",
    washOpacity: 0.14,
  },
] as const;

export function formatCameraStamp() {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = `${date.getFullYear()}`.slice(-2);
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");

  return `${month}/${day}/${year} ${hour}:${minute}`;
}

export function buildCameraOverlayLines(
  profile: ReplayProfile | null,
  episode: TonightEpisode | null,
) {
  const headline = episode?.title ?? "Memory Booth";
  const subline = profile
    ? `${profile.hometown} • ${profile.mallStore} • ${profile.musicMood}`
    : "Summer of '94 preview";
  const footer = profile
    ? `${profile.dreamConcert} / ${profile.channelBlock}`
    : "Mall echoes / mixtape static / after-school drift";

  return {
    footer,
    headline,
    subline,
  };
}
