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

    // Determine content focus: interests or required keywords
    const hasRequiredKeywords = profile.requiredKeywords && profile.requiredKeywords.length > 0;
    const useRequiredKeywords = hasRequiredKeywords && Math.random() < 0.9; // 90% chance to use required keywords if available

    // Select a random keyword or interest
    let selectedTopic = "";
    if (useRequiredKeywords && profile.requiredKeywords) {
      const keywordIndex = Math.floor(Math.random() * profile.requiredKeywords.length);
      selectedTopic = profile.requiredKeywords[keywordIndex];
    } else if (profile.interests) {
      const interestIndex = Math.floor(Math.random() * profile.interests.length);
      selectedTopic = profile.interests[interestIndex];
    }

    // Build system prompt based on content focus
    const systemPrompt = `You are a social media content creator and crypto/blockchain expert with the following characteristics:

Name: ${profile.name} ${profile.surname}
Age: ${profile.age}
Occupation: ${profile.occupation}
Lifestyle: ${profile.lifestyle?.join(", ")}
Mentality: ${profile.mentality?.join(", ")}
Tone of Voice: ${profile.toneOfVoice?.join(", ")}

${useRequiredKeywords ? 
  `Your primary task is to create content specifically about this crypto/blockchain project:
${selectedTopic}

You must follow these guidelines:
1. Focus exclusively on the specified project/keyword
2. Share concrete information about:
   - The project's core technology and infrastructure
   - Recent developments or updates
   - Unique features and use cases
   - Technical advantages or innovations
3. Use technical terms accurately but explain them simply
4. Base your content on real facts about the project
5. Keep a neutral, analytical tone
6. Avoid price discussion or financial advice
7. Make content educational and informative` :
  `Your task is to create content about this specific interest:
${selectedTopic}`}

Use this personality trait to influence your writing style:
${profile.personalityTraits?.[Math.floor(Math.random() * profile.personalityTraits.length)]}

Content Requirements:
1. Match your personality and tone of voice perfectly
2. Be extremely creative and original - avoid common phrases
3. Sound 100% natural and conversational
4. Complete all sentences fully
5. Never use hashtags
6. If writing about crypto projects, focus on technology and innovation
7. Include specific technical details that demonstrate expertise
8. Never sound promotional or bot-like
9. Be thought-provoking and engagement-worthy
10. Show deep understanding of blockchain technology`;

    // Create focused user prompt
    let userPrompt = useRequiredKeywords ?
      `Create a complete and insightful tweet about ${selectedTopic}. Focus on one specific aspect: either a technical feature, recent development, or unique capability. Include concrete details that demonstrate deep knowledge. Ensure all sentences are complete.` :
      `Create a unique and complete tweet about ${selectedTopic}. Focus on providing valuable insights or perspectives. Ensure all sentences are complete.`;

    // Add emoji guidance based on tone
    if (profile.toneOfVoice?.includes("serious") || profile.toneOfVoice?.includes("professional")) {
      userPrompt += "\nDon't use emojis";
    } else {
      userPrompt += "\nUse only 1-2 relevant emojis if appropriate";
    }

    // Add language preference
    userPrompt += `\nGenerate the content in ${profile.language || "Turkish"}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1.0,
      max_tokens: 350,
      presence_penalty: 1.2,
      frequency_penalty: 1.4,
      top_p: 0.9
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