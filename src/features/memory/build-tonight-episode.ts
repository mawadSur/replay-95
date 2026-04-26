import type { ReplayProfile } from "@/types/replay";

import { buildProfileSignal } from "@/features/profile/profile-personalization";

type TonightEpisode = {
  title: string;
  subtitle: string;
  montageTags: string[];
  prompts: string[];
};

export function buildTonightEpisode(profile: ReplayProfile | null): TonightEpisode {
  if (!profile) {
    return {
      title: "Friday Night Videos: The Blank Tape Warm-Up",
      subtitle: "A starter episode while your 90s profile spins up.",
      montageTags: ["mall echoes", "mix tapes", "school bus window"],
      prompts: [
        "Where do you go first when you have two hours of freedom and no phone?",
        "What song would you risk recording off the radio?",
        "Which friend always knew the TV schedule by heart?",
      ],
    };
  }

  const signal = buildProfileSignal(profile);

  return {
    title: `${profile.mallStore} After-School Run`,
    subtitle: `${profile.hometown} memory channel tuned for a ${signal.cohortLabel} with ${profile.channelBlock} and ${profile.musicMood} on deck.`,
    montageTags: [
      profile.consoleChoice,
      profile.mallStore,
      profile.channelBlock,
      profile.musicMood,
      profile.hometown,
    ],
    prompts: [
      `You are back in ${profile.hometown}, your ride gives you exactly two hours, and ${profile.mallStore} is glowing. What do you do before anything else?`,
      `Born in ${profile.birthYear}, what part of the after-school routine felt most automatic: the TV block, the mall detour, or trying to record the right song off the radio?`,
      `If your dream concert was "${profile.dreamConcert}", what outfit from your school-photo avatar are you wearing to the parking lot after the show?`,
    ],
  };
}
