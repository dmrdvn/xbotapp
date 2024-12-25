import { Profile } from "@/types/profile";
import { ContentType } from "@/types/Content";

interface GenerateContentProps {
  profile: Profile;
  context: string;
  type: ContentType;
  tone?: string;
  language?: string;
}

// Client tarafında kullanılacak fonksiyon
export async function generateContent(props: GenerateContentProps): Promise<string> {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(props),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || "İçerik üretilemedi");
    }

    return data.data;
  } catch (error) {
    console.error("İçerik üretme hatası:", error);
    throw new Error("İçerik üretilemedi");
  }
}

// Client tarafında kullanılacak fonksiyon
export async function generateThread(
  props: Omit<GenerateContentProps, "type"> & { numberOfTweets?: number }
): Promise<string[]> {
  try {
    const response = await fetch("/api/ai/generate-thread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(props),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error?.message || "Thread üretilemedi");
    }

    return data.data;
  } catch (error) {
    console.error("Thread üretme hatası:", error);
    throw new Error("Thread üretilemedi");
  }
} 