import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取转化漏斗
 * GET /api/principal/leads/funnel
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

    // 获取各阶段数量
    const newCount = await prisma.customer.count({
      where: { merchantId, status: "new" },
    });
    const contactedCount = await prisma.customer.count({
      where: { merchantId, status: "contacted" },
    });
    const invitedCount = await prisma.customer.count({
      where: { merchantId, status: "invited" },
    });
    const trialCount = await prisma.customer.count({
      where: { merchantId, status: "trial" },
    });
    const signedCount = await prisma.customer.count({
      where: { merchantId, status: "signed" },
    });
    const lostCount = await prisma.customer.count({
      where: { merchantId, status: "lost" },
    });

    const funnel = [
      { name: "新线索", value: newCount },
      { name: "已联系", value: contactedCount },
      { name: "已邀约", value: invitedCount },
      { name: "已试听", value: trialCount },
      { name: "已报名", value: signedCount },
    ];

    // 计算转化率
    const rates: { name: string; rate: number }[] = [];
    for (let i = 1; i < funnel.length; i++) {
      const rate = funnel[i - 1].value > 0
        ? Math.round((funnel[i].value / funnel[i - 1].value) * 100)
        : 0;
      rates.push({
        name: `${funnel[i - 1].name}→${funnel[i].name}`,
        rate,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        rates,
        lost: lostCount,
        overall: {
          total: funnel.reduce((sum, f) => sum + f.value, 0),
          converted: signedCount,
          conversionRate: funnel[0].value > 0
            ? Math.round((signedCount / funnel[0].value) * 100)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error("获取转化漏斗错误:", error);
    return NextResponse.json({ error: "获取转化漏斗失败" }, { status: 500 });
  }
}
