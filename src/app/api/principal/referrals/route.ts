import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取转介绍列表
 * GET /api/principal/referrals
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 获取转介绍记录（通过客户来源为转介绍的记录）
    const whereClause: Record<string, unknown> = {
      merchantId,
      source: "referral",
      OR: search
        ? [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        : undefined,
    };

    const [referrals, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    // 获取统计数据
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const totalReferrals = await prisma.customer.count({
      where: { merchantId, source: "referral" },
    });

    const monthReferrals = await prisma.customer.count({
      where: {
        merchantId,
        source: "referral",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    const convertedReferrals = await prisma.customer.count({
      where: { merchantId, source: "referral", status: "signed" },
    });

    return NextResponse.json({
      success: true,
      data: referrals.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        childName: r.childName,
        status: r.status,
        tags: r.tags,
        createdAt: r.createdAt,
      })),
      stats: {
        total: totalReferrals,
        thisMonth: monthReferrals,
        converted: convertedReferrals,
        conversionRate: totalReferrals > 0
          ? Math.round((convertedReferrals / totalReferrals) * 100)
          : 0,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取转介绍列表错误:", error);
    return NextResponse.json({ error: "获取转介绍列表失败" }, { status: 500 });
  }
}

/**
 * 创建转介绍记录
 * POST /api/principal/referrals
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
    const { name, phone, childName, childAge, referrerId, rewardType } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "姓名和手机号不能为空" }, { status: 400 });
    }

    // 创建转介绍客户
    const referral = await prisma.customer.create({
      data: {
        merchantId,
        name,
        phone,
        childName,
        childAge,
        source: "referral",
        status: "new",
        level: "hot",
        tags: `转介绍,奖励:${rewardType || '课时'}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: referral,
    });
  } catch (error) {
    console.error("创建转介绍错误:", error);
    return NextResponse.json({ error: "创建转介绍失败" }, { status: 500 });
  }
}
