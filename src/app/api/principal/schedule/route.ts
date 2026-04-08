import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取排课列表
 * GET /api/principal/schedule
 */
export async function GET(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const teacherId = searchParams.get("teacherId") || undefined;
    const courseId = searchParams.get("courseId") || undefined;

    // 获取课程记录
    const lessons = await prisma.lesson.findMany({
      where: {
        class: { merchantId },
        ...(startDate ? { date: { gte: new Date(startDate) } } : {}),
        ...(endDate ? { date: { lte: new Date(endDate) } } : {}),
        ...(teacherId ? { class: { teacherId } } : {}),
      },
      include: {
        class: {
          include: {
            teacher: true,
            courseTemplate: true,
          },
        },
        attendances: {
          include: {
            student: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 检测冲突
    const conflicts: Array<{ id: string; reason: string; conflicts: string[] }> = [];
    const teacherLessons = new Map<string, typeof lessons>();

    for (const lesson of lessons) {
      const tid = lesson.class.teacherId;
      if (!tid) continue;
      if (!teacherLessons.has(tid)) {
        teacherLessons.set(tid, []);
      }
      teacherLessons.get(tid)!.push(lesson);
    }

    for (const [tid, tLessons] of teacherLessons) {
      for (let i = 0; i < tLessons.length; i++) {
        for (let j = i + 1; j < tLessons.length; j++) {
          const l1 = tLessons[i];
          const l2 = tLessons[j];

          if (l1.date.toDateString() === l2.date.toDateString()) {
            const s1Start = l1.startTime || "00:00";
            const s1End = l1.endTime || "23:59";
            const s2Start = l2.startTime || "00:00";
            const s2End = l2.endTime || "23:59";

            if (s1Start < s2End && s2Start < s1End) {
              const teacherName = l1.class.teacher?.name || "未知教师";
              conflicts.push({
                id: l1.id,
                reason: `教师 ${teacherName} 在 ${l1.date.toLocaleDateString()} 时间冲突`,
                conflicts: [l1.id, l2.id],
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        schedules: lessons.map((l) => ({
          id: l.id,
          date: l.date,
          startTime: l.startTime || "09:00",
          endTime: l.endTime || "10:00",
          duration: calculateDuration(l.startTime || "09:00", l.endTime || "10:00"),
          status: l.status,
          teacher: l.class.teacher ? {
            id: l.class.teacher.id,
            name: l.class.teacher.name,
            avatar: l.class.teacher.avatar,
          } : null,
          course: l.class.courseTemplate ? {
            id: l.class.courseTemplate.id,
            name: l.class.courseTemplate.name,
          } : { id: l.class.id, name: l.class.name },
          student: l.attendances[0]?.student ? {
            id: l.attendances[0].student.id,
            name: l.attendances[0].student.name,
          } : null,
        })),
        conflicts,
      },
    });
  } catch (error) {
    console.error("获取排课列表错误:", error);
    return NextResponse.json({ error: "获取排课列表失败" }, { status: 500 });
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const startParts = startTime.split(":").map(Number);
  const endParts = endTime.split(":").map(Number);
  return (endParts[0] * 60 + endParts[1] - startParts[0] * 60 - startParts[1]) / 60;
}

/**
 * 创建排课
 * POST /api/principal/schedule
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
    const body = await request.json();
    const { classId, date, startTime, endTime, topic, note } = body;

    // 验证班级归属
    const classData = await prisma.class.findFirst({
      where: { id: classId, merchantId },
    });

    if (!classData) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }

    // 检查时间冲突
    if (classData.teacherId) {
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          class: { teacherId: classData.teacherId },
          date: new Date(date),
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
          ],
        },
      });

      if (existingLesson) {
        return NextResponse.json(
          { error: "该教师在该时间段已有课程安排" },
          { status: 409 }
        );
      }
    }

    // 创建课程
    const lesson = await prisma.lesson.create({
      data: {
        classId,
        date: new Date(date),
        startTime,
        endTime,
        topic,
        note,
        status: "scheduled",
      },
    });

    return NextResponse.json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    console.error("创建排课错误:", error);
    return NextResponse.json({ error: "创建排课失败" }, { status: 500 });
  }
}

/**
 * 更新排课
 * PUT /api/principal/schedule
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
    const { id, date, startTime, endTime, topic, note, status } = body;

    // 验证课程归属
    const existingLesson = await prisma.lesson.findFirst({
      where: { id },
      include: { class: true },
    });

    if (!existingLesson || existingLesson.class.merchantId !== merchantId) {
      return NextResponse.json({ error: "排课记录不存在" }, { status: 404 });
    }

    // 更新排课
    const updateData: Record<string, unknown> = {};
    if (date) updateData.date = new Date(date);
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (topic !== undefined) updateData.topic = topic;
    if (note !== undefined) updateData.note = note;
    if (status) updateData.status = status;

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedLesson,
    });
  } catch (error) {
    console.error("更新排课错误:", error);
    return NextResponse.json({ error: "更新排课失败" }, { status: 500 });
  }
}

/**
 * 删除排课
 * DELETE /api/principal/schedule
 */
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少排课ID" }, { status: 400 });
    }

    // 验证排课归属
    const lesson = await prisma.lesson.findFirst({
      where: { id },
      include: { class: true },
    });

    if (!lesson || lesson.class.merchantId !== merchantId) {
      return NextResponse.json({ error: "排课记录不存在" }, { status: 404 });
    }

    await prisma.lesson.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "排课已删除",
    });
  } catch (error) {
    console.error("删除排课错误:", error);
    return NextResponse.json({ error: "删除排课失败" }, { status: 500 });
  }
}
