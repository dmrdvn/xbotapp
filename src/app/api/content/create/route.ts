import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { profileId, content, scheduledDate } = data;

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

    // Firebase'e kaydet
    console.log("Firebase'e kaydedilecek içerik:", data);
    const docRef = await addDoc(collection(db, "contents"), {
      profileId,
      content,
      status: "queued",
      createdAt: Timestamp.fromDate(new Date()),
      scheduledFor: data.scheduledFor ? Timestamp.fromDate(new Date(data.scheduledFor)) : null,
      publishedAt: null,
      error: null
    });
    console.log("Firebase'e kaydedilen içerik ID:", docRef.id);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id }
    });

  } catch (error) {
    console.error("[API] Content create hatası:", error);
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