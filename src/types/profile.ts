// Bot davranış ayarları için interface
export interface BotBehaviorSettings {
  tweetsPerDay: number;
  repliesPerDay: number;
  likesPerDay: number;
  retweetsPerDay: number;
  followsPerDay: number;
  minDelayBetweenActions: number; // dakika cinsinden
  maxDelayBetweenActions: number; // dakika cinsinden
  activeHoursStart: number; // 0-23 arası saat
  activeHoursEnd: number; // 0-23 arası saat
  activeDays: string[]; // ["monday", "tuesday", etc.]
}

// API limit takibi için interface
/* export interface ApiLimitCounters {
  dailyTweetCount: number;
  dailyReplyCount: number;
  dailyLikeCount: number;
  dailyRetweetCount: number;
  dailyFollowCount: number;
  lastActionTime: Date;
  lastResetDate: Date;
} */

// Firestore'da saklanan profil verisi
export interface Profile {
  id: string;
  userId: string;
  name: string;
  surname: string;
  age: number;
  email: string;
  avatar?: string;
  bio?: string;
  personalityTraits: string[];
  interests: string[];
  occupation: string;
  lifestyle: string;
  mentality: string;
  toneOfVoice: string;
  language: string;
  isActive: boolean;
  botBehavior: BotBehaviorSettings;
  createdAt: Date;
  updatedAt: Date;
  twitterAccessToken?: string | null;
  twitterAccessSecret?: string | null;
  twitterTokenExpiresAt?: Date | null;
  twitterConnected?: boolean;
  lastError?: string;
}

// Profil oluşturma için DTO
export interface CreateProfileDTO {
  userId: string;
  name: string;
  surname: string;
  age: number;
  personalityTraits: string[];
  interests: string[];
  occupation: string;
  lifestyle: string;
  mentality: string;
  toneOfVoice: string;
  language: string;
  botBehavior: BotBehaviorSettings;
}

// Profil güncelleme için DTO
export interface UpdateProfileDTO {
  name?: string;
  surname?: string;
  age?: number;
  email?: string;
  avatar?: string;
  bio?: string;
  personalityTraits?: string[];
  interests?: string[];
  occupation?: string;
  lifestyle?: string;
  mentality?: string;
  toneOfVoice?: string;
  language?: string;
  isActive?: boolean;
  botBehavior?: BotBehaviorSettings;
  twitterAccessToken?: string | null;
  twitterAccessSecret?: string | null;
  twitterTokenExpiresAt?: Date | null;
  twitterConnected?: boolean;
} 