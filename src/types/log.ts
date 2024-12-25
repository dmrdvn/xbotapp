export enum LogType {
  ALL = "all",
  // Sistem logları
  SYSTEM = "SYSTEM",
  ERROR = "ERROR",
  WARNING = "WARNING",
  INFO = "INFO",
  DEBUG = "DEBUG",

  // Kullanıcı logları
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_REGISTER = "USER_REGISTER",
  USER_UPDATE = "USER_UPDATE",
  USER_DELETE = "USER_DELETE",

  // Profil logları
  PROFILE_CREATED = "PROFILE_CREATED",
  PROFILE_UPDATED = "PROFILE_UPDATED",
  PROFILE_DELETED = "PROFILE_DELETED",
  PROFILE_CONNECT = "PROFILE_CONNECT",
  PROFILE_DISCONNECT = "PROFILE_DISCONNECT",

  // Bot logları
  BOT_ENABLED = "BOT_ENABLED",
  BOT_DISABLED = "BOT_DISABLED",
  BOT_SETTINGS_UPDATE = "BOT_SETTINGS_UPDATE",

  // İçerik logları
  CONTENT_QUEUED = "CONTENT_QUEUED",
  TWEET_CREATED = "TWEET_CREATED",
  TWEET_SCHEDULED = "TWEET_SCHEDULED",
  TWEET_PUBLISHED = "TWEET_PUBLISHED",
  TWEET_FAILED = "TWEET_FAILED",
  REPLY_CREATED = "REPLY_CREATED",
  REPLY_SCHEDULED = "REPLY_SCHEDULED",
  REPLY_PUBLISHED = "REPLY_PUBLISHED",
  REPLY_FAILED = "REPLY_FAILED",

  // Etkileşim logları
  LIKE_PERFORMED = "LIKE_PERFORMED",
  RETWEET_PERFORMED = "RETWEET_PERFORMED",
  FOLLOW_PERFORMED = "FOLLOW_PERFORMED",
  UNFOLLOW_PERFORMED = "UNFOLLOW_PERFORMED",

  // API logları
  API_RATE_LIMIT = "API_RATE_LIMIT",
  API_ERROR = "API_ERROR",
  OPENAI_ERROR = "OPENAI_ERROR"
}

export enum LogSeverity {
  ALL = "all",
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export interface LogDetails {
  code?: string;
  email?: string;
  displayName?: string;
  contentId?: string;
  content?: string;
  error?: string;
  tweetId?: string;
  tweetData?: unknown;
  scheduledFor?: Date;
  twitterConnectedAt?: Date;
  name?: string;
  isActive?: boolean;
}

export interface LogMetadata {
  profileId?: string;
  details?: LogDetails;
}

export interface Log {
  id: string;
  userId: string;
  type: LogType;
  severity: LogSeverity;
  message: string;
  metadata: LogMetadata;
  createdAt: Date;
  updatedAt: Date;
} 