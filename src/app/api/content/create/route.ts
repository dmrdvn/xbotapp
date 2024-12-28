import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";

export async function POST(request: Request) {
  let requestData;
  
  try {
    requestData = await request.json();
    const { profileId, content, scheduledDate } = requestData;

    // Debug için detaylı log
    console.log("[API] İçerik oluşturma detayları:", {
      profileId,
      content,
      scheduledDate,
      scheduledDateType: scheduledDate ? typeof scheduledDate : 'undefined'
    });

    if (!profileId || !content) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "INVALID_DATA",
            message: "Profile ID ve içerik gerekli"
          }
        },
        { status: 400 }
      );
    }

    // Profil bilgilerini al
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

    const profile = profileSnap.data();

    // Firebase'e kaydet
    console.log("Firebase'e kaydedilecek içerik:", requestData);
    const docRef = await addDoc(collection(db, "contents"), {
      profileId,
      userId: profile.userId,
      content,
      status: "queued",
      createdAt: Timestamp.fromDate(new Date()),
      scheduledFor: requestData.scheduledFor ? Timestamp.fromDate(new Date(requestData.scheduledFor)) : null,
      publishedAt: null,
      error: null
    });
    console.log("Firebase'e kaydedilen içerik ID:", docRef.id);

    // Başarılı log kaydı
    await createLog({
      userId: profile.userId,
      type: LogType.CONTENT_QUEUED,
      severity: LogSeverity.LOW,
      message: "İçerik manuel olarak oluşturuldu",
      metadata: {
        profileId,
        details: {
          contentId: docRef.id,
          content: content.substring(0, 100) + (content.length > 100 ? "..." : ""), // İlk 100 karakter
          scheduledFor: requestData.scheduledFor || null
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { id: docRef.id }
    });

  } catch (error) {
    console.error("[API] Content create hatası:", error);

    // Hata logu
    try {
      await createLog({
        userId: requestData?.profileId || "", // Profile ID'yi userId olarak kullan (daha iyi bir alternatif yok)
        type: LogType.API_ERROR,
        severity: LogSeverity.HIGH,
        message: "İçerik oluşturulurken hata oluştu",
        metadata: {
          profileId: requestData?.profileId,
          details: {
            error: error instanceof Error ? error.message : "Bilinmeyen hata"
          }
        }
      });
    } catch (logError) {
      console.error("[API] Log oluşturma hatası:", logError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error instanceof Error ? error.message : "İçerik oluşturulurken bir hata oluştu"
        }
      },
      { status: 500 }
    );
  }
} 