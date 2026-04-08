import { NextRequest, NextResponse } from "next/server";
import { KlingAIClient } from "@/lib/kling-client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * 对口型接口
 * POST /api/kling/lip-sync
 * 
 * 功能：让视频中的人物说话（嘴型与音频同步）
 * 
 * 支持两种模式：
 * 1. 音频模式：上传音频文件
 *    - videoUrl: 视频URL
 *    - audioUrl: 音频URL
 * 
 * 2. 文本模式：输入文案自动生成语音
 *    - videoUrl: 视频URL
 *    - text: 文案内容（最多120字符）
 *    - voiceId: 音色ID
 *    - voiceLanguage: 语言类型（zh/en）
 *    - voiceSpeed: 语速（0.8-2.0）
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const { 
      videoUrl, 
      mode = 'text',
      // 音频模式参数
      audioUrl,
      // 文本模式参数
      text,
      voiceId,
      voiceLanguage,
      voiceSpeed,
    } = body;

    // 验证必填参数
    if (!videoUrl) {
      return NextResponse.json(
        { error: "请提供视频URL" },
        { status: 400 }
      );
    }

    // 根据模式验证参数
    if (mode === 'audio') {
      if (!audioUrl) {
        return NextResponse.json(
          { error: "音频模式需要提供音频URL" },
          { status: 400 }
        );
      }
    } else {
      if (!text || !text.trim()) {
        return NextResponse.json(
          { error: "文本模式需要提供文案内容" },
          { status: 400 }
        );
      }
      if (text.length > 120) {
        return NextResponse.json(
          { error: "文案内容不能超过120个字符" },
          { status: 400 }
        );
      }
    }

    if (!user.merchantId) {
      return NextResponse.json({ error: "缺少商户信息" }, { status: 400 });
    }

    // 创建内容记录
    const content = await prisma.content.create({
      data: {
        merchantId: user.merchantId,
        type: "video",
        title: "对口型视频",
        description: mode === 'text' ? `文案: ${text?.slice(0, 50)}...` : "AI对口型生成",
        status: "generating",
        prompt: `视频: ${videoUrl.slice(0, 100)}`,
      },
    });

    // 使用可灵AI对口型功能
    const client = new KlingAIClient();

    try {
      let taskId: string;

      if (mode === 'audio') {
        // 音频模式
        taskId = await client.lipSync({
          videoUrl,
          audioUrl,
        });
      } else {
        // 文本模式
        taskId = await client.lipSync({
          videoUrl,
          text,
          voiceId: voiceId || 'genshin_klee2',
          voiceLanguage: voiceLanguage || 'zh',
          voiceSpeed: voiceSpeed || 1,
        });
      }

      // 更新任务ID
      await prisma.content.update({
        where: { id: content.id },
        data: { prompt: `taskId:${taskId}` },
      });

      return NextResponse.json({
        success: true,
        contentId: content.id,
        taskId,
        message: "对口型任务已提交，请稍后查询结果",
      });
    } catch (error) {
      // 更新状态为失败
      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: "failed",
          content: error instanceof Error ? error.message : "对口型失败",
        },
      });

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "对口型失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("对口型错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务错误" },
      { status: 500 }
    );
  }
}
