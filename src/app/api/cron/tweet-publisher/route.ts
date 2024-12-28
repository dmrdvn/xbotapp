import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { Profile } from "@/types/profile";
import { Content, ContentStatus } from "@/types/Content";
import { sendTweet } from "@/services/twitter/api";

// Cron endpoint'i sadece Vercel tarafından çağrılabilir
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Cron secret kontrolü
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }

    console.log("[CRON] Tweet yayınlama işlemi başladı");

    // Yayınlanması gereken içerikleri bul
    const now = new Date();
    const contentsRef = collection(db, "contents");
    const q = query(
      contentsRef,
      where("status", "==", "scheduled" as ContentStatus),
      where("scheduledFor", "<=", Timestamp.fromDate(now))
    );

    const contentsSnapshot = await getDocs(q);
    const contents = contentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Content[];

    console.log(`[CRON] ${contents.length} adet yayınlanacak içerik bulundu`);

    // Her içerik için yayınlama işlemi yap
    for (const content of contents) {
      let currentProfile: Profile | undefined;

      try {
        // Profil bilgilerini al
        const profileSnap = await getDocs(query(collection(db, "profiles"), where("id", "==", content.profileId)));
        currentProfile = profileSnap.docs[0]?.data() as Profile | undefined;

        if (!currentProfile) {
          console.error(`[CRON] ${content.id} içeriği için profil bulunamadı`);
          continue;
        }

        if (!currentProfile.isActive) {
          console.log(`[CRON] ${content.id} içeriği için profil aktif değil, atlıyorum`);
          continue;
        }

        if (!currentProfile.twitterAccessToken || !currentProfile.twitterAccessSecret) {
          throw new Error("Twitter token bilgileri eksik");
        }

        // Tweet'i yayınla
        const result = await sendTweet({
          accessToken: currentProfile.twitterAccessToken,
          accessSecret: currentProfile.twitterAccessSecret
        }, content.content);

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || "Tweet gönderilemedi");
        }

        const tweetId = result.data.data.id;

        // İçeriği güncelle
        if (content.id) {
          const contentRef = doc(db, "contents", content.id);
          await updateDoc(contentRef, {
            status: "published" as ContentStatus,
            publishedAt: Timestamp.fromDate(new Date()),
            tweetId,
            error: null
          });
        }

        // Başarılı log kaydı
        await createLog({
          userId: currentProfile.userId,
          type: LogType.TWEET_PUBLISHED,
          severity: LogSeverity.LOW,
          message: "Tweet başarıyla yayınlandı",
          metadata: {
            profileId: content.profileId,
            details: {
              tweetId,
              content: content.content
            }
          }
        });

      } catch (error) {
        console.error(`[CRON] ${content.id} içeriği için yayınlama hatası:`, error);

        // İçeriği hata durumuna güncelle
        if (content.id) {
          const contentRef = doc(db, "contents", content.id);
          await updateDoc(contentRef, {
            status: "failed" as ContentStatus,
            error: error instanceof Error ? error.message : "Bilinmeyen hata"
          });
        }

        // Hata logu
        await createLog({
          userId: currentProfile?.userId || "",
          type: LogType.API_ERROR,
          severity: LogSeverity.HIGH,
          message: "Tweet yayınlanırken hata oluştu",
          metadata: {
            profileId: content.profileId,
            details: {
              error: error instanceof Error ? error.message : "Bilinmeyen hata"
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tweet yayınlama işlemi tamamlandı"
    });

  } catch (error) {
    console.error("[CRON] Tweet yayınlama genel hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Tweet yayınlama işleminde hata oluştu"
      },
      { status: 500 }
    );
  }
} 