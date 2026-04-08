import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取点评列表
 * GET /api/mini/feedbacks?childId=xxx&page=1&pageSize=10
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

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

    // 获取点评列表
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { studentId: childId },
        include: {
          lesson: {
            include: { class: true },
          },
          teacher: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.feedback.count({
        where: { studentId: childId },
      }),
    ]);

    const feedbackList = feedbacks.map((f) => ({
      id: f.id,
      lessonId: f.lessonId,
      className: f.lesson.class.name,
      teacher: {
        id: f.teacher.id,
        name: f.teacher.name,
        avatar: f.teacher.avatar,
      },
      date: f.lesson.date.toISOString().split("T")[0],
      content: f.content,
      images: f.images ? JSON.parse(f.images) : [],
      ratings: f.ratings ? JSON.parse(f.ratings) : null,
      tags: f.tags ? JSON.parse(f.tags) : [],
      liked: f.liked,
      parentComment: f.parentComment,
    }));

    return NextResponse.json({
      feedbacks: feedbackList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取点评列表错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
