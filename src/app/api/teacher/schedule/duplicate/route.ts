import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 复制课表到下一周
 * POST /api/teacher/schedule/duplicate
 * 
 * 请求体：
 * - sourceStartDate: 源周开始日期
 * - targetStartDate: 目标周开始日期
 * - classIds: 班级ID数组（可选，不传则复制所有班级）
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

    const body = await request.json();
    const { sourceStartDate, targetStartDate, classIds } = body;

    if (!sourceStartDate || !targetStartDate) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const sourceStart = new Date(sourceStartDate);
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceEnd.getDate() + 7);

    const targetStart = new Date(targetStartDate);
    const targetEnd = new Date(targetStart);
    targetEnd.setDate(targetEnd.getDate() + 7);

    // 获取源周课程
    const where: Record<string, unknown> = {
      class: { merchantId, teacherId },
      date: { gte: sourceStart, lt: sourceEnd },
    };

    if (classIds && classIds.length > 0) {
      where.classId = { in: classIds };
    }

    const sourceLessons = await prisma.lesson.findMany({
      where,
      include: {
        attendances: { select: { enrollmentId: true, studentId: true } },
      },
    });

    // 计算日期偏移
    const dayOffset = Math.floor(
      (targetStart.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // 复制课程
    let copiedCount = 0;
    const errors: string[] = [];

    for (const lesson of sourceLessons) {
      try {
        const newDate = new Date(lesson.date);
        newDate.setDate(newDate.getDate() + dayOffset);

        // 检查目标日期是否已有课程
        const existing = await prisma.lesson.findFirst({
          where: {
            classId: lesson.classId,
            date: newDate,
            startTime: lesson.startTime,
          },
        });

        if (existing) {
          continue; // 跳过已存在的课程
        }

        // 创建新课程
        const newLesson = await prisma.lesson.create({
          data: {
            classId: lesson.classId,
            date: newDate,
            startTime: lesson.startTime,
            endTime: lesson.endTime,
            topic: lesson.topic,
            classroom: lesson.classroom,
            status: "scheduled",
          },
        });

        // 复制考勤记录
        if (lesson.attendances.length > 0) {
          await prisma.attendance.createMany({
            data: lesson.attendances.map((a) => ({
              lessonId: newLesson.id,
              enrollmentId: a.enrollmentId,
              studentId: a.studentId,
              status: "pending",
            })),
          });
        }

        copiedCount++;
      } catch (error) {
        errors.push(`复制课程 ${lesson.id} 失败`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        copiedCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("复制课表错误:", error);
    return NextResponse.json(
      { error: "复制课表失败" },
      { status: 500 }
    );
  }
}
