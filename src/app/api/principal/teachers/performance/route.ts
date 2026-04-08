import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取教师绩效列表
 * GET /api/principal/teachers/performance
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
    const search = searchParams.get("search") || "";
    const period = searchParams.get("period") || "month";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 计算时间范围
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // 获取教师列表
    const whereClause: Record<string, unknown> = {
      merchantId,
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.teacher.count({ where: whereClause }),
    ]);

    // 获取每个教师的绩效数据
    const teacherPerformance = await Promise.all(
      teachers.map(async (teacher) => {
        // 获取课程记录 - 使用 Lesson 模型
        const lessons = await prisma.lesson.findMany({
          where: {
            class: { teacherId: teacher.id },
            date: { gte: startDate },
          },
        });

        const totalCourses = lessons.length;
        const totalHours = lessons.reduce((sum, l) => {
          const startParts = (l.startTime || "09:00").split(":").map(Number);
          const endParts = (l.endTime || "10:00").split(":").map(Number);
          const duration = (endParts[0] * 60 + endParts[1] - startParts[0] * 60 - startParts[1]) / 60;
          return sum + duration;
        }, 0);

        // 获取学生评价 - 使用 Feedback 模型
        const feedbacks = await prisma.feedback.findMany({
          where: {
            teacherId: teacher.id,
            createdAt: { gte: startDate },
          },
        });

        const avgRating = feedbacks.length > 0
          ? feedbacks.reduce((sum, f) => {
              const ratings = f.ratings ? JSON.parse(f.ratings) as Record<string, number> : {};
              const values = Object.values(ratings);
              const avg = values.length > 0
                ? values.reduce((s, r) => s + r, 0) / values.length
                : 5;
              return sum + avg;
            }, 0) / feedbacks.length
          : 0;

        return {
          id: teacher.id,
          name: teacher.name,
          phone: teacher.phone || "",
          avatar: teacher.avatar,
          totalCourses,
          totalHours: Math.round(totalHours * 10) / 10,
          totalSalary: totalHours * 100, // 假设每小时100元
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: feedbacks.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: teacherPerformance,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取教师绩效错误:", error);
    return NextResponse.json({ error: "获取教师绩效失败" }, { status: 500 });
  }
}
