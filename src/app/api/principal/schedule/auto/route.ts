import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ScheduleRequest {
  classId: string;
  preferredTeachers?: string[];
  preferredTimes?: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  startDate: string;
  endDate: string;
  sessionsPerWeek: number;
}

/**
 * 自动排课
 * POST /api/principal/schedule/auto
 */
export async function POST(request: NextRequest) {
  try {
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
    const body: ScheduleRequest = await request.json();
    const {
      classId,
      preferredTimes = [],
      startDate,
      endDate,
      sessionsPerWeek = 1,
    } = body;

    // 验证班级
    const classData = await prisma.class.findFirst({
      where: { id: classId, merchantId },
      include: { teacher: true },
    });

    if (!classData) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }

    // 默认时间段
    const defaultTimes = preferredTimes.length > 0 ? preferredTimes : [
      { dayOfWeek: 1, startTime: "14:00", endTime: "15:00" },
      { dayOfWeek: 3, startTime: "14:00", endTime: "15:00" },
      { dayOfWeek: 5, startTime: "14:00", endTime: "15:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "11:00" },
      { dayOfWeek: 0, startTime: "10:00", endTime: "11:00" },
    ];

    // 生成排课方案
    const start = new Date(startDate);
    const end = new Date(endDate);
    const schedulePlan: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      teacherId: string | null;
      teacherName: string;
      conflict: boolean;
    }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const matchingTime = defaultTimes.find((t) => t.dayOfWeek === dayOfWeek);

      if (matchingTime) {
        let hasConflict = false;

        // 检查冲突
        if (classData.teacherId) {
          const existingLesson = await prisma.lesson.findFirst({
            where: {
              class: { teacherId: classData.teacherId },
              date: new Date(currentDate),
              OR: [
                {
                  AND: [
                    { startTime: { lte: matchingTime.startTime } },
                    { endTime: { gt: matchingTime.startTime } },
                  ],
                },
                {
                  AND: [
                    { startTime: { lt: matchingTime.endTime } },
                    { endTime: { gte: matchingTime.endTime } },
                  ],
                },
              ],
            },
          });

          hasConflict = !!existingLesson;
        }

        schedulePlan.push({
          date: new Date(currentDate),
          startTime: matchingTime.startTime,
          endTime: matchingTime.endTime,
          teacherId: classData.teacherId,
          teacherName: classData.teacher?.name || "未分配",
          conflict: hasConflict,
        });

        if (schedulePlan.length >= sessionsPerWeek * Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))) {
          break;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: schedulePlan.map((s) => ({
          date: s.date.toISOString().split("T")[0],
          dayOfWeek: ["日", "一", "二", "三", "四", "五", "六"][s.date.getDay()],
          startTime: s.startTime,
          endTime: s.endTime,
          teacherId: s.teacherId,
          teacherName: s.teacherName,
          conflict: s.conflict,
        })),
        classData: { id: classData.id, name: classData.name },
        summary: {
          totalSessions: schedulePlan.length,
          conflictSessions: schedulePlan.filter((s) => s.conflict).length,
        },
      },
    });
  } catch (error) {
    console.error("自动排课错误:", error);
    return NextResponse.json({ error: "自动排课失败" }, { status: 500 });
  }
}

/**
 * 确认并创建排课
 * PUT /api/principal/schedule/auto
 */
export async function PUT(request: NextRequest) {
  try {
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
    const body = await request.json();
    const { schedules, classId } = body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json({ error: "请提供排课数据" }, { status: 400 });
    }

    // 验证班级
    const classData = await prisma.class.findFirst({
      where: { id: classId, merchantId },
    });

    if (!classData) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }

    // 创建排课记录
    const createdSchedules = [];
    for (const schedule of schedules) {
      const { date, startTime, endTime } = schedule;

      const newLesson = await prisma.lesson.create({
        data: {
          classId,
          date: new Date(date),
          startTime,
          endTime,
          status: "scheduled",
        },
      });

      createdSchedules.push(newLesson);
    }

    return NextResponse.json({
      success: true,
      data: {
        created: createdSchedules.length,
        schedules: createdSchedules,
      },
    });
  } catch (error) {
    console.error("确认排课错误:", error);
    return NextResponse.json({ error: "确认排课失败" }, { status: 500 });
  }
}
