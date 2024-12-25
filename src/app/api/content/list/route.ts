import { NextResponse } from "next/server";
import { db } from "@/services/firebase/config";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    // URL'den profileId'yi al
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: "INVALID_DATA",
            message: "Profile ID gerekli"
          }
        },
        { status: 400 }
      );
    }

    // Firebase'den içerikleri çek
    const contentsRef = collection(db, "contents");
    const q = query(
      contentsRef,
      where("profileId", "==", profileId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const contents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: contents
    });

  } catch (error) {
    console.error("[API] Content list hatası:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: error instanceof Error ? error.message : "İçerikler listelenirken bir hata oluştu"
        }
      },
      { status: 500 }
    );
  }
} 