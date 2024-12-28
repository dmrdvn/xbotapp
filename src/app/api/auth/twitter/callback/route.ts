import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createLog } from '@/services/firebase/log';
import { LogType, LogSeverity } from '@/types/log';
import { TwitterApi } from 'twitter-api-v2';

// Environment validation
if (!process.env.NEXT_PUBLIC_BASE_URL) {
  throw new Error('NEXT_PUBLIC_BASE_URL is required');
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET(request: NextRequest) {
  console.log("[API] Twitter callback isteği başladı");
  
  try {
    // URL'den OAuth token ve verifier'ı al
    const { searchParams } = new URL(request.url);
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');

    // Cookie'den profileId ve oauth_token_secret'ı al
    const profileId = request.cookies.get('twitter_profile_id')?.value;
    const oauth_token_secret = request.cookies.get('oauth_token_secret')?.value;

    if (!profileId || !oauthToken || !oauthVerifier || !oauth_token_secret) {
      console.error("[API] Eksik parametreler:", { profileId, oauthToken, oauthVerifier, oauth_token_secret });
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "INVALID_DATA",
            message: "Geçersiz callback parametreleri"
          }
        },
        { status: 400 }
      );
    }

    // Access token'ları al
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: oauthToken,
      accessSecret: oauth_token_secret,
    });

    const { accessToken, accessSecret } = await client.login(oauthVerifier);
    console.log("[API] Twitter access token'ları alındı");

    // Profili getir
    const profileRef = doc(db, "profiles", profileId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Profil bulunamadı"
          }
        },
        { status: 404 }
      );
    }

    // Twitter token'larını güncelle
    await updateDoc(profileRef, {
      twitterAccessToken: accessToken,
      twitterAccessSecret: accessSecret,
      twitterConnectedAt: new Date()
    });

    // Log oluştur
    await createLog({
      userId: profileId,
      type: LogType.PROFILE_UPDATED,
      severity: LogSeverity.LOW,
      message: "Twitter hesabı bağlandı",
      metadata: {
        profileId,
        details: {
          twitterConnectedAt: new Date()
        }
      }
    });

    // Başarılı bağlantıdan sonra profil düzenleme sayfasına yönlendir
    return NextResponse.redirect(new URL(`/profiles/${profileId}`, BASE_URL));

  } catch (error) {
    console.error("[API] Twitter callback hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error instanceof Error ? error.message : "Twitter callback işlenirken bir hata oluştu"
        }
      },
      { status: 500 }
    );
  }
} 