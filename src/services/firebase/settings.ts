import { db } from "./config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Settings } from "@/types/Settings";

// Kullanıcı ayarlarını getir
export async function getUserSettings(userId: string) {
  try {
    const settingsRef = doc(db, "settings", userId);
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      return {
        success: true,
        data: settingsSnap.data() as Settings
      };
    }

    // Ayarlar bulunamadıysa varsayılan ayarları döndür
    return {
      success: true,
      data: {
        tweetFrequency: {
          minTweetsPerDay: 3,
          maxTweetsPerDay: 8,
          minInterval: 30,
        },
        replyFrequency: {
          minRepliesPerDay: 5,
          maxRepliesPerDay: 15,
          minInterval: 10,
        },
        interactionLimits: {
          maxLikesPerDay: 100,
          maxRetweetsPerDay: 20,
          maxFollowsPerDay: 20,
        },
        activeHours: {
          start: "09:00",
          end: "21:00",
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isEnabled: false,
      } as Settings
    };
  } catch (error) {
    console.error("Ayarlar getirilirken hata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    };
  }
}

// Kullanıcı ayarlarını güncelle
export async function updateUserSettings(userId: string, settings: Settings) {
  try {
    const settingsRef = doc(db, "settings", userId);
    await setDoc(settingsRef, settings, { merge: true });
    return {
      success: true
    };
  } catch (error) {
    console.error("Ayarlar güncellenirken hata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    };
  }
} 