import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取老师Dashboard数据
 * GET /api/teacher/dashboard
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

    if (!payload || payload.role !== "teacher") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const teacherId = payload.teacherId;

    // 获取老师关联的班级ID（直接查询Class表）
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId },
      select: { id: true },
    });
    
    const classIds = teacherClasses.map((c) => c.id);

    // 获取老师信息
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "老师不存在" }, { status: 404 });
    }

    // 计算本周起止时间
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // 今日日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 获取今日课程
    const todayLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        date: today,
        status: { not: "cancelled" },
      },
      include: {
        class: {
          include: {
            courseTemplate: true,
          },
        },
        attendances: {
          include: {
            student: true,
          },
        },
        feedbacks: true,
      },
      orderBy: { startTime: "asc" },
    });

    // 2. 本周统计数据
    const weekLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: { not: "cancelled" },
      },
      include: {
        attendances: true,
        feedbacks: true,
      },
    });

    // 授课节数
    const lessonCount = weekLessons.length;

    // 学员人数（去重）
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId: { in: classIds },
        status: "active",
      },
      select: { studentId: true },
    });
    const studentCount = new Set(enrollments.map((e) => e.studentId)).size;

    // 课消数量（本周已完成的课程中已签到的学生数 × 课时）
    // 先获取本周课程ID
    const weekLessonIds = weekLessons.map((l) => l.id);
    const weekDeductions = await prisma.deduction.findMany({
      where: {
        lessonId: { in: weekLessonIds },
        type: "lesson",
      },
    });
    const consumedHours = weekDeductions.reduce((sum, d) => sum + d.hours, 0);

    // 3. 待办事项
    // 未点名的课程
    const unattendedLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        status: "completed",
        attendances: {
          some: {
            status: "pending",
          },
        },
      },
      include: {
        class: true,
      },
      take: 5,
      orderBy: { date: "desc" },
    });

    // 未点评的课程（已完成但没有点评的课程）
    const uncommentedLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        status: "completed",
        feedbacks: {
          none: {},
        },
      },
      include: {
        class: true,
        attendances: {
          where: { status: "present" },
          include: { student: true },
        },
      },
      take: 5,
      orderBy: { date: "desc" },
    });

    // 4. 最近课堂点评
    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        teacherId,
      },
      include: {
        student: true,
        lesson: {
          include: { class: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 5. 本周每日授课统计
    const dailyStats = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLessons = await prisma.lesson.count({
        where: {
          classId: { in: classIds },
          date: dayStart,
          status: { not: "cancelled" },
        },
      });

      const dayFeedbacks = await prisma.feedback.count({
        where: {
          teacherId,
          lesson: {
            date: dayStart,
          },
        },
      });

      dailyStats.push({
        day: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
        lessons: dayLessons,
        feedbacks: dayFeedbacks,
      });
    }

    // 构建响应
    const response = {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        avatar: teacher.avatar,
        phone: teacher.phone,
      },
      todaySchedule: {
        total: todayLessons.length,
        completed: todayLessons.filter((l) => l.status === "completed").length,
        lessons: todayLessons.map((l) => ({
          id: l.id,
          className: l.class.name,
          courseName: l.class.courseTemplate?.name,
          startTime: l.startTime,
          endTime: l.endTime,
          topic: l.topic,
          status: l.status,
          studentCount: l.attendances.length,
          attendedCount: l.attendances.filter((a) => a.status === "present").length,
          feedbackCount: l.feedbacks.length,
        })),
      },
      weekStats: {
        lessonCount,
        studentCount,
        consumedHours,
      },
      todos: {
        unattended: {
          count: unattendedLessons.length,
          items: unattendedLessons.map((l) => ({
            id: l.id,
            className: l.class.name,
            date: l.date.toISOString().split("T")[0],
            startTime: l.startTime,
          })),
        },
        uncommented: {
          count: uncommentedLessons.length,
          items: uncommentedLessons.map((l) => ({
            id: l.id,
            className: l.class.name,
            date: l.date.toISOString().split("T")[0],
            startTime: l.startTime,
            studentCount: l.attendances.length,
          })),
        },
      },
      recentFeedbacks: recentFeedbacks.map((f) => ({
        id: f.id,
        studentName: f.student.name,
        studentAvatar: f.student.avatar,
        className: f.lesson.class.name,
        date: f.lesson.date.toISOString().split("T")[0],
        content: f.content.substring(0, 50) + (f.content.length > 50 ? "..." : ""),
        liked: f.liked,
        createdAt: f.createdAt.toISOString(),
      })),
      dailyStats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取老师Dashboard数据错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
