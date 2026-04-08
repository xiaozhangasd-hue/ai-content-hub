import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取周课表
 * GET /api/mini/schedule?childId=xxx&weekStart=2024-01-15
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
    const weekStartStr = searchParams.get("weekStart");

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
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: "active" },
            },
          },
        },
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    // 计算周起始日期
    let weekStart: Date;
    if (weekStartStr) {
      weekStart = new Date(weekStartStr);
    } else {
      weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      const dayOfWeek = weekStart.getDay();
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      weekStart.setDate(diff);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const classIds = parentChild.student.enrollments.map((e) => e.classId);

    // 获取该周的课程
    const lessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
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
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 按星期分组
    const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const schedule: Record<string, typeof lessons> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    lessons.forEach((lesson) => {
      const dayOfWeek = lesson.date.getDay();
      const dayName = weekDays[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
      schedule[dayName].push({
        ...lesson,
      } as typeof lessons[0]);
    });

    const response = {
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
      schedule: Object.fromEntries(
        weekDays.map((day) => [
          day,
          schedule[day].map((l) => ({
            id: l.id,
            className: l.class.name,
            teacher: l.class.teacher?.name,
            date: l.date.toISOString().split("T")[0],
            startTime: l.startTime,
            endTime: l.endTime,
            classroom: l.classroom,
            topic: l.topic,
            status: l.status,
          })),
        ])
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取课表错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
