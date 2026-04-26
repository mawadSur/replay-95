export const notePaperThemes = [
  "Lisa Frank",
  "Ripped notebook",
  "Pogs backing",
  "Gel pen grid",
  "Locker mirror hearts",
] as const;

export type NotePaperTheme = (typeof notePaperThemes)[number];

export const noteDelayPresets = [
  {
    label: "30 min",
    minutes: 30,
    subtitle: "Quick hallway pass",
  },
  {
    label: "2 hours",
    minutes: 120,
    subtitle: "After-school drift",
  },
  {
    label: "6 hours",
    minutes: 360,
    subtitle: "Locker by last bell",
  },
] as const;

export type NoteDelayMinutes = (typeof noteDelayPresets)[number]["minutes"];

export const noteReportReasons = [
  "Spam",
  "Harassment",
  "Creepy",
  "Boundary issue",
  "Other",
] as const;

export type NoteReportReason = (typeof noteReportReasons)[number];
