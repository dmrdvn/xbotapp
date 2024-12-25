import { NextResponse } from "next/server";
import { updateContentStatus } from "@/services/firebase/content";
import { auth } from "@/services/firebase/config";

export async function POST(request: Request) {
  try {
    const session = await auth.currentUser;
    if (!session) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const { contentId, status } = await request.json();
    if (!contentId || !status) {
      return NextResponse.json(
        { error: "Geçersiz istek" },
        { status: 400 }
      );
    }

    const response = await updateContentStatus(contentId, status);
    if (!response.success) {
      return NextResponse.json(
        { error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("İçerik durumu güncelleme hatası:", error);
    return NextResponse.json(
      { error: "İçerik durumu güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 