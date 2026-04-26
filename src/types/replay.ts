export type AvatarChoice = {
  outfit: string;
  trapperPattern: string;
  braceletColor: string;
};

export type NotificationPreferences = {
  timezone: string;
  nightlyDeliveryTime: string;
  dailyEnabled: boolean;
  weekendQuestEnabled: boolean;
};

export type ReplayProfile = {
  name: string;
  hometown: string;
  birthYear: number;
  consoleChoice: string;
  mallStore: string;
  channelBlock: string;
  dreamConcert: string;
  musicMood: string;
  avatar: AvatarChoice;
};
