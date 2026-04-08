import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取财务概览
 * GET /api/principal/finance/overview
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
    const campusId = searchParams.get("campusId") || undefined;

    // 本月时间范围
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const campusFilter = campusId ? { campusId } : {};

    // 本月收入
    const rechargesThisMonth = await prisma.recharge.findMany({
      where: {
        student: { merchantId, ...campusFilter },
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "paid",
      },
      select: { amount: true },
    });

    const incomeThisMonth = rechargesThisMonth.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    // 上月收入
    const rechargesLastMonth = await prisma.recharge.findMany({
      where: {
        student: { merchantId, ...campusFilter },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        status: "paid",
      },
      select: { amount: true },
    });

    const incomeLastMonth = rechargesLastMonth.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    // 支出（简化计算，基于课时消耗）
    const attendancesThisMonth = await prisma.attendance.findMany({
      where: {
        student: { merchantId, ...campusFilter },
        status: "present",
        lesson: { date: { gte: monthStart, lte: monthEnd } },
      },
    });

    // 假设每节课老师课酬100元
    const expenseThisMonth = attendancesThisMonth.length * 100;
    const expenseLastMonth = 0; // 简化处理

    const profitThisMonth = incomeThisMonth - expenseThisMonth;
    const profitLastMonth = incomeLastMonth - expenseLastMonth;

    // 计算增长率
    const incomeGrowth = incomeLastMonth > 0
      ? Math.round(((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100)
      : 0;
    const expenseGrowth = expenseLastMonth > 0
      ? Math.round(((expenseThisMonth - expenseLastMonth) / expenseLastMonth) * 100)
      : 0;
    const profitGrowth = profitLastMonth > 0
      ? Math.round(((profitThisMonth - profitLastMonth) / profitLastMonth) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        income: incomeThisMonth,
        expense: expenseThisMonth,
        profit: profitThisMonth,
        lastMonth: {
          income: incomeLastMonth,
          expense: expenseLastMonth,
          profit: profitLastMonth,
        },
        growth: {
          income: incomeGrowth,
          expense: expenseGrowth,
          profit: profitGrowth,
        },
      },
    });
  } catch (error) {
    console.error("获取财务概览错误:", error);
    return NextResponse.json({ error: "获取财务概览失败" }, { status: 500 });
  }
}
