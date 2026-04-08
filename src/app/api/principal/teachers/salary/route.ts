import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取课酬管理
 * GET /api/principal/teachers/salary
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
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const status = searchParams.get("status") || undefined;

    // 计算月份范围
    const startDate = new Date(`${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // 获取课程记录 - 使用 Lesson 模型
    const lessons = await prisma.lesson.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        ...(teacherId ? { class: { teacherId } } : {}),
      },
      include: {
        class: {
          include: {
            teacher: true,
            courseTemplate: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // 转换为课酬记录
    const salaryRecords = lessons.map((lesson) => {
      const startParts = (lesson.startTime || "09:00").split(":").map(Number);
      const endParts = (lesson.endTime || "10:00").split(":").map(Number);
      const duration = (endParts[0] * 60 + endParts[1] - startParts[0] * 60 - startParts[1]) / 60;
      const salary = duration * 100; // 假设每小时100元

      return {
        id: lesson.id,
        teacher: lesson.class.teacher ? {
          id: lesson.class.teacher.id,
          name: lesson.class.teacher.name,
          phone: lesson.class.teacher.phone || "",
        } : { id: "", name: "未分配", phone: "" },
        course: lesson.class.courseTemplate ? {
          id: lesson.class.courseTemplate.id,
          name: lesson.class.courseTemplate.name,
        } : { id: lesson.class.id, name: lesson.class.name },
        date: lesson.date,
        duration: Math.round(duration * 10) / 10,
        salary: Math.round(salary),
        status: lesson.status === "completed" ? "paid" : "pending",
      };
    });

    // 按教师汇总
    const teacherSummary = new Map<string, {
      teacher: { id: string; name: string };
      totalCourses: number;
      totalSalary: number;
      paidSalary: number;
      unpaidSalary: number;
    }>();

    for (const record of salaryRecords) {
      const tid = record.teacher.id;
      if (!tid) continue;
      
      if (!teacherSummary.has(tid)) {
        teacherSummary.set(tid, {
          teacher: record.teacher,
          totalCourses: 0,
          totalSalary: 0,
          paidSalary: 0,
          unpaidSalary: 0,
        });
      }
      const summary = teacherSummary.get(tid)!;
      summary.totalCourses++;
      summary.totalSalary += record.salary;
      if (record.status === "paid") {
        summary.paidSalary += record.salary;
      } else {
        summary.unpaidSalary += record.salary;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        records: salaryRecords,
        summary: Array.from(teacherSummary.values()),
        month,
      },
    });
  } catch (error) {
    console.error("获取课酬管理错误:", error);
    return NextResponse.json({ error: "获取课酬管理失败" }, { status: 500 });
  }
}

/**
 * 更新课酬状态（标记已支付）
 * PUT /api/principal/teachers/salary
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

    const body = await request.json();
    const { recordIds } = body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: "请选择要标记的记录" }, { status: 400 });
    }

    // 更新课程状态为已完成
    await prisma.lesson.updateMany({
      where: { id: { in: recordIds } },
      data: { status: "completed" },
    });

    return NextResponse.json({
      success: true,
      message: `已标记 ${recordIds.length} 条记录为已支付`,
    });
  } catch (error) {
    console.error("更新薪酬状态错误:", error);
    return NextResponse.json({ error: "更新薪酬状态失败" }, { status: 500 });
  }
}
