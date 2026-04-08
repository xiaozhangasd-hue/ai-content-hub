import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取奖励发放记录
 * 使用 Recharge 模型模拟奖励记录
 * GET /api/principal/referral/rewards
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status") || undefined;

    // 获取来源为转介绍的客户
    const whereClause: Record<string, unknown> = {
      merchantId,
      source: "referral",
      ...(status === "pending" ? { status: "signed" } : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    const rewards = customers.map((c) => ({
      id: c.id,
      amount: 100, // 固定奖励金额
      status: c.status === "signed" ? "paid" : "pending",
      description: "转介绍奖励",
      customer: {
        id: c.id,
        name: c.name,
        phone: c.phone,
      },
      createdAt: c.createdAt,
      paidAt: c.status === "signed" ? c.updatedAt : null,
    }));

    // 统计汇总
    const signedCount = customers.filter((c) => c.status === "signed").length;
    const totalRewards = customers.length * 100;

    return NextResponse.json({
      success: true,
      data: rewards,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalAmount: totalRewards,
        totalCount: customers.length,
        pendingCount: customers.filter((c) => c.status !== "signed").length,
      },
    });
  } catch (error) {
    console.error("获取奖励发放记录错误:", error);
    return NextResponse.json({ error: "获取奖励发放记录失败" }, { status: 500 });
  }
}

/**
 * 发放奖励
 * POST /api/principal/referral/rewards
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { customerId, amount, description } = body;

    // 验证客户归属
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, merchantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // 更新客户状态为已签约
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: "signed" },
    });

    return NextResponse.json({
      success: true,
      message: "奖励已发放",
    });
  } catch (error) {
    console.error("发放奖励错误:", error);
    return NextResponse.json({ error: "发放奖励失败" }, { status: 500 });
  }
}

/**
 * 标记奖励已发放
 * PUT /api/principal/referral/rewards
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

    const merchantId = payload.merchantId;
    const body = await request.json();
    const { rewardIds } = body;

    if (!rewardIds || !Array.isArray(rewardIds) || rewardIds.length === 0) {
      return NextResponse.json({ error: "请选择要标记的奖励" }, { status: 400 });
    }

    // 更新客户状态
    await prisma.customer.updateMany({
      where: {
        id: { in: rewardIds },
        merchantId,
      },
      data: { status: "signed" },
    });

    return NextResponse.json({
      success: true,
      message: `已标记 ${rewardIds.length} 条奖励为已发放`,
    });
  } catch (error) {
    console.error("标记奖励错误:", error);
    return NextResponse.json({ error: "标记奖励失败" }, { status: 500 });
  }
}
