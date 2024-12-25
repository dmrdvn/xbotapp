export interface Settings {
  id?: string;
  userId?: string;
  tweetFrequency: {
    minTweetsPerDay: number;
    maxTweetsPerDay: number;
    minInterval: number;
  };
  replyFrequency: {
    minRepliesPerDay: number;
    maxRepliesPerDay: number;
    minInterval: number;
  };
  interactionLimits: {
    maxLikesPerDay: number;
    maxRetweetsPerDay: number;
    maxFollowsPerDay: number;
  };
  activeHours: {
    start: string;
    end: string;
  };
  timezone: string;
  isEnabled: boolean;
  theme?: "light" | "dark" | "system";
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    telegram?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type UpdateSettingsDTO = Partial<Settings>; 