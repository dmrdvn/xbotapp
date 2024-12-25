export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

// Twitter API Types
export interface TwitterSearchParams {
  query: string;
  count?: number;
  lang?: string;
  result_type?: 'mixed' | 'recent' | 'popular';
  until?: string;
  since_id?: string;
  max_id?: string;
  include_entities?: boolean;
}

export interface TwitterTweetParams {
  text: string;
  reply?: {
    in_reply_to_status_id: string;
    auto_populate_reply_metadata: boolean;
  };
  quote?: {
    quoted_tweet_id: string;
  };
  media?: {
    media_ids: string[];
  };
}

export interface TwitterUserParams {
  screen_name?: string;
  user_id?: string;
  include_entities?: boolean;
}

// ChatGPT API Types
export interface ChatGPTParams {
  prompt: string;
  context?: string;
  personality?: string;
  tone?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

export interface ChatGPTResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: {
    finishReason: string;
    model: string;
    systemFingerprint?: string;
  };
}

// API Error Types
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  VALIDATION = 'VALIDATION',
  INTERNAL = 'INTERNAL',
  TWITTER_API = 'TWITTER_API',
  OPENAI_API = 'OPENAI_API'
} 