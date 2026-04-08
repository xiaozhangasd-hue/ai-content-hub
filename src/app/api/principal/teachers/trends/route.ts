import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取教师绩效趋势分析
 * GET /api/principal/teachers/trends
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
    const teacherId = searchParams.get("teacherId") || undefined;
    const period = searchParams.get("period") || "month";

    // 计算时间范围和数据点数量
    const now = new Date();
    let dataPoints = 7;
    let dateFormat = "day";
    let startDate = new Date();

    switch (period) {
      case "week":
        dataPoints = 7;
        startDate.setDate(now.getDate() - 6);
        break;
      case "month":
        dataPoints = 4;
        startDate.setDate(now.getDate() - 28);
        break;
      case "quarter":
        dataPoints = 3;
        startDate.setMonth(now.getMonth() - 3);
        dateFormat = "month";
        break;
    }

    // 获取教师列表
    const teachers = await prisma.teacher.findMany({
      where: {
        merchantId,
        ...(teacherId ? { id: teacherId } : {}),
      },
      select: { id: true, name: true },
    });

    // 构建趋势数据
    const trends = [];
    for (let i = 0; i < dataPoints; i++) {
      const dateStart = new Date(startDate);
      const dateEnd = new Date(startDate);

      switch (period) {
        case "week":
          dateStart.setDate(startDate.getDate() + i);
          dateEnd.setDate(startDate.getDate() + i + 1);
          break;
        case "month":
          dateStart.setDate(startDate.getDate() + i * 7);
          dateEnd.setDate(startDate.getDate() + (i + 1) * 7);
          break;
        case "quarter":
          dateStart.setMonth(startDate.getMonth() + i);
          dateStart.setDate(1);
          dateEnd.setMonth(startDate.getMonth() + i + 1);
          dateEnd.setDate(1);
          break;
      }

      // 获取该时段的课程
      const lessons = await prisma.lesson.findMany({
        where: {
          class: {
            teacherId: teacherId ? teacherId : { in: teachers.map((t) => t.id) },
          },
          date: { gte: dateStart, lt: dateEnd },
        },
      });

      const totalCourses = lessons.length;
      const totalHours = lessons.reduce((sum, l) => {
        const startParts = (l.startTime || "09:00").split(":").map(Number);
        const endParts = (l.endTime || "10:00").split(":").map(Number);
        const duration = (endParts[0] * 60 + endParts[1] - startParts[0] * 60 - startParts[1]) / 60;
        return sum + duration;
      }, 0);
      const totalSalary = totalHours * 100;

      let label = "";
      if (dateFormat === "day") {
        label = dateStart.toISOString().split("T")[0];
      } else {
        label = `${dateStart.getMonth() + 1}月`;
      }

      trends.push({
        label,
        totalCourses,
        totalHours: Math.round(totalHours * 10) / 10,
        totalSalary: Math.round(totalSalary),
      });
    }

    // 整体统计
    const allLessons = await prisma.lesson.findMany({
      where: {
        class: {
          teacherId: teacherId ? teacherId : { in: teachers.map((t) => t.id) },
        },
        date: { gte: startDate },
      },
    });

    const totalHours = allLessons.reduce((sum, l) => {
      const startParts = (l.startTime || "09:00").split(":").map(Number);
      const endParts = (l.endTime || "10:00").split(":").map(Number);
      const duration = (endParts[0] * 60 + endParts[1] - startParts[0] * 60 - startParts[1]) / 60;
      return sum + duration;
    }, 0);

    const overallStats = {
      totalCourses: allLessons.length,
      totalHours: Math.round(totalHours * 10) / 10,
      totalSalary: Math.round(totalHours * 100),
      avgCoursesPerDay: Math.round(allLessons.length / dataPoints * 10) / 10,
      avgHoursPerDay: Math.round(totalHours / dataPoints * 10) / 10,
    };

    return NextResponse.json({
      success: true,
      data: {
        trends,
        overallStats,
        teachers: teachers.map((t) => ({ id: t.id, name: t.name })),
        period,
      },
    });
  } catch (error) {
    console.error("获取教师趋势分析错误:", error);
    return NextResponse.json({ error: "获取趋势分析失败" }, { status: 500 });
  }
}
