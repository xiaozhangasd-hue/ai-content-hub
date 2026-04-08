import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取统计数据
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
    const teacherId = payload.teacherId;

    // 获取老师的班级
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, merchantId },
      select: { id: true, name: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overview: {
            totalStudents: 0,
            totalClasses: 0,
            totalAttendance: 0,
            attendanceRate: 0,
            averagePerformance: 0,
          },
          trends: { students: [], attendance: [] },
          distribution: { subjects: [], attendance: [] },
          students: [],
        },
      });
    }

    // 获取学员总数
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: { in: classIds }, status: "active" },
      select: { studentId: true },
    });
    const uniqueStudentIds = [...new Set(enrollments.map((e) => e.studentId))];

    // 本周出勤统计
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekLessons = await prisma.lesson.findMany({
      where: {
        classId: { in: classIds },
        date: { gte: weekStart },
      },
      select: { id: true },
    });
    const weekLessonIds = weekLessons.map((l) => l.id);

    const weekAttendances = await prisma.attendance.findMany({
      where: { lessonId: { in: weekLessonIds } },
    });

    const weekPresent = weekAttendances.filter((a) => a.status === "present").length;
    const weekTotal = weekAttendances.length;

    // 出勤率趋势（按周）
    const attendanceTrend = [];
    for (let i = 3; i >= 0; i--) {
      const weekBegins = new Date();
      weekBegins.setDate(weekBegins.getDate() - weekBegins.getDay() - i * 7);
      weekBegins.setHours(0, 0, 0, 0);
      const weekEnds = new Date(weekBegins);
      weekEnds.setDate(weekEnds.getDate() + 6);

      const lessons = await prisma.lesson.findMany({
        where: {
          classId: { in: classIds },
          date: { gte: weekBegins, lte: weekEnds },
        },
        select: { id: true },
      });
      const lessonIds = lessons.map((l) => l.id);

      const att = await prisma.attendance.findMany({
        where: { lessonId: { in: lessonIds } },
      });

      const present = att.filter((a) => a.status === "present").length;
      const total = att.length;

      attendanceTrend.push({
        week: `第${4 - i}周`,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        total,
      });
    }

    // 考勤状态分布
    const allAttendances = await prisma.attendance.findMany({
      where: {
        lesson: { classId: { in: classIds } },
      },
    });

    const presentCount = allAttendances.filter((a) => a.status === "present").length;
    const absentCount = allAttendances.filter((a) => a.status === "absent").length;
    const leaveCount = allAttendances.filter((a) => a.status === "leave").length;

    // 学员分析列表
    const students = await prisma.student.findMany({
      where: {
        enrollments: {
          some: { classId: { in: classIds }, status: "active" },
        },
      },
      include: {
        enrollments: { where: { status: "active" } },
      },
      take: 50,
    });

    const studentAnalysis = await Promise.all(
      students.map(async (student) => {
        const att = await prisma.attendance.findMany({
          where: { studentId: student.id },
        });

        const present = att.filter((a) => a.status === "present").length;
        const total = att.length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          remainingHours: student.enrollments.reduce((sum, e) => sum + e.remainingHours, 0),
          attendanceRate: rate,
          averageRating: 4,
          lastAttendance: att.length > 0 ? att[att.length - 1].createdAt : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents: uniqueStudentIds.length,
          totalClasses: classIds.length,
          totalAttendance: weekTotal,
          attendanceRate: weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0,
          averagePerformance: 4,
        },
        trends: {
          students: [],
          attendance: attendanceTrend,
        },
        distribution: {
          subjects: [{ name: "全部", value: uniqueStudentIds.length }],
          attendance: [
            { name: "出勤", value: presentCount },
            { name: "缺勤", value: absentCount },
            { name: "请假", value: leaveCount },
          ],
        },
        students: studentAnalysis,
      },
    });
  } catch (error) {
    console.error("获取统计数据错误:", error);
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
