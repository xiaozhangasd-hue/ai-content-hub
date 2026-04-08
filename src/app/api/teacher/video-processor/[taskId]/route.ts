import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getTaskStatus, getQueueStats } from "@/lib/video-queue";

/**
 * 查询视频处理任务状态
 * GET /api/teacher/video-processor/:taskId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    // 验证身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json({ error: "任务ID不能为空" }, { status: 400 });
    }

    // 获取任务状态
    const task = await getTaskStatus(taskId);

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 获取队列统计信息
    const stats = await getQueueStats();

    return NextResponse.json({
      success: true,
      data: task,
      queueStats: stats,
    });
  } catch (error) {
    console.error("查询视频处理任务状态错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询任务状态失败" },
      { status: 500 }
    );
  }
}
