import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { Profile } from "@/types/profile";
import { Content, ContentStatus } from "@/types/Content";

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

    console.log("[CRON] Tweet kuyruğu yönetimi başladı");

    // Kuyrukta bekleyen içerikleri bul
    const contentsRef = collection(db, "contents");
    const q = query(
      contentsRef,
      where("status", "==", "queued" as ContentStatus),
      where("scheduledFor", "==", null)
    );

    const contentsSnapshot = await getDocs(q);
    const contents = contentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Content[];

    console.log(`[CRON] ${contents.length} adet kuyrukta bekleyen içerik bulundu`);

    // Her içerik için planlama yap
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

        // Aktif saatleri kontrol et
        const now = new Date();
        const currentHour = now.getHours();
        
        // Profil'in aktif saatlerini kullan veya varsayılan saatleri kullan
        const startHour = currentProfile.botBehavior?.activeHoursStart ?? 9;
        const endHour = currentProfile.botBehavior?.activeHoursEnd ?? 20;
        
        // Aktif saatler aralığını oluştur
        const activeHours = Array.from(
          { length: endHour - startHour + 1 },
          (_, i) => startHour + i
        );
        
        // Sonraki aktif saati bul
        let nextActiveHour = activeHours.find(hour => hour > currentHour);
        if (!nextActiveHour) {
          nextActiveHour = activeHours[0]; // Sonraki gün ilk saat
        }

        // Random bir zaman aralığı belirle (saat başından +/- 30 dk)
        const randomMinuteOffset = Math.floor(Math.random() * 60); // 0-59 arası
        const randomSecondOffset = Math.floor(Math.random() * 60); // 0-59 arası

        // Planlama zamanını ayarla
        const scheduledDate = new Date();
        if (nextActiveHour <= currentHour) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }
        
        // Zamanı ayarla
        scheduledDate.setHours(
          nextActiveHour,
          randomMinuteOffset,
          randomSecondOffset,
          0
        );

        console.log(`[CRON] Tweet planlanıyor - Saat: ${scheduledDate.toLocaleTimeString()}`);

        // İçeriği güncelle
        if (content.id) {
          const contentRef = doc(db, "contents", content.id);
          await updateDoc(contentRef, {
            scheduledFor: Timestamp.fromDate(scheduledDate),
            status: "scheduled" as ContentStatus
          });
        }

        // Başarılı log kaydı
        await createLog({
          userId: currentProfile.userId,
          type: LogType.TWEET_SCHEDULED,
          severity: LogSeverity.LOW,
          message: "Tweet planlandı",
          metadata: {
            profileId: content.profileId,
            details: {
              scheduledFor: scheduledDate
            }
          }
        });

      } catch (error) {
        console.error(`[CRON] ${content.id} içeriği için planlama hatası:`, error);

        // Hata logu
        await createLog({
          userId: currentProfile?.userId || "",
          type: LogType.API_ERROR,
          severity: LogSeverity.HIGH,
          message: "Tweet planlanırken hata oluştu",
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
      message: "Tweet kuyruğu yönetimi tamamlandı"
    });

  } catch (error) {
    console.error("[CRON] Tweet kuyruğu yönetimi genel hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Tweet kuyruğu yönetiminde hata oluştu"
      },
      { status: 500 }
    );
  }
} 