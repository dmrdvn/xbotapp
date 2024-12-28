import { NextRequest, NextResponse } from 'next/server';
import { twitterClient, CALLBACK_URL } from '@/services/twitter/config';

interface TwitterApiError extends Error {
  data?: unknown;
  type?: string;
  code?: number;
}

// Environment validation
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is required');
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      return NextResponse.redirect(new URL('/error?message=Profile ID is required', BASE_URL));
    }

    // Generate OAuth link
    const { url, oauth_token_secret } = await twitterClient.generateAuthLink(
      CALLBACK_URL,
      { 
        linkMode: 'authorize',
        authAccessType: 'write'
      }
    );

    // Set cookies
    const response = NextResponse.redirect(url);
    response.cookies.set('oauth_token_secret', oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 saat
    });
    response.cookies.set('twitter_profile_id', profileId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 saat
    });

    return response;
  } catch (error) {
    const twitterError = error as TwitterApiError;
    console.error('Twitter connect error details:', {
      error: twitterError,
      errorMessage: twitterError.message,
      errorData: twitterError.data,
      errorType: twitterError.type,
      errorCode: twitterError.code
    });
    return NextResponse.redirect(new URL('/error?message=Failed to connect to Twitter', BASE_URL));
  }
} 