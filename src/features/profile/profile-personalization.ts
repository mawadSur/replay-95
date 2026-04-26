import { env } from "@/config/env";
import type { ReplayProfile } from "@/types/replay";

import { betaBirthYearMax, betaBirthYearMin } from "./profile-options";

export function resolveDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

export function buildDefaultNotificationTime() {
  return `${String(env.defaultNotificationHour).padStart(2, "0")}:00`;
}

export function isBirthYearInRange(birthYear: number) {
  return birthYear >= betaBirthYearMin && birthYear <= betaBirthYearMax;
}

export function getBirthYearValidationMessage(birthYear: number | null) {
  if (birthYear === null || Number.isNaN(birthYear)) {
    return "Enter the year you were born to keep the beta profile grounded.";
  }

  if (isBirthYearInRange(birthYear)) {
    return "";
  }

  return `Replay '95 beta is currently tuned for people born ${betaBirthYearMin}-${betaBirthYearMax}.`;
}

export function formatNotificationTimeLabel(value: string) {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const normalizedHour = hour % 24;
  const meridiem = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function describeBirthYearBand(birthYear: number) {
  if (birthYear <= 1983) {
    return "arcade-to-CD bridge";
  }

  if (birthYear <= 1987) {
    return "mall-rat prime";
  }

  if (birthYear <= 1991) {
    return "sleepover-and-SNICK tier";
  }

  return "late-hallway-energy tier";
}

export function buildProfileSignal(profile: ReplayProfile) {
  return {
    cohortLabel: `${profile.birthYear} ${describeBirthYearBand(profile.birthYear)}`,
    hometownLine: `${profile.hometown} with ${profile.channelBlock} on in the background.`,
    tasteLine: `${profile.consoleChoice}, ${profile.mallStore}, and ${profile.musicMood} are doing most of the personality work here.`,
    concertLine: `Dream night still anchored to ${profile.dreamConcert}.`,
    teaserLine: `Tonight can lean into ${profile.hometown}, ${profile.birthYear}, and that ${profile.mallStore} pull instead of generic nostalgia filler.`,
    yearbookNote: `Most likely to detour into ${profile.mallStore} before doing anything sensible.`,
  };
}
