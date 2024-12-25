import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { sendTweet } from "@/services/twitter/api";
import { createLog } from '@/services/firebase/log';
import { LogType, LogSeverity } from '@/types/log';

export async function POST(request: Request) {
  console.log("[API] Tweet paylaşma isteği başladı");

  try {
    const { profileId, content, userId } = await request.json();

    if (!profileId || !content || !userId) {
      return NextResponse.json(
        { success: false, error: "Profile ID, user ID ve içerik gerekli" },
        { status: 400 }
      );
    }

    // Profili kontrol et
    const profileRef = doc(db, "profiles", profileId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Profil bulunamadı" },
        { status: 404 }
      );
    }

    const profile = profileSnap.data();

    // Tweet gönder
    console.log("[API] Tweet gönderiliyor...");
    const tweetResult = await sendTweet({
      accessToken: profile.twitterAccessToken,
      accessSecret: profile.twitterAccessSecret
    }, content);

    if (!tweetResult.success) {
      // Log oluştur
      await createLog({
        userId,
        type: LogType.TWEET_FAILED,
        severity: LogSeverity.HIGH,
        message: `Tweet gönderilemedi: ${tweetResult.error?.message}`,
        metadata: {
          profileId,
          details: {
            error: tweetResult.error?.message || "Bilinmeyen hata"
          }
        }
      });

      return NextResponse.json(
        { success: false, error: tweetResult.error?.message },
        { status: 500 }
      );
    }

    // Log oluştur
    await createLog({
      userId,
      type: LogType.TWEET_PUBLISHED,
      severity: LogSeverity.LOW,
      message: "Tweet başarıyla gönderildi",
      metadata: {
        profileId,
        details: {
          content,
          tweetData: tweetResult.data
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: tweetResult.data
    });

  } catch (error) {
    console.error("[API] Tweet gönderme hatası:", error);

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Tweet gönderilirken bir hata oluştu" 
      },
      { status: 500 }
    );
  }
} 