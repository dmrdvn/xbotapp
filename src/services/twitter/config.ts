import { TwitterApi } from 'twitter-api-v2';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_SECRET) {
  console.error('Twitter API keys are missing:', {
    TWITTER_API_KEY: process.env.TWITTER_API_KEY,
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET
  });
  throw new Error('Twitter API keys are required');
}

export const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET
});

export const CALLBACK_URL = `${BASE_URL}/api/auth/twitter/callback`;