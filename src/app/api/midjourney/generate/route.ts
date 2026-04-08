import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ImageClient } from "@/lib/image-client";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    // 支持两种模式：
    // 1. 智能模式：直接传递prompt（推荐）
    // 2. 兼容模式：传递shopName, description, style
    const { prompt, shopName, description, style, size = "1024x1024" } = body;

    let finalPrompt = "";
    let title = "";

    if (prompt) {
      // 智能模式：直接使用前端生成的智能提示词
      finalPrompt = prompt;
      title = `AI生成图片 - ${new Date().toLocaleDateString()}`;
    } else if (shopName && description) {
      // 兼容模式：构建中文提示词
      finalPrompt = `${shopName}宣传图片：${description}。${style || "专业、现代、简洁"}风格，高质量商业摄影`;
      title = `${shopName} - 营销图片`;
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
        type: "image",
        title,
        description: description || "智能生成",
        status: "generating",
        prompt: finalPrompt,
      },
    });

    // 使用图片生成服务生成图片
    const client = new ImageClient();

    let imageUrls: string[] = [];
    try {
      imageUrls = await client.generate({
        prompt: finalPrompt,
        size: size as "512x512" | "768x768" | "1024x1024" | "1280x720" | "1920x1080",
      });
    } catch (error) {
      // 更新状态为失败
      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: "failed",
          content: error instanceof Error ? error.message : "图片生成失败",
        },
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "图片生成失败，请配置SILICONFLOW_API_KEY" },
        { status: 500 }
      );
    }

    if (imageUrls.length === 0) {
      // 更新状态为失败
      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: "failed",
          content: "图片生成失败",
        },
      });

      return NextResponse.json(
        { error: "图片生成失败" },
        { status: 500 }
      );
    }

    const imageUrl = imageUrls[0];

    // 更新内容记录
    await prisma.content.update({
      where: { id: content.id },
      data: {
        mediaUrl: imageUrl,
        content: finalPrompt,
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      contentId: content.id,
      imageUrl,
    });
  } catch (error) {
    console.error("图片生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "图片生成失败" },
      { status: 500 }
    );
  }
}
