/**
 * 语音识别API
 * 使用硅基流动的语音识别服务
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("file") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "请提供音频文件" }, { status: 400 });
    }

    // 检查文件类型
    const validTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/webm", "audio/ogg"];
    if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(wav|mp3|webm|ogg)$/i)) {
      return NextResponse.json({ error: "不支持的音频格式，请使用 WAV、MP3、WebM 或 OGG 格式" }, { status: 400 });
    }

    // 检查文件大小 (最大 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "音频文件大小不能超过 10MB" }, { status: 400 });
    }

    // 调用硅基流动的语音识别API
    const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
    
    if (!siliconflowApiKey) {
      return NextResponse.json({ error: "语音识别服务未配置" }, { status: 500 });
    }

    // 准备上传的表单数据
    const uploadFormData = new FormData();
    uploadFormData.append("file", audioFile);
    uploadFormData.append("model", "FunAudioLLM/SenseVoiceSmall");

    const response = await fetch("https://api.siliconflow.cn/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${siliconflowApiKey}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Speech recognition error:", errorData);
      return NextResponse.json(
        { error: errorData.message || `语音识别失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      text: data.text || "",
      duration: data.duration,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "语音识别失败" },
      { status: 500 }
    );
  }
}
