import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取业绩数据
 * GET /api/principal/performance
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

    // 上月时间范围
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 上周时间范围
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // 构建校区筛选
    const campusFilter = campusId ? { campusId } : {};

    // 1. 总学员数
    const totalStudents = await prisma.student.count({
      where: { merchantId, ...campusFilter },
    });

    // 2. 本月新增学员
    const newStudentsThisMonth = await prisma.student.count({
      where: {
        merchantId,
        ...campusFilter,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const newStudentsLastMonth = await prisma.student.count({
      where: {
        merchantId,
        ...campusFilter,
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    // 3. 本月业绩（充值金额）
    const rechargesThisMonth = await prisma.recharge.findMany({
      where: {
        student: { merchantId, ...campusFilter },
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "paid",
      },
      select: { amount: true },
    });

    const revenueThisMonth = rechargesThisMonth.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    const rechargesLastMonth = await prisma.recharge.findMany({
      where: {
        student: { merchantId, ...campusFilter },
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        status: "paid",
      },
      select: { amount: true },
    });

    const revenueLastMonth = rechargesLastMonth.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    // 4. 转化率（试听→报名）
    // 试听学员数
    const trialStudents = await prisma.customer.count({
      where: {
        merchantId,
        ...campusFilter,
        status: "trial",
      },
    });

    // 已报名学员数
    const signedStudents = await prisma.customer.count({
      where: {
        merchantId,
        ...campusFilter,
        status: "signed",
      },
    });

    const conversionRate =
      trialStudents + signedStudents > 0
        ? Math.round((signedStudents / (trialStudents + signedStudents)) * 100)
        : 0;

    // 5. 续费率
    const renewalsThisMonth = await prisma.recharge.count({
      where: {
        student: { merchantId, ...campusFilter },
        createdAt: { gte: monthStart, lte: monthEnd },
        status: "paid",
      },
    });

    const activeStudents = await prisma.enrollment.count({
      where: {
        student: { merchantId, ...campusFilter },
        status: "active",
      },
    });

    const renewalRate = activeStudents > 0 ? Math.round((renewalsThisMonth / activeStudents) * 100) : 0;

    // 6. 业绩趋势（最近6个月）
    const revenueTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthBegins = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnds = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const recharges = await prisma.recharge.findMany({
        where: {
          student: { merchantId, ...campusFilter },
          createdAt: { gte: monthBegins, lte: monthEnds },
          status: "paid",
        },
        select: { amount: true },
      });

      revenueTrend.push({
        month: `${monthBegins.getMonth() + 1}月`,
        revenue: recharges.reduce((sum, r) => sum + (r.amount || 0), 0),
      });
    }

    // 7. 新增学员趋势
    const studentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthBegins = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnds = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const count = await prisma.student.count({
        where: {
          merchantId,
          ...campusFilter,
          createdAt: { gte: monthBegins, lte: monthEnds },
        },
      });

      studentTrend.push({
        month: `${monthBegins.getMonth() + 1}月`,
        count,
      });
    }

    // 8. 转化漏斗
    const funnelData = [
      { name: "咨询", value: await prisma.customer.count({ where: { merchantId, ...campusFilter, status: "new" } }) },
      { name: "跟进", value: await prisma.customer.count({ where: { merchantId, ...campusFilter, status: "contacted" } }) },
      { name: "试听", value: trialStudents },
      { name: "报名", value: signedStudents },
    ];

    // 9. 校区对比
    const campuses = await prisma.campus.findMany({
      where: { merchantId },
      select: { id: true, name: true },
    });

    const campusComparison = await Promise.all(
      campuses.map(async (campus) => {
        const students = await prisma.student.count({
          where: { campusId: campus.id },
        });
        const recharges = await prisma.recharge.findMany({
          where: {
            student: { campusId: campus.id },
            createdAt: { gte: monthStart, lte: monthEnd },
            status: "paid",
          },
          select: { amount: true },
        });
        return {
          name: campus.name,
          students,
          revenue: recharges.reduce((sum, r) => sum + (r.amount || 0), 0),
        };
      })
    );

    // 计算同比环比
    const studentGrowth = newStudentsLastMonth > 0 
      ? Math.round(((newStudentsThisMonth - newStudentsLastMonth) / newStudentsLastMonth) * 100)
      : 0;
    
    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          newStudents: newStudentsThisMonth,
          revenue: revenueThisMonth,
          conversionRate,
          renewalRate,
        },
        comparison: {
          studentGrowth,
          revenueGrowth,
          lastMonthRevenue: revenueLastMonth,
          lastMonthStudents: newStudentsLastMonth,
        },
        trends: {
          revenue: revenueTrend,
          students: studentTrend,
        },
        funnel: funnelData,
        campusComparison,
      },
    });
  } catch (error) {
    console.error("获取业绩数据错误:", error);
    return NextResponse.json({ error: "获取业绩数据失败" }, { status: 500 });
  }
}
