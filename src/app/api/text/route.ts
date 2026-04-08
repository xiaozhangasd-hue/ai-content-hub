import { NextRequest, NextResponse } from "next/server";
import { AIClient, ChatMessage } from "@/lib/ai-client";

export async function POST(request: NextRequest) {
  try {
    const { prompt, systemPrompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "请输入文案需求" },
        { status: 400 }
      );
    }

    const client = new AIClient();

    const messages: ChatMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });

    // 返回流式响应
    return client.createStreamResponse(messages, {
      temperature: 0.8,
      maxTokens: 2000,
    });
  } catch (error) {
    console.error("文案生成错误:", error);
    const errorMessage = error instanceof Error ? error.message : "文案生成失败";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
