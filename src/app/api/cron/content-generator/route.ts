import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { generateContent } from "@/services/openai/content";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { Profile } from "@/types/profile";
import { ContentType } from "@/types/Content";

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

    console.log("[CRON] İçerik üretme işlemi başladı");

    // Aktif profilleri bul
    const profilesRef = collection(db, "profiles");
    const q = query(
      profilesRef,
      where("isActive", "==", true),
      where("twitterConnected", "==", true)
    );

    const profilesSnapshot = await getDocs(q);
    const profiles = profilesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Profile[];

    console.log(`[CRON] ${profiles.length} aktif profil bulundu`);

    // Her profil için içerik üret
    for (const profile of profiles) {
      try {
        console.log(`[CRON] ${profile.id} profili için içerik üretiliyor`);

        // OpenAI ile 6 adet içerik üret
        const contentPromises = Array(6).fill(null).map(() => {
          // Rastgele bir ton seç
          const randomTone = profile.toneOfVoice?.length 
            ? profile.toneOfVoice[Math.floor(Math.random() * profile.toneOfVoice.length)]
            : "neutral";

          return generateContent({
            profile,
            context: "",
            type: ContentType.TWEET,
            tone: randomTone,
            language: profile.language
          });
        });

        const generatedContents = (await Promise.all(contentPromises)) as unknown as string[];

        // Üretilen içerikleri veritabanına kaydet
        const savePromises = generatedContents.map((content: string) => {
          const now = new Date();
          return addDoc(collection(db, "contents"), {
            profileId: profile.id,
            userId: profile.userId,
            type: ContentType.TWEET,
            content: content,
            status: "queued" as const,
            createdAt: now,
            scheduledFor: null,
            publishedAt: null,
            error: null
          });
        });

        const savedContents = await Promise.all(savePromises);

        // Başarılı log kaydı
        await createLog({
          userId: profile.userId,
          type: LogType.TWEET_CREATED,
          severity: LogSeverity.LOW,
          message: `${generatedContents.length} adet içerik başarıyla oluşturuldu`,
          metadata: {
            profileId: profile.id,
            details: {
              content: `${generatedContents.length} tweet oluşturuldu`,
              contentId: savedContents[0].id
            }
          }
        });

      } catch (error) {
        console.error(`[CRON] ${profile.id} profili için içerik üretme hatası:`, error);

        // Hata logu
        await createLog({
          userId: profile.userId,
          type: LogType.OPENAI_ERROR,
          severity: LogSeverity.HIGH,
          message: "İçerik üretilirken hata oluştu",
          metadata: {
            profileId: profile.id,
            details: {
              error: error instanceof Error ? error.message : "Bilinmeyen hata"
            }
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "İçerik üretme işlemi tamamlandı"
    });

  } catch (error) {
    console.error("[CRON] İçerik üretme genel hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "İçerik üretme işleminde hata oluştu"
      },
      { status: 500 }
    );
  }
} 