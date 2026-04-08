import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取试听转化统计
 * GET /api/principal/trial-classes/stats
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
    const period = searchParams.get("period") || "month"; // week, month, quarter, year

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

    // 获取各阶段数量
    const [invited, trialed, signed, lost] = await Promise.all([
      prisma.customer.count({
        where: {
          merchantId,
          status: "invited",
          updatedAt: { gte: startDate },
        },
      }),
      prisma.customer.count({
        where: {
          merchantId,
          status: "trial",
          updatedAt: { gte: startDate },
        },
      }),
      prisma.customer.count({
        where: {
          merchantId,
          status: "signed",
          updatedAt: { gte: startDate },
        },
      }),
      prisma.customer.count({
        where: {
          merchantId,
          status: "lost",
          updatedAt: { gte: startDate },
        },
      }),
    ]);

    // 计算转化率
    const totalTrials = invited + trialed + signed + lost;
    const trialRate = totalTrials > 0 ? Math.round((trialed / totalTrials) * 100) : 0;
    const signRate = trialed > 0 ? Math.round((signed / trialed) * 100) : 0;

    // 按课程统计
    const courseStats = await prisma.customer.groupBy({
      by: ["intentCourse"],
      where: {
        merchantId,
        status: { in: ["invited", "trial", "signed", "lost"] },
        updatedAt: { gte: startDate },
      },
      _count: true,
    });

    // 按时间统计（最近7天）
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [dayTrials, daySigned] = await Promise.all([
        prisma.customer.count({
          where: {
            merchantId,
            status: { in: ["trial", "signed", "lost"] },
            updatedAt: { gte: date, lt: nextDate },
          },
        }),
        prisma.customer.count({
          where: {
            merchantId,
            status: "signed",
            updatedAt: { gte: date, lt: nextDate },
          },
        }),
      ]);

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        trials: dayTrials,
        signed: daySigned,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          invited,
          trialed,
          signed,
          lost,
          total: totalTrials,
          trialRate,
          signRate,
          overallRate: totalTrials > 0 ? Math.round((signed / totalTrials) * 100) : 0,
        },
        courseStats: courseStats.map((cs) => ({
          course: cs.intentCourse || "未指定",
          count: cs._count,
        })),
        dailyStats,
        period,
      },
    });
  } catch (error) {
    console.error("获取试听统计错误:", error);
    return NextResponse.json({ error: "获取试听统计失败" }, { status: 500 });
  }
}
