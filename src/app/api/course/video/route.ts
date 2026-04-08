import { NextRequest, NextResponse } from "next/server";
import { ttsClient } from "@/lib/tts-client";

// 动画风格选项
const ANIMATION_STYLES = [
  { id: "cartoon", name: "卡通可爱", desc: "适合幼儿课程" },
  { id: "watercolor", name: "水彩绘本", desc: "适合美术课程" },
  { id: "simple", name: "简笔画风", desc: "干净简洁" },
  { id: "colorful", name: "彩色涂鸦", desc: "活泼有趣" },
];

// 使用AI生成课程讲解文本（适合小朋友）
async function generateCourseNarration(
  slides: { title: string; content: string[] }[],
  courseTitle: string
): Promise<{ slideIndex: number; narration: string }[]> {
  const systemPrompt = `你是一位专业的少儿课程讲师，擅长用生动有趣的语言讲解课程内容。

请根据提供的PPT内容，为每一页生成讲解词（口播文案）。

要求：
- 语言生动有趣，适合小朋友听
- 每页讲解控制在100-150字
- 不要说"这一页讲的是"这种话
- 直接开始讲解内容
- 可以用比喻、故事化的方式讲解

请以JSON格式输出，格式如下：
{"narrations": [{"slideIndex": 0, "narration": "讲解内容"}, ...]}`;

  const slidesContent = slides
    .map((slide, index) => `[第${index + 1}页] ${slide.title}\n${slide.content?.join("、") || ""}`)
    .join("\n\n");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `课程标题：${courseTitle}

PPT内容：
${slidesContent}

请为每一页生成适合小朋友听的讲解词。`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("生成讲解词失败");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.narrations || parsed;
  } catch {
    throw new Error("解析讲解词失败");
  }
}

// 生成单页PPT对应的卡通图片提示词
async function generateImagePrompts(
  slides: { title: string; content: string[] }[],
  courseTitle: string,
  style: string
): Promise<{ slideIndex: number; prompt: string }[]> {
  const styleDescriptions: Record<string, string> = {
    cartoon: "可爱卡通风格，色彩鲜艳，适合儿童，扁平化设计",
    watercolor: "水彩绘本风格，柔和淡雅，艺术感强",
    simple: "简笔画风格，线条简单，干净清爽",
    colorful: "彩色涂鸦风格，活泼有趣，童趣十足",
  };

  const systemPrompt = `你是一位儿童插画师，擅长设计适合小朋友看的插画。

请为PPT的每一页生成一个图片描述提示词，用于AI生成插画。

风格要求：${styleDescriptions[style] || styleDescriptions.cartoon}

要求：
- 图片要与课程内容相关
- 画面要简洁清晰，不要太复杂
- 不要有文字
- 适合小朋友观看

请以JSON格式输出：{"prompts": [{"slideIndex": 0, "prompt": "图片描述"}, ...]}`;

  const slidesContent = slides
    .map((slide, index) => `[第${index + 1}页] ${slide.title}: ${slide.content?.join("，") || ""}`)
    .join("\n");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `课程标题：${courseTitle}

PPT内容：
${slidesContent}

请为每一页生成适合的卡通插画提示词。`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("生成图片提示词失败");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return parsed.prompts || [];
  } catch {
    throw new Error("解析图片提示词失败");
  }
}

// 生成单张卡通图片
async function generateCartoonImage(prompt: string, style: string): Promise<string | null> {
  const styleKeywords: Record<string, string> = {
    cartoon: "cute cartoon style, colorful, children illustration, flat design, kawaii, ",
    watercolor: "watercolor painting style, soft colors, artistic, storybook illustration, ",
    simple: "simple line drawing, minimalist, clean, doodle style, ",
    colorful: "colorful doodle style, playful, fun, child-friendly, vibrant colors, ",
  };

  const fullPrompt = (styleKeywords[style] || styleKeywords.cartoon) + prompt;

  // 使用硅基流动的图片生成API - Kolors模型
  const response = await fetch("https://api.siliconflow.cn/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: "Kwai-Kolors/Kolors",
      prompt: fullPrompt,
      image_size: "1024x1024",
      num_images: 1,
    }),
  });

  if (!response.ok) {
    console.error("图片生成失败:", await response.text());
    return null;
  }

  const data = await response.json();
  return data.images?.[0]?.url || null;
}

// 合并所有讲解文本
function mergeNarrations(
  narrations: { slideIndex: number; narration: string }[]
): string {
  return narrations
    .sort((a, b) => a.slideIndex - b.slideIndex)
    .map((n) => n.narration)
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, slides, courseTitle, voiceId, narration, style, imagePrompt } = body;

    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (action === "generate_narration") {
      // 生成讲解词
      if (!slides || !Array.isArray(slides)) {
        return NextResponse.json({ error: "请提供PPT内容" }, { status: 400 });
      }

      const narrations = await generateCourseNarration(slides, courseTitle);
      return NextResponse.json({ narrations });
    }

    if (action === "get_full_text") {
      // 获取完整讲解文本
      if (!slides || !Array.isArray(slides)) {
        return NextResponse.json({ error: "请提供PPT内容" }, { status: 400 });
      }

      const narrations = await generateCourseNarration(slides, courseTitle);
      const fullText = mergeNarrations(narrations);

      return NextResponse.json({
        narrations,
        fullText,
        estimatedDuration: Math.ceil(fullText.length / 4),
      });
    }

    if (action === "generate_image_prompts") {
      // 生成图片提示词
      if (!slides || !Array.isArray(slides)) {
        return NextResponse.json({ error: "请提供PPT内容" }, { status: 400 });
      }

      const prompts = await generateImagePrompts(slides, courseTitle, style || "cartoon");
      return NextResponse.json({ prompts });
    }

    if (action === "generate_image") {
      // 生成单张卡通图片
      if (!imagePrompt) {
        return NextResponse.json({ error: "请提供图片提示词" }, { status: 400 });
      }

      const imageUrl = await generateCartoonImage(imagePrompt, style || "cartoon");
      
      if (!imageUrl) {
        return NextResponse.json({ error: "图片生成失败" }, { status: 500 });
      }

      return NextResponse.json({ imageUrl });
    }

    if (action === "generate_audio") {
      // 生成音频
      if (!narration) {
        return NextResponse.json({ error: "请提供讲解文本" }, { status: 400 });
      }

      const maxLength = 800;
      const textToProcess = narration.slice(0, maxLength);

      const result = await ttsClient.synthesize({
        text: textToProcess,
        voiceId: voiceId || "zhinen_xuesheng",
        speed: 1.0,
        format: "mp3",
      });

      if (!result.audioData) {
        return NextResponse.json({ error: "音频生成失败" }, { status: 500 });
      }

      return new NextResponse(new Uint8Array(result.audioData), {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(courseTitle || "课程讲解")}.mp3"`,
        },
      });
    }

    if (action === "get_styles") {
      // 获取动画风格列表
      return NextResponse.json({ styles: ANIMATION_STYLES });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    console.error("课程视频API错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}
