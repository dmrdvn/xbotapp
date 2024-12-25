export enum ContentType {
  TWEET = "TWEET",
  REPLY = "REPLY",
  RETWEET = "RETWEET",
  QUOTE = "QUOTE"
}

export type ContentStatus = "draft" | "queued" | "published" | "failed";

export interface Content {
  id?: string;
  profileId: string;
  type?: ContentType;
  content: string;
  status: ContentStatus;
  createdAt?: Date;
  scheduledFor?: Date | null;
  publishedAt?: Date | null;
  error?: string | null;
  tweetId?: string | null;
} 