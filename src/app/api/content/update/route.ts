import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { sendTweet } from "@/services/twitter/api";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";

export async function POST(request: Request) {
  try {
    // Request body'den verileri al
    const body = await request.json();
    const { contentId, status } = body;

    if (!contentId || !status) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "INVALID_DATA",
            message: "Content ID ve status gerekli"
          }
        },
        { status: 400 }
      );
    }

    // İçeriği kontrol et
    const contentRef = doc(db, "contents", contentId);
    const contentSnap = await getDoc(contentRef);

    if (!contentSnap.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "İçerik bulunamadı"
          }
        },
        { status: 404 }
      );
    }

    const content = contentSnap.data();

    // Eğer status "published" ise tweet at
    if (status === "published") {
      try {
        // Profili getir
        const profileRef = doc(db, "profiles", content.profileId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          throw new Error("Profil bulunamadı");
        }

        const profile = profileSnap.data();

        // Twitter token'larını kontrol et
        if (!profile.twitterAccessToken || !profile.twitterAccessSecret) {
          throw new Error("Twitter bağlantısı eksik. Lütfen önce Twitter hesabınızı bağlayın.");
        }

        // Tweet gönder
        const tweetResult = await sendTweet({
          accessToken: profile.twitterAccessToken,
          accessSecret: profile.twitterAccessSecret
        }, content.content);

        if (!tweetResult.success) {
          // Tweet gönderme hatası logu
          const errorCode = tweetResult.error?.code || 'UNKNOWN';
          let errorMessage = `Twitter Hatası (${errorCode}): ${tweetResult.error?.message}`;
          let severity = LogSeverity.HIGH;
          
          // Rate limit hatası için özel mesaj
          if (errorCode === 'TWITTER_429') {
            const nextAttempt = new Date();
            nextAttempt.setHours(nextAttempt.getHours() + 24); // 24 saat sonra tekrar dene
            const resetTime = nextAttempt.toLocaleString('tr-TR');
            
            errorMessage = `Twitter API günlük tweet limitine ulaşıldı (50 tweet/gün). Sistem ${resetTime}'de tekrar deneyecek.`;
            severity = LogSeverity.MEDIUM;
            
            // İçeriği "queued" durumuna geri al
            await updateDoc(contentRef, {
              status: "queued",
              scheduledFor: Timestamp.fromDate(nextAttempt),
              error: {
                code: errorCode,
                message: errorMessage,
                timestamp: Timestamp.fromDate(new Date()),
                details: {
                  isGlobalLimit: true,
                  limitInfo: "50 tweet/gün",
                  nextAttempt: resetTime
                }
              }
            });
          } else {
            // Diğer hatalar için normal hata güncellemesi
            await updateDoc(contentRef, {
              error: {
                code: errorCode,
                message: errorMessage,
                timestamp: Timestamp.fromDate(new Date())
              }
            });
          }
          
          await createLog({
            userId: profile.userId,
            type: LogType.TWEET_FAILED,
            severity,
            message: errorMessage,
            metadata: {
              profileId: content.profileId,
              details: {
                contentId,
                content: content.content.substring(0, 100) + (content.content.length > 100 ? "..." : "")
              }
            }
          });

          throw new Error(errorMessage);
        }

        // Tweet gönderilme zamanını kaydet
        const now = new Date();
        const publishedAtTimestamp = Timestamp.fromDate(now);

        // İçeriği güncelle
        await updateDoc(contentRef, {
          status,
          publishedAt: publishedAtTimestamp,
          tweetId: tweetResult.data?.data?.id,
          error: null
        });

        // Başarılı tweet gönderme logu
        const tweetId = tweetResult.data?.data?.id;
        const tweetUrl = `https://twitter.com/x/status/${tweetId}`;
        await createLog({
          userId: profile.userId,
          type: LogType.TWEET_PUBLISHED,
          severity: LogSeverity.LOW,
          message: `Tweet başarıyla yayınlandı - [${tweetId}](${tweetUrl})`,
          metadata: {
            profileId: content.profileId,
            details: {
              contentId,
              tweetId,
              content: content.content.substring(0, 100) + (content.content.length > 100 ? "..." : "")
            }
          }
        });

      } catch (error) {
        console.error("[API] Tweet paylaşma hatası:", error);
        return NextResponse.json(
          { 
            success: false,
            error: {
              code: "PUBLISH_ERROR",
              message: error instanceof Error ? error.message : "Tweet paylaşılırken bir hata oluştu"
            }
          },
          { status: 500 }
        );
      }
    } else {
      // Tweet atmadan sadece durumu güncelle
      await updateDoc(contentRef, {
        status,
        publishedAt: null,
        error: null
      });

      // Status güncelleme logu
      await createLog({
        userId: content.userId,
        type: LogType.CONTENT_QUEUED,
        severity: LogSeverity.LOW,
        message: `İçerik durumu "${status}" olarak güncellendi`,
        metadata: {
          profileId: content.profileId,
          details: {
            contentId,
            content: content.content.substring(0, 100) + (content.content.length > 100 ? "..." : "")
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: { id: contentId }
    });

  } catch (error) {
    console.error("[API] İçerik güncelleme hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error instanceof Error ? error.message : "İçerik güncellenirken bir hata oluştu"
        }
      },
      { status: 500 }
    );
  }
} 