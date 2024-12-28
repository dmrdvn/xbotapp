import { TwitterApi, TweetV2PostTweetResult, TweetV2LikeResult, TweetV2RetweetResult, UserV2FollowResult, ApiResponseError } from 'twitter-api-v2';
import { ApiResponse } from '@/types/api';

interface TwitterTokens {
  accessToken: string;
  accessSecret: string;
}

interface TwitterResponseWithHeaders {
  _headers?: {
    'x-rate-limit-remaining'?: string;
    'x-rate-limit-limit'?: string;
    'x-rate-limit-reset'?: string;
  };
}

/**
 * Tweet gönderir
 */
export const sendTweet = async (tokens: TwitterTokens, text: string): Promise<ApiResponse<TweetV2PostTweetResult>> => {
  try {
    console.log("[Twitter API] Tweet gönderme isteği başladı");
    console.log("[Twitter API] Access Token:", tokens.accessToken ? "Mevcut" : "Eksik");
    console.log("[Twitter API] Access Secret:", tokens.accessSecret ? "Mevcut" : "Eksik");
    
    // OAuth 1.0a kimlik bilgileri
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: tokens.accessToken,
      accessSecret: tokens.accessSecret,
    });

    // Tweet gönder
    console.log("[Twitter API] Tweet gönderiliyor:", text);
    const result = await client.v2.tweet(text) as TweetV2PostTweetResult & TwitterResponseWithHeaders;
    console.log("[Twitter API] Tweet başarıyla gönderildi:", result);

    // Rate limit bilgilerini formatla
    let quotaInfo = '';
    if (result._headers) {
      const remaining = result._headers['x-rate-limit-remaining'];
      const limit = result._headers['x-rate-limit-limit'];
      const reset = result._headers['x-rate-limit-reset'];
      
      if (remaining && limit && reset) {
        const resetDate = new Date(Number(reset) * 1000).toLocaleString('tr-TR');
        quotaInfo = ` (Kalan kota: ${remaining}/${limit}, Sıfırlanma: ${resetDate})`;
      }
    }

    return {
      success: true,
      message: `Tweet başarıyla gönderildi${quotaInfo}`,
      data: result
    };
  } catch (error) {
    console.error('[Twitter API] Tweet gönderme hatası:', error);
    
    // Twitter API'den gelen hataları detaylı işle
    if (error instanceof ApiResponseError) {
      const errorDetail = error.data?.detail || error.message;
      const errorCode = error.code || error.data?.type || 'UNKNOWN_ERROR';
      const errorWithHeaders = error as ApiResponseError & TwitterResponseWithHeaders;
      
      // Rate limit hatası için özel işlem
      if (error.code === 429) {
        let quotaInfo = ' (50 tweet/gün)';
        
        if (errorWithHeaders._headers) {
          const remaining = errorWithHeaders._headers['x-rate-limit-remaining'];
          const limit = errorWithHeaders._headers['x-rate-limit-limit'];
          const reset = errorWithHeaders._headers['x-rate-limit-reset'];
          
          if (remaining && limit && reset) {
            const resetDate = new Date(Number(reset) * 1000).toLocaleString('tr-TR');
            quotaInfo = ` (Kalan kota: ${remaining}/${limit}, Sıfırlanma: ${resetDate})`;
          }
        }
        
        return {
          success: false,
          error: {
            code: 'TWITTER_429',
            message: `Twitter API günlük tweet limitine ulaşıldı${quotaInfo}`
          }
        };
      }
      
      console.error('[Twitter API] Hata detayı:', {
        code: errorCode,
        message: errorDetail,
        data: error.data
      });

      return {
        success: false,
        error: {
          code: `TWITTER_${errorCode}`,
          message: `Twitter hatası: ${errorDetail}`
        }
      };
    }

    // Diğer hatalar için
    return {
      success: false,
      message: 'Tweet gönderilirken bir hata oluştu',
      error: {
        code: 'TWEET_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu'
      }
    };
  }
};

/**
 * Tweet beğenir
 */
export const likeTweet = async (accessToken: string, tweetId: string): Promise<ApiResponse<TweetV2LikeResult>> => {
  try {
    const client = new TwitterApi(accessToken);
    const userId = (await client.v2.me()).data.id;
    const result = await client.v2.like(userId, tweetId);

    return {
      success: true,
      message: 'Tweet başarıyla beğenildi',
      data: result
    };
  } catch (error) {
    console.error('Tweet beğenme hatası:', error);
    return {
      success: false,
      message: 'Tweet beğenilirken bir hata oluştu',
      error: {
        code: 'LIKE_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Tweet retweet yapar
 */
export const retweetTweet = async (accessToken: string, tweetId: string): Promise<ApiResponse<TweetV2RetweetResult>> => {
  try {
    const client = new TwitterApi(accessToken);
    const userId = (await client.v2.me()).data.id;
    const result = await client.v2.retweet(userId, tweetId);

    return {
      success: true,
      message: 'Tweet başarıyla retweet yapıldı',
      data: result
    };
  } catch (error) {
    console.error('Tweet retweet hatası:', error);
    return {
      success: false,
      message: 'Tweet retweet yapılırken bir hata oluştu',
      error: {
        code: 'RETWEET_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
};

/**
 * Kullanıcı takip eder
 */
export const followUser = async (accessToken: string, targetUserId: string): Promise<ApiResponse<UserV2FollowResult>> => {
  try {
    const client = new TwitterApi(accessToken);
    const userId = (await client.v2.me()).data.id;
    const result = await client.v2.follow(userId, targetUserId);

    return {
      success: true,
      message: 'Kullanıcı başarıyla takip edildi',
      data: result
    };
  } catch (error) {
    console.error('Kullanıcı takip hatası:', error);
    return {
      success: false,
      message: 'Kullanıcı takip edilirken bir hata oluştu',
      error: {
        code: 'FOLLOW_ERROR',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }
    };
  }
}; 