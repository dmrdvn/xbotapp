import { db } from "./config";
import { collection, addDoc, updateDoc, doc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { ApiResponse } from "@/types/api";

export interface Content {
  id?: string;
  profileId: string;
  content: string;
  status: "draft" | "queued" | "published";
  createdAt: Date | string;
  scheduledFor?: Date | string;
  publishedAt?: Date | null;
  error?: string | null;
}

// İçerik oluşturma
export async function createContent(content: Omit<Content, "id">): Promise<ApiResponse<{ id: string }>> {
  try {
    console.log("Firebase'e kaydedilecek içerik:", content);

    // Veri doğrulama
    if (!content.profileId || !content.content || !content.status) {
      return {
        success: false,
        error: {
          code: "INVALID_CONTENT_DATA",
          message: "Geçersiz içerik verisi"
        }
      };
    }

    // Tarihleri Date objesine çevir
    const createdAt = typeof content.createdAt === 'string' ? new Date(content.createdAt) : content.createdAt;
    const scheduledFor = content.scheduledFor ? 
      (typeof content.scheduledFor === 'string' ? new Date(content.scheduledFor) : content.scheduledFor) : 
      null;

    const docRef = await addDoc(collection(db, "contents"), {
      ...content,
      createdAt: Timestamp.fromDate(createdAt),
      scheduledFor: scheduledFor ? Timestamp.fromDate(scheduledFor) : null,
      publishedAt: null
    });

    console.log("Firebase'e kaydedilen içerik ID:", docRef.id);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error("Firebase içerik oluşturma hatası:", error);
    return {
      success: false,
      error: {
        code: "CONTENT_CREATE_ERROR",
        message: error instanceof Error ? error.message : "İçerik oluşturulurken bir hata oluştu"
      }
    };
  }
}

// İçerik durumunu güncelleme
export async function updateContentStatus(
  contentId: string,
  status: Content["status"],
  error?: string
): Promise<ApiResponse<void>> {
  try {
    const contentRef = doc(db, "contents", contentId);
    const updates: Partial<Content> = { status };

    if (status === "published") {
      updates.publishedAt = new Date();
    }

    if (error) {
      updates.error = error;
    }

    await updateDoc(contentRef, updates);

    return {
      success: true
    };
  } catch (error) {
    console.error("İçerik güncelleme hatası:", error);
    return {
      success: false,
      error: {
        code: "CONTENT_UPDATE_ERROR",
        message: "İçerik güncellenirken bir hata oluştu"
      }
    };
  }
}

// Yayınlanmamış içerikleri getirme
export async function getUnpublishedContents(): Promise<ApiResponse<Content[]>> {
  try {
    const q = query(
      collection(db, "contents"),
      where("status", "in", ["draft", "queued"])
    );

    const querySnapshot = await getDocs(q);
    const contents: Content[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        publishedAt: data.publishedAt?.toDate()
      } as Content);
    });

    return {
      success: true,
      data: contents
    };
  } catch (error) {
    console.error("İçerik getirme hatası:", error);
    return {
      success: false,
      error: {
        code: "CONTENT_FETCH_ERROR",
        message: "İçerikler getirilirken bir hata oluştu"
      }
    };
  }
}

// Profil bazlı içerikleri getirme
export async function getProfileContents(profileId: string): Promise<ApiResponse<Content[]>> {
  try {
    const q = query(
      collection(db, "contents"),
      where("profileId", "==", profileId)
    );

    const querySnapshot = await getDocs(q);
    const contents: Content[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      contents.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        scheduledFor: data.scheduledFor?.toDate(),
        publishedAt: data.publishedAt?.toDate()
      } as Content);
    });

    return {
      success: true,
      data: contents
    };
  } catch (error) {
    console.error("İçerik getirme hatası:", error);
    return {
      success: false,
      error: {
        code: "CONTENT_FETCH_ERROR",
        message: "İçerikler getirilirken bir hata oluştu"
      }
    };
  }
} 