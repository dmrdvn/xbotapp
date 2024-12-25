import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ContentType } from "@/types/Content";
import { Profile } from "@/types/profile";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined in environment variables");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ApiError extends Error {
  status?: number;
}

export async function POST(request: Request) {
  try {
    const { profile }: {
      profile: Profile;
      context: string;
      type: ContentType;
    } = await request.json();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Profil bilgisi eksik",
          },
        },
        { status: 400 }
      );
    }

    // Profilin kişilik özelliklerini ve tercihlerini kullan
    const prompt = `
      Sen ${profile.name} adında bir Twitter kullanıcısısın.
      Meslek: ${profile.occupation}
      Kişilik: ${profile.personalityTraits?.join(", ")}
      İlgi Alanları: ${profile.interests?.join(", ")}
      Yaşam Tarzı: ${profile.lifestyle}
      Düşünce Yapısı: ${profile.mentality}
      Ton: ${profile.toneOfVoice}
      Dil: ${profile.language}

      Bu kişiliğe ve ilgi alanlarına uygun, özgün ve dikkat çekici bir tweet yaz.
      Tweet, kişinin karakterini ve uzmanlık alanını yansıtmalı.
      İlgi alanlarından birini veya bir kaçını konu alabilir.
      
      Not: 
      - Tweet maksimum 280 karakter olmalı
      - Doğal ve samimi bir dil kullan
      - Güncel ve trend konulara değin
      - İlgi çekici ve etkileşim alabilecek bir içerik olsun
      - Hashtagleri tweet'in sonuna ekle
      - Emojileri uygun yerlerde kullan
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Sen profesyonel bir sosyal medya içerik üreticisisin. Her profil için benzersiz ve karakteristik içerikler üretirsin."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 150,
      presence_penalty: 0.6,
      frequency_penalty: 0.4,
    });

    const content = response.choices[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error("İçerik üretilemedi");
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("İçerik üretme hatası:", apiError);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONTENT_GENERATION_ERROR",
          message: apiError.message || "İçerik üretilemedi",
        },
      },
      { status: apiError.status || 500 }
    );
  }
} 