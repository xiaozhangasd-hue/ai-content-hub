import { NextRequest, NextResponse } from "next/server";
import { KlingAIClient } from "@/lib/kling-client";

/**
 * 查询任务状态接口
 * GET /api/kling/task/[taskId]?type=text2video
 * 
 * 功能：查询可灵AI任务状态
 * 参数：
 * - type: 任务类型 (text2video, image2video, lip-sync)，默认text2video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json(
        { error: "请提供任务ID" },
        { status: 400 }
      );
    }

    // 从URL查询参数获取任务类型
    const { searchParams } = new URL(request.url);
    const taskType = (searchParams.get('type') || 'text2video') as 'text2video' | 'image2video' | 'lip-sync';

    const client = new KlingAIClient();
    const result = await client.getTaskStatus(taskId, taskType);

    return NextResponse.json({
      success: true,
      ...result,
      status: result.status,
      videoUrl: result.result?.videoUrl,
      error: result.error,
    });
  } catch (error) {
    console.error("查询任务状态错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 }
    );
  }
}
