import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取财务趋势
 * GET /api/principal/finance/trend
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
    const campusFilter = campusId ? { campusId } : {};

    // 最近6个月趋势
    const now = new Date();
    const incomeTrend = [];
    const expenseTrend = [];
    const profitTrend = [];

    for (let i = 5; i >= 0; i--) {
      const monthBegins = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnds = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // 收入
      const recharges = await prisma.recharge.findMany({
        where: {
          student: { merchantId, ...campusFilter },
          createdAt: { gte: monthBegins, lte: monthEnds },
          status: "paid",
        },
        select: { amount: true },
      });
      const income = recharges.reduce((sum, r) => sum + (r.amount || 0), 0);

      // 支出（简化：基于课消）
      const attendances = await prisma.attendance.findMany({
        where: {
          student: { merchantId, ...campusFilter },
          status: "present",
          lesson: { date: { gte: monthBegins, lte: monthEnds } },
        },
      });
      const expense = attendances.length * 100; // 假设每节课100元课酬

      incomeTrend.push({ month: `${monthBegins.getMonth() + 1}月`, value: income });
      expenseTrend.push({ month: `${monthBegins.getMonth() + 1}月`, value: expense });
      profitTrend.push({ month: `${monthBegins.getMonth() + 1}月`, value: income - expense });
    }

    return NextResponse.json({
      success: true,
      data: {
        income: incomeTrend,
        expense: expenseTrend,
        profit: profitTrend,
      },
    });
  } catch (error) {
    console.error("获取财务趋势错误:", error);
    return NextResponse.json({ error: "获取财务趋势失败" }, { status: 500 });
  }
}
