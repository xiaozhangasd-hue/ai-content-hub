/**
 * TTS API 路由
 * POST /api/tts
 * 
 * 支持MiniMax和硅基流动的语音合成
 */

import { NextRequest, NextResponse } from "next/server";
import { TTSClient, TTSRequest } from "@/lib/tts-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId, speed, format } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供要合成的文本" },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "文本长度不能超过500字" },
        { status: 400 }
      );
    }

    const client = new TTSClient();
    
    const ttsRequest: TTSRequest = {
      text,
      voiceId: voiceId || "female-tianmei",
      speed: speed || 1.0,
      format: format || "mp3",
    };

    const result = await client.synthesize(ttsRequest);

    if (result.audioData) {
      // 返回音频数据
      return new NextResponse(new Uint8Array(result.audioData), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": result.audioData.length.toString(),
          "Content-Disposition": `inline; filename="tts-${Date.now()}.mp3"`,
        },
      });
    }

    if (result.audioUrl) {
      return NextResponse.json({
        success: true,
        audioUrl: result.audioUrl,
        duration: result.duration,
      });
    }

    return NextResponse.json(
      { error: "语音合成失败" },
      { status: 500 }
    );
  } catch (error) {
    console.error("TTS API错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "语音合成失败" },
      { status: 500 }
    );
  }
}

// 获取可用音色列表
export async function GET() {
  const client = new TTSClient();
  const voices = client.getAvailableVoices();
  
  return NextResponse.json({
    success: true,
    provider: process.env.TTS_PROVIDER || "siliconflow",
    voices,
  });
}
