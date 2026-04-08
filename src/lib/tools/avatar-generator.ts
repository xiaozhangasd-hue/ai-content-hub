/**
 * 数字人生成工具
 * 使用可灵AI生成数字人视频
 */

interface AvatarGenerationParams {
  name?: string;
  text: string;
  image?: string;
  audio?: string;
  model?: "v1" | "v2";
  duration?: number;
}

interface AvatarGenerationResult {
  success: boolean;
  taskId?: string;
  contentId?: string;
  message?: string;
  error?: string;
}

export async function generateAvatar(params: AvatarGenerationParams): Promise<AvatarGenerationResult> {
  const { name = "AI助手", text, image, audio, model = "v2", duration = 30 } = params;

  if (!text && !audio) {
    return {
      success: false,
      error: "请提供数字人要说的文本内容或音频",
    };
  }

  try {
    // 调用可灵AI数字人API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/kling/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        text,
        image,
        audio,
        model,
        duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `数字人生成失败: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      taskId: data.taskId,
      contentId: data.contentId,
      message: data.message || "数字人视频生成任务已提交，预计需要1-3分钟",
    };
  } catch (error) {
    console.error("Avatar generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "数字人生成失败",
    };
  }
}

/**
 * 对口型工具
 * 让视频中的人物说话
 */
interface LipSyncParams {
  videoUrl: string;
  mode?: "text" | "audio";
  text?: string;
  audioUrl?: string;
  voiceId?: string;
  voiceLanguage?: "zh" | "en";
  voiceSpeed?: number;
}

interface LipSyncResult {
  success: boolean;
  taskId?: string;
  contentId?: string;
  message?: string;
  error?: string;
}

export async function generateLipSync(params: LipSyncParams): Promise<LipSyncResult> {
  const { videoUrl, mode = "text", text, audioUrl, voiceId, voiceLanguage = "zh", voiceSpeed = 1 } = params;

  if (!videoUrl) {
    return {
      success: false,
      error: "请提供视频URL",
    };
  }

  if (mode === "text" && !text) {
    return {
      success: false,
      error: "文本模式需要提供文案内容",
    };
  }

  if (mode === "audio" && !audioUrl) {
    return {
      success: false,
      error: "音频模式需要提供音频URL",
    };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/kling/lip-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl,
        mode,
        text,
        audioUrl,
        voiceId: voiceId || "genshin_klee2",
        voiceLanguage,
        voiceSpeed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `对口型生成失败: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      taskId: data.taskId,
      contentId: data.contentId,
      message: data.message || "对口型任务已提交，预计需要1-2分钟",
    };
  } catch (error) {
    console.error("Lip sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "对口型生成失败",
    };
  }
}
