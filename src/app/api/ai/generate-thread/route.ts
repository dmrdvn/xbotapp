import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Profile } from "@/types/profile";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { profile, context, numberOfTweets = 3 }: {
      profile: Profile;
      context: string;
      numberOfTweets?: number;
    } = await request.json();

    const prompt = `
      Sen ${profile.name} adında bir Twitter kullanıcısısın.
      Meslek: ${profile.occupation}
      Kişilik: ${profile.personalityTraits?.join(", ")}
      İlgi Alanları: ${profile.interests?.join(", ")}
      Ton: ${profile.toneOfVoice}
      Dil: ${profile.language}

      Şu konu hakkında ${numberOfTweets} tweet'lik bir thread oluştur: ${context}

      Not: Her tweet maksimum 280 karakter olmalı ve son tweet hariç numaralandırılmalı (1/3 gibi).
      Thread'in son tweet'inde ilgili hashtagler olmalı.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen profesyonel bir sosyal medya içerik üreticisisin."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    // Thread'i tweet'lere ayır
    const tweets = content.split("\n").filter((tweet: string) => tweet.trim().length > 0);

    return NextResponse.json({
      success: true,
      data: tweets,
    });
  } catch (error) {
    console.error("Thread üretme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "THREAD_GENERATION_ERROR",
          message: "Thread üretilemedi",
        },
      },
      { status: 500 }
    );
  }
} 