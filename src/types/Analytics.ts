export enum AnalyticsType {
  TWEET_METRICS = 'tweet_metrics',
  PROFILE_METRICS = 'profile_metrics',
  BOT_PERFORMANCE = 'bot_performance'
}

export interface TweetMetrics {
  impressions: number;
  engagements: number;
  likes: number;
  retweets: number;
  quotes: number;
  replies: number;
  clicks: number;
  profileClicks: number;
  hashtagClicks: number;
  urlClicks: number;
  mediaViews: number;
  videoViews?: number;
  detailExpands: number;
}

export interface ProfileMetrics {
  followers: number;
  following: number;
  tweets: number;
  impressions: number;
  profileVisits: number;
  mentions: number;
  engagement: number;
}

export interface BotPerformanceMetrics {
  tweetsCreated: number;
  repliesSent: number;
  retweetsPerformed: number;
  likesGiven: number;
  followsPerformed: number;
  successRate: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface Analytics {
  id: string;
  userId: string;
  profileId: string;
  type: AnalyticsType;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  tweetMetrics?: TweetMetrics;
  profileMetrics?: ProfileMetrics;
  botMetrics?: BotPerformanceMetrics;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnalyticsDTO {
  userId: string;
  profileId: string;
  type: AnalyticsType;
  period: Analytics['period'];
  startDate: Date;
  endDate: Date;
  tweetMetrics?: Partial<TweetMetrics>;
  profileMetrics?: Partial<ProfileMetrics>;
  botMetrics?: Partial<BotPerformanceMetrics>;
  metadata?: Record<string, unknown>;
}

export interface UpdateAnalyticsDTO {
  tweetMetrics?: Partial<TweetMetrics>;
  profileMetrics?: Partial<ProfileMetrics>;
  botMetrics?: Partial<BotPerformanceMetrics>;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsFilter {
  userId?: string;
  profileId?: string;
  type?: AnalyticsType;
  period?: Analytics['period'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} 