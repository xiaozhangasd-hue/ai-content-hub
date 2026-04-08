import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取转介绍统计分析
 * GET /api/principal/referral/stats
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
    const period = searchParams.get("period") || "month";

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

    // 获取转介绍客户
    const referralCustomers = await prisma.customer.findMany({
      where: {
        merchantId,
        source: "referral",
        createdAt: { gte: startDate },
      },
      include: {
        followUps: true,
      },
    });

    // 按推荐人统计（这里简化处理）
    const referrerStats = new Map<string, { referrer: { id: string; name: string }; referralCount: number; rewardAmount: number }>();

    for (const customer of referralCustomers) {
      const referrerId = customer.id;
      if (!referrerStats.has(referrerId)) {
        referrerStats.set(referrerId, {
          referrer: { id: referrerId, name: customer.name },
          referralCount: 0,
          rewardAmount: 0,
        });
      }
      const stat = referrerStats.get(referrerId)!;
      stat.referralCount++;
      if (customer.status === "signed") {
        stat.rewardAmount += 100;
      }
    }

    // 按时间统计
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.customer.count({
        where: {
          merchantId,
          source: "referral",
          createdAt: { gte: date, lt: nextDate },
        },
      });

      dailyStats.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    const totalReferrals = referralCustomers.length;
    const signedCount = referralCustomers.filter((c) => c.status === "signed").length;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalReferrals,
          totalRewards: signedCount * 100,
          pendingRewards: (totalReferrals - signedCount) * 100,
          activeCodes: referralCustomers.filter((c) => c.status !== "lost").length,
          totalCodes: totalReferrals,
        },
        referrerStats: Array.from(referrerStats.values())
          .sort((a, b) => b.referralCount - a.referralCount)
          .slice(0, 10),
        dailyStats,
        recentUsages: referralCustomers.slice(0, 10).map((c) => ({
          id: c.id,
          code: `REF${c.id.substring(0, 6).toUpperCase()}`,
          usedAt: c.createdAt,
          customer: { id: c.id, name: c.name },
        })),
        period,
      },
    });
  } catch (error) {
    console.error("获取转介绍统计错误:", error);
    return NextResponse.json({ error: "获取转介绍统计失败" }, { status: 500 });
  }
}
