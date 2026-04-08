import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    const merchantId = decoded.merchantId;

    // 在籍学员数
    const totalStudents = await prisma.student.count({
      where: { merchantId },
    });

    // 教师数量
    const totalTeachers = await prisma.teacher.count({
      where: { merchantId, status: "active" },
    });

    // 班级数量
    const totalClasses = await prisma.class.count({
      where: { merchantId, status: "active" },
    });

    // 今日课程数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayLessons = await prisma.lesson.count({
      where: {
        class: { merchantId },
        date: { gte: today, lt: todayEnd },
      },
    });

    // 待考勤数
    const pendingAttendance = await prisma.attendance.count({
      where: {
        student: { merchantId },
        status: "pending",
        lesson: { date: { lte: new Date() } },
      },
    });

    // 课时不足预警（少于2课时）
    const lowHoursCount = await prisma.enrollment.count({
      where: {
        student: { merchantId },
        status: "active",
        remainingHours: { lt: 2 },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayLessons,
        pendingAttendance,
        lowHoursCount,
      },
    });
  } catch (error) {
    console.error("获取教务统计错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
