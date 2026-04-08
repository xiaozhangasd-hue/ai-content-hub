/**
 * 视频生成工具
 * 使用可灵AI或Runway生成视频
 */

interface VideoGenerationParams {
  prompt: string;
  model?: "v1" | "v1-5" | "v2-5";
  mode?: "std" | "pro";
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

interface VideoGenerationResult {
  success: boolean;
  taskId?: string;
  contentId?: string;
  message?: string;
  error?: string;
}

export async function generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult> {
  const { prompt, model = "v1-5", mode = "std", duration = 5, aspectRatio = "16:9" } = params;

  if (!prompt || prompt.trim().length === 0) {
    return {
      success: false,
      error: "请提供视频生成提示词",
    };
  }

  try {
    const response = await fetch("/api/video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        model,
        mode,
        duration,
        aspectRatio,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `视频生成失败: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      taskId: data.taskId,
      contentId: data.contentId,
      message: data.message || "视频生成任务已提交，预计需要2-5分钟",
    };
  } catch (error) {
    console.error("Video generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "视频生成失败",
    };
  }
}

/**
 * 视频风格建议
 */
export const VIDEO_STYLES = {
  招生宣传: "professional, bright lighting, education setting, happy children",
  课程展示: "classroom environment, teaching scene, engaging atmosphere",
  机构介绍: "modern facility, clean environment, professional setting",
  活动花絮: "energetic, colorful, joyful moments, dynamic camera",
  学员风采: "showcase performance, stage lighting, proud moments",
};
