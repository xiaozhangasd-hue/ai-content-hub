/**
 * 语音合成工具
 * 使用硅基流动或MiniMax生成语音
 */

interface TTSGenerationParams {
  text: string;
  voiceId?: string;
  speed?: number;
  format?: "mp3" | "wav";
}

interface TTSGenerationResult {
  success: boolean;
  audioUrl?: string;
  audioData?: ArrayBuffer;
  duration?: number;
  error?: string;
}

// 可用音色列表
export const AVAILABLE_VOICES = [
  { id: "female-tianmei", name: "甜美女声", description: "温柔甜美的女声" },
  { id: "male-qingxin", name: "清新男声", description: "年轻清新的男声" },
  { id: "female-zhixin", name: "知性女声", description: "知性优雅的女声" },
  { id: "male-chenshu", name: "沉稳男声", description: "沉稳大气的男声" },
  { id: "female-keai", name: "可爱女声", description: "活泼可爱的女声" },
  { id: "male-langdu", name: "朗诵男声", description: "适合朗诵的男声" },
];

export async function generateTTS(params: TTSGenerationParams): Promise<TTSGenerationResult> {
  const { text, voiceId = "female-tianmei", speed = 1.0, format = "mp3" } = params;

  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: "请提供要合成的文本",
    };
  }

  if (text.length > 500) {
    return {
      success: false,
      error: "文本长度不能超过500字",
    };
  }

  try {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voiceId,
        speed,
        format,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `语音合成失败: ${response.status}`,
      };
    }

    // 检查返回类型
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("audio")) {
      // 直接返回音频数据
      const audioData = await response.arrayBuffer();
      return {
        success: true,
        audioData,
      };
    } else {
      // 返回JSON（包含URL）
      const data = await response.json();
      return {
        success: true,
        audioUrl: data.audioUrl,
        duration: data.duration,
      };
    }
  } catch (error) {
    console.error("TTS generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "语音合成失败",
    };
  }
}

/**
 * 根据场景推荐音色
 */
export function recommendVoice(scene: string): string {
  const voiceMap: Record<string, string> = {
    招生宣传: "female-tianmei",
    课程介绍: "female-zhixin",
    活动播报: "male-chenshu",
    儿童故事: "female-keai",
    机构介绍: "male-langdu",
    默认: "female-tianmei",
  };

  return voiceMap[scene] || voiceMap.默认;
}
