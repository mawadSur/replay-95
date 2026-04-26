export const betaBirthYearMin = 1980;
export const betaBirthYearMax = 1995;

export const consoleOptions = [
  "SNES",
  "Sega Genesis",
  "Nintendo 64",
  "PlayStation",
  "Game Boy",
] as const;

export const mallOptions = [
  "Sam Goody",
  "Claire's",
  "Suncoast",
  "KB Toys",
  "Spencer's",
  "Limited Too",
] as const;

export const blockOptions = [
  "TGIF",
  "SNICK",
  "Toonami",
  "Friday Night Videos",
  "Nickelodeon afternoons",
] as const;

export const moodOptions = [
  "Alternative rock",
  "Bubblegum pop",
  "R&B",
  "Grunge",
  "Hip-hop",
  "Pop punk",
] as const;

export const outfitOptions = [
  "Denim jacket",
  "Windbreaker",
  "Plaid shirt",
  "Band tee",
  "Overalls",
  "Striped rugby shirt",
  "Corduroy overshirt",
  "Varsity jacket",
] as const;

export const trapperOptions = [
  "Galaxy checker",
  "Lisa Frank leopard",
  "Flame grid",
  "Cloud wash",
  "Neon squiggle",
  "Marble swirl",
  "Hologram stars",
  "Memphis confetti",
] as const;

export const braceletOptions = [
  "Slime green",
  "Bubblegum pink",
  "Atomic orange",
  "Clear glitter",
  "Cobalt blue",
  "Purple jelly",
  "Safety yellow",
  "Chrome silver",
] as const;

export const nightlyDeliveryTimeOptions = [
  {
    value: "17:30",
    label: "5:30 PM",
    description: "Right after the day winds down.",
  },
  {
    value: "19:00",
    label: "7:00 PM",
    description: "Prime night-in memory hour.",
  },
  {
    value: "20:30",
    label: "8:30 PM",
    description: "Later, quieter nostalgia window.",
  },
] as const;
