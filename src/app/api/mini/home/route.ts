import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取首页数据
 * GET /api/mini/home?childId=xxx
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

    // 获取家长关联的孩子
    const parentWithChildren = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        children: {
          where: { status: "active" },
          include: {
            student: {
              include: {
                campus: true,
                enrollments: {
                  where: { status: "active" },
                  include: {
                    class: {
                      include: {
                        courseTemplate: true,
                        teacher: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parentWithChildren || parentWithChildren.children.length === 0) {
      return NextResponse.json({
        child: null,
        todaySchedule: { hasClass: false },
        hoursSummary: null,
        latestFeedback: null,
        unreadCount: { feedbacks: 0, notices: 0, growth: 0 },
        bindChildRequired: true,
      });
    }

    // 确定要查询的孩子
    const targetChild = childId
      ? parentWithChildren.children.find((c) => c.studentId === childId)
      : parentWithChildren.children[0];

    if (!targetChild) {
      return NextResponse.json({ error: "孩子不存在" }, { status: 404 });
    }

    const student = targetChild.student;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取今日课程
    const todayLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: student.enrollments.map((e) => e.classId) },
        date: today,
        status: { not: "cancelled" },
      },
      include: {
        class: {
          include: {
            teacher: true,
            courseTemplate: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // 获取课时余额
    const enrollmentsWithHours = student.enrollments.map((e) => ({
      classId: e.classId,
      className: e.class.name,
      remainingHours: e.remainingHours,
      totalHours: e.totalHours,
    }));

    const totalRemaining = enrollmentsWithHours.reduce(
      (sum, e) => sum + e.remainingHours,
      0
    );

    // 获取最新点评
    const latestFeedback = await prisma.feedback.findFirst({
      where: { studentId: student.id },
      include: {
        lesson: {
          include: { class: true },
        },
        teacher: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 获取未读消息数量
    const unreadNotifications = await prisma.notification.groupBy({
      by: ["type"],
      where: {
        parentId,
        isRead: false,
      },
      _count: { id: true },
    });

    const unreadCount = {
      feedbacks: unreadNotifications.find((n) => n.type === "feedback")?._count.id || 0,
      notices: unreadNotifications.find((n) => n.type === "notice")?._count.id || 0,
      growth: unreadNotifications.find((n) => n.type === "growth")?._count.id || 0,
    };

    // 构建响应
    const response = {
      child: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        campus: student.campus?.name,
      },
      todaySchedule: {
        hasClass: todayLessons.length > 0,
        lesson: todayLessons[0]
          ? {
              id: todayLessons[0].id,
              className: todayLessons[0].class.name,
              teacher: todayLessons[0].class.teacher?.name,
              date: todayLessons[0].date.toISOString().split("T")[0],
              startTime: todayLessons[0].startTime,
              endTime: todayLessons[0].endTime,
              classroom: todayLessons[0].classroom,
              topic: todayLessons[0].topic,
            }
          : null,
        allLessons: todayLessons.map((l) => ({
          id: l.id,
          className: l.class.name,
          startTime: l.startTime,
          endTime: l.endTime,
        })),
      },
      hoursSummary: {
        totalHours: student.enrollments.reduce((sum, e) => sum + e.totalHours, 0),
        remainingHours: totalRemaining,
        warningLevel:
          totalRemaining < 3
            ? "critical"
            : totalRemaining < 5
            ? "low"
            : "normal",
        details: enrollmentsWithHours,
      },
      latestFeedback: latestFeedback
        ? {
            id: latestFeedback.id,
            date: latestFeedback.lesson.date.toISOString().split("T")[0],
            className: latestFeedback.lesson.class.name,
            teacher: latestFeedback.teacher.name,
            content: latestFeedback.content,
            images: latestFeedback.images ? JSON.parse(latestFeedback.images) : [],
            liked: latestFeedback.liked,
          }
        : null,
      unreadCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取首页数据错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
