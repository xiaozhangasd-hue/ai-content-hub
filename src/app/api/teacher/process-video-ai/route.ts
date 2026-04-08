import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addVideoProcessingJob } from "@/lib/video-queue";
import { randomUUID } from "crypto";

/**
 * 提交视频AI处理任务
 * POST /api/teacher/process-video-ai
 * 
 * 请求体：
 * - videoUrl: 视频URL（必填）
 * - lessonId: 关联课程ID（可选）
 * - options: 处理选项（可选）
 */
export async function POST(request: NextRequest) {
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

    const merchantId = payload.merchantId;
    const teacherId = payload.teacherId;

    // 解析请求体
    const body = await request.json();
    const { videoUrl, lessonId, options } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: "视频URL不能为空" }, { status: 400 });
    }

    // 验证视频URL格式
    try {
      new URL(videoUrl);
    } catch {
      return NextResponse.json({ error: "视频URL格式不正确" }, { status: 400 });
    }

    // 获取老师信息（如果是老师角色）
    let campusId: string | undefined;
    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: {
          id: teacherId,
          merchantId,
        },
        select: {
          id: true,
          campusId: true,
        },
      });

      if (!teacher) {
        return NextResponse.json({ error: "老师不存在" }, { status: 404 });
      }
      campusId = teacher.campusId || undefined;
    }

    // 生成任务ID
    const taskId = `vpt-${Date.now()}-${randomUUID().substring(0, 8)}`;

    // 添加到队列
    await addVideoProcessingJob({
      taskId,
      videoUrl,
      merchantId,
      teacherId,
      campusId,
      lessonId,
      options: options || {
        frameInterval: 1,
        minClipDuration: 5,
        maxClipDuration: 30,
        confidenceThreshold: 80,
        mergeGap: 3,
        generateThumbnails: true,
      },
    });

    return NextResponse.json({
      success: true,
      taskId,
      message: "视频处理任务已提交，请稍后查询处理结果",
    });
  } catch (error) {
    console.error("提交视频处理任务错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交任务失败" },
      { status: 500 }
    );
  }
}

/**
 * 获取视频处理任务列表
 * GET /api/teacher/process-video-ai
 * 
 * 查询参数：
 * - status: 任务状态过滤
 * - page: 页码
 * - pageSize: 每页数量
 */
export async function GET(request: NextRequest) {
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

    const merchantId = payload.merchantId;
    const teacherId = payload.teacherId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件
    const where: Record<string, unknown> = {
      merchantId,
      teacherId,
    };

    if (status) {
      where.status = status;
    }

    // 查询任务列表
    const [tasks, total] = await Promise.all([
      prisma.videoProcessingTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { clips: true },
          },
        },
      }),
      prisma.videoProcessingTask.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tasks.map((task) => ({
        taskId: task.taskId,
        videoUrl: task.videoUrl,
        videoDuration: task.videoDuration,
        status: task.status,
        progress: task.progress,
        errorMessage: task.errorMessage,
        clipCount: task._count.clips,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取视频处理任务列表错误:", error);
    return NextResponse.json(
      { error: "获取任务列表失败" },
      { status: 500 }
    );
  }
}
