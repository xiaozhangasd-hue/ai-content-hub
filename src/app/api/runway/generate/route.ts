import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { VideoClient } from "@/lib/video-client";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    // 支持两种模式：
    // 1. 智能模式：直接传递prompt（推荐）
    // 2. 兼容模式：传递shopName, description, duration, quality
    const { prompt, shopName, description, duration = 5, quality = "720p" } = body;

    let finalPrompt = "";
    let title = "";

    if (prompt) {
      // 智能模式：直接使用前端生成的智能提示词
      finalPrompt = prompt;
      title = `AI生成视频 - ${new Date().toLocaleDateString()}`;
    } else if (shopName && description) {
      // 兼容模式：构建中文提示词
      finalPrompt = `${shopName}宣传视频：${description}。高质量，专业，吸引人，${duration}秒`;
      title = `${shopName} - 营销视频`;
    } else {
      return NextResponse.json(
        { error: "请提供prompt或完整的商家信息" },
        { status: 400 }
      );
    }

    // 创建内容记录
    const content = await prisma.content.create({
      data: {
        merchantId: user.merchantId || "",
        type: "video",
        title,
        description: description || "智能生成",
        status: "generating",
        prompt: finalPrompt,
      },
    });

    // 使用视频生成服务
    const client = new VideoClient();

    const result = await client.generate({
      prompt: finalPrompt,
      duration,
      resolution: quality as "720p" | "1080p",
      aspectRatio: "16:9",
    });

    if (result.status !== 'completed' || !result.videoUrl) {
      // 更新状态为失败
      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: "failed",
          content: result.error || "视频生成失败",
        },
      });

      return NextResponse.json(
        { error: result.error || "视频生成失败，请配置视频生成服务" },
        { status: 500 }
      );
    }

    // 更新内容记录
    await prisma.content.update({
      where: { id: content.id },
      data: {
        mediaUrl: result.videoUrl,
        content: finalPrompt,
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      contentId: content.id,
      videoUrl: result.videoUrl,
    });
  } catch (error) {
    console.error("视频生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "视频生成失败" },
      { status: 500 }
    );
  }
}
