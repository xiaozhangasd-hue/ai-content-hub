import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取成长档案列表
 * GET /api/mini/growth?childId=xxx&type=all&page=1&pageSize=20
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const parentId = payload.parentId;
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!childId) {
      return NextResponse.json({ error: "缺少孩子ID" }, { status: 400 });
    }

    // 验证家长是否有权限访问该孩子
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId,
        studentId: childId,
        status: "active",
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    // 构建查询条件
    const where: Record<string, unknown> = {
      studentId: childId,
      isPublic: true,
    };

    if (type !== "all") {
      where.type = type;
    }

    // 获取成长档案
    const [records, total] = await Promise.all([
      prisma.growthRecord.findMany({
        where,
        orderBy: { recordDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.growthRecord.count({ where }),
    ]);

    // 获取关联的反馈
    const feedbackIds = records.filter(r => r.feedbackId).map(r => r.feedbackId as string);
    const feedbacks = feedbackIds.length > 0 ? await prisma.feedback.findMany({
      where: { id: { in: feedbackIds } },
      include: {
        lesson: { include: { class: true } },
        teacher: true,
      },
    }) : [];

    const feedbackMap = new Map(feedbacks.map(f => [f.id, f]));

    const growthRecords = records.map((r) => {
      const feedback = r.feedbackId ? feedbackMap.get(r.feedbackId) : null;
      return {
        id: r.id,
        type: r.type,
        title: r.title,
        content: r.content,
        media: r.media ? JSON.parse(r.media) : [],
        recordDate: r.recordDate.toISOString().split("T")[0],
        tags: r.tags ? JSON.parse(r.tags) : [],
        className: feedback?.lesson?.class?.name,
        teacher: feedback?.teacher?.name,
      };
    });

    return NextResponse.json({
      records: growthRecords,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取成长档案错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
