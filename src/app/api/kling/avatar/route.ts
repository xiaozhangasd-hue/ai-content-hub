import { NextRequest, NextResponse } from "next/server";
import { KlingAIClient } from "@/lib/kling-client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * 数字人生成接口
 * POST /api/kling/avatar
 * 
 * 功能：生成AI数字人视频
 * 
 * 请求参数：
 * - name: 数字人名称
 * - image: 数字人形象图片URL（可选）
 * - text: 数字人要说的文本内容
 * - audio: 音频URL（可选，如果提供则使用该音频）
 * - model: 模型版本（v1或v2，默认v2）
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const { name, image, text, audio, model = 'v2', duration = 30 } = body;

    if (!name || (!text && !audio)) {
      return NextResponse.json(
        { error: "请提供数字人名称和文本内容或音频" },
        { status: 400 }
      );
    }

    if (!user.merchantId) {
      return NextResponse.json({ error: "缺少商户信息" }, { status: 400 });
    }

    // 创建内容记录
    const content = await prisma.content.create({
      data: {
        merchantId: user.merchantId,
        type: "video",
        title: `数字人视频 - ${name}`,
        description: text || "数字人说话",
        status: "generating",
        prompt: text || `数字人: ${name}`,
      },
    });

    // 使用可灵AI生成数字人
    const client = new KlingAIClient();

    try {
      const taskId = await client.generateAvatar({
        name,
        image,
        text,
        audio,
        model: model as 'v1' | 'v2',
        duration,
      });

      // 更新任务ID
      await prisma.content.update({
        where: { id: content.id },
        data: { prompt: `taskId:${taskId}` },
      });

      return NextResponse.json({
        success: true,
        contentId: content.id,
        taskId,
        message: "数字人生成任务已提交，请稍后查询结果",
      });
    } catch (error) {
      // 更新状态为失败
      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: "failed",
          content: error instanceof Error ? error.message : "数字人生成失败",
        },
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "数字人生成失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("数字人生成错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务错误" },
      { status: 500 }
    );
  }
}
