import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { doc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { sendTweet } from "@/services/twitter/api";

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
          throw new Error(tweetResult.error?.message || "Tweet gönderilemedi");
        }

        // Tweet gönderilme zamanını kaydet
        const now = new Date();
        const publishedAtTimestamp = Timestamp.fromDate(now);

        // İçeriği güncelle
        await updateDoc(contentRef, {
          status,
          publishedAt: publishedAtTimestamp,
          error: null
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