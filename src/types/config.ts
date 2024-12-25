export interface SystemConfig {
  environment: 'development' | 'production' | 'test';
  appName: string;
  appVersion: string;
  apiUrl: string;
  apiVersion: string;
  enableLogging: boolean;
  logLevel: string;
  logRetentionDays: number;
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessSecret: string;
  bearerToken: string;
  callbackUrl: string;
  apiVersion: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL: string;
  emulatorHost?: string;
  emulatorPort?: number;
}

/* export interface CronConfig {
  timezone: string;
  enabled: boolean;
  tweetSchedule: string;
  replySchedule: string;
  actionSchedule: string;
  cleanupSchedule: string;
  analyticsSchedule: string;
  maxConcurrentJobs: number;
} */

/* export interface AppConfig {
  system: SystemConfig;
  twitter: TwitterConfig;
  openai: OpenAIConfig;
  firebase: FirebaseConfig;
  cron: CronConfig;
}  */