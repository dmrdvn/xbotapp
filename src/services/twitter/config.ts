import { TwitterApi } from 'twitter-api-v2';

// Environment variables
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;

// Validation
if (!TWITTER_API_KEY || !TWITTER_API_SECRET) {
  throw new Error('Twitter API keys are required');
}

if (!BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is required');
}

// Twitter client configuration
export const twitterClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET
});

// Callback URL configuration
export const CALLBACK_URL = `${BASE_URL}/api/auth/twitter/callback`;