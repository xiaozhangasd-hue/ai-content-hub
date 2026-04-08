import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 课消统计
 * GET /api/principal/consumption/stats
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
    const campusId = searchParams.get("campusId");

    // 构建日期范围
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const queryStartDate = startDate ? new Date(startDate) : firstDayOfMonth;
    const queryEndDate = endDate ? new Date(endDate) : lastDayOfMonth;

    // 查询消课记录
    const whereClause: Record<string, unknown> = {
      enrollment: {
        student: {
          merchantId,
          ...(campusId && campusId !== "all" ? { campusId } : {}),
        },
      },
      createdAt: {
        gte: queryStartDate,
        lte: queryEndDate,
      },
    };

    const deductions = await prisma.deduction.findMany({
      where: whereClause,
      include: {
        enrollment: {
          include: {
            student: true,
            class: true,
          },
        },
      },
    });

    // 统计总课消
    const totalHours = deductions.reduce((sum, d) => sum + d.hours, 0);

    // 按班级统计
    const byClass: Record<string, { name: string; hours: number; count: number }> = {};
    deductions.forEach(d => {
      const classId = d.enrollment.classId;
      const className = d.enrollment.class?.name || "未分配";
      if (!byClass[classId]) {
        byClass[classId] = { name: className, hours: 0, count: 0 };
      }
      byClass[classId].hours += d.hours;
      byClass[classId].count += 1;
    });

    // 按日期统计（最近30天）
    const dailyStats: Record<string, { date: string; hours: number; count: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyStats[dateStr] = { date: dateStr, hours: 0, count: 0 };
    }

    deductions.forEach(d => {
      const dateStr = d.createdAt.toISOString().split("T")[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].hours += d.hours;
        dailyStats[dateStr].count += 1;
      }
    });

    // 按月统计（最近12个月）
    const monthlyStats: Record<string, { month: string; hours: number; count: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyStats[monthStr] = { month: monthStr, hours: 0, count: 0 };
    }

    deductions.forEach(d => {
      const date = d.createdAt;
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyStats[monthStr]) {
        monthlyStats[monthStr].hours += d.hours;
        monthlyStats[monthStr].count += 1;
      }
    });

    // 获取充值统计
    const recharges = await prisma.recharge.findMany({
      where: {
        student: { merchantId },
        createdAt: {
          gte: queryStartDate,
          lte: queryEndDate,
        },
      },
    });

    const totalRechargeHours = recharges.reduce((sum, r) => sum + r.hours, 0);
    const totalRechargeAmount = recharges.reduce((sum, r) => sum + (r.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDeductions: deductions.length,
          totalHours: Math.round(totalHours * 100) / 100,
          totalRechargeHours: Math.round(totalRechargeHours * 100) / 100,
          totalRechargeAmount,
          avgHoursPerDeduction: deductions.length > 0 
            ? Math.round((totalHours / deductions.length) * 100) / 100 
            : 0,
        },
        byClass: Object.values(byClass).sort((a, b) => b.hours - a.hours),
        daily: Object.values(dailyStats),
        monthly: Object.values(monthlyStats),
      },
    });
  } catch (error) {
    console.error("获取课消统计错误:", error);
    return NextResponse.json({ error: "获取课消统计失败" }, { status: 500 });
  }
}
