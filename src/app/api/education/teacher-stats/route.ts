import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 计算课时时长（小时）
function calculateHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return Math.max(0, (endMinutes - startMinutes) / 60);
}

// 获取教师课消统计
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const teacherId = searchParams.get("teacherId");

    // 获取所有课程（包含教师信息）
    const lessons = await prisma.lesson.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        class: {
          merchantId: decoded.merchantId,
          ...(teacherId ? { teacherId } : {}),
        },
      },
      include: {
        class: {
          include: {
            teacher: true,
          },
        },
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });

    // 按教师分组统计
    const teacherStatsMap = new Map<string, {
      teacherId: string;
      teacherName: string;
      lessons: Set<string>;
      classes: Set<string>;
      totalHours: number;
      expectedStudents: number;
      actualStudents: number;
      deductedStudents: number;
      deductedHours: number;
    }>();

    for (const lesson of lessons) {
      const lessonTeacherId = lesson.class.teacherId;
      if (!lessonTeacherId) continue;

      const teacherName = lesson.class.teacher?.name || "未指定";
      const hours = calculateHours(lesson.startTime, lesson.endTime);
      
      if (!teacherStatsMap.has(lessonTeacherId)) {
        teacherStatsMap.set(lessonTeacherId, {
          teacherId: lessonTeacherId,
          teacherName,
          lessons: new Set(),
          classes: new Set(),
          totalHours: 0,
          expectedStudents: 0,
          actualStudents: 0,
          deductedStudents: 0,
          deductedHours: 0,
        });
      }

      const stats = teacherStatsMap.get(lessonTeacherId)!;
      stats.lessons.add(lesson.id);
      stats.classes.add(lesson.classId);
      stats.totalHours += hours;

      // 统计学员
      const presentCount = lesson.attendances.filter(a => 
        a.status === "present" || a.status === "late"
      ).length;
      const deductedCount = lesson.attendances.filter(a => a.status === "present").length;
      
      stats.expectedStudents += lesson.attendances.length;
      stats.actualStudents += presentCount;
      stats.deductedStudents += deductedCount;
      stats.deductedHours += deductedCount * hours;
    }

    // 获取每个教师的班级详情
    const teacherStats = Array.from(teacherStatsMap.values()).map(stat => ({
      ...stat,
      lessonCount: stat.lessons.size,
      classCount: stat.classes.size,
    }));

    // 按消耗课时排序
    teacherStats.sort((a, b) => b.deductedHours - a.deductedHours);

    // 汇总数据
    const summary = {
      totalTeachers: teacherStats.length,
      totalLessons: lessons.length,
      totalHours: teacherStats.reduce((sum, t) => sum + t.totalHours, 0),
      totalExpected: teacherStats.reduce((sum, t) => sum + t.expectedStudents, 0),
      totalActual: teacherStats.reduce((sum, t) => sum + t.actualStudents, 0),
      totalDeducted: teacherStats.reduce((sum, t) => sum + t.deductedHours, 0),
    };

    return NextResponse.json({ 
      success: true, 
      teacherStats,
      summary,
    });
  } catch (error) {
    console.error("获取教师课消统计错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
