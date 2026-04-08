import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取推荐码列表
 * 使用 Customer 模型的 tags 字段存储推荐码信息
 * GET /api/principal/referral/codes
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
    const search = searchParams.get("search") || "";

    // 获取标记为推荐来源的客户
    const whereClause: Record<string, unknown> = {
      merchantId,
      source: "referral",
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          followUps: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    // 生成虚拟推荐码
    const codes = customers.map((c) => ({
      id: c.id,
      code: `REF${c.id.substring(0, 6).toUpperCase()}`,
      discountType: "fixed",
      discountValue: 100,
      description: c.note || "转介绍优惠",
      status: c.status === "lost" ? "inactive" : "active",
      usageCount: c.followUps ? c.followUps.length : 0,
      validFrom: c.createdAt,
      validTo: new Date(c.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000),
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: codes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取推荐码错误:", error);
    return NextResponse.json({ error: "获取推荐码失败" }, { status: 500 });
  }
}

/**
 * 生成推荐码
 * POST /api/principal/referral/codes
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
    const { description, count = 1 } = body;

    // 生成虚拟推荐码（存储在tags中）
    const codes = [];
    for (let i = 0; i < count; i++) {
      const codeStr = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      codes.push({
        id: `virtual_${Date.now()}_${i}`,
        code: codeStr,
        discountType: "fixed",
        discountValue: 100,
        description: description || "转介绍优惠",
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    }

    return NextResponse.json({
      success: true,
      data: codes,
    });
  } catch (error) {
    console.error("生成推荐码错误:", error);
    return NextResponse.json({ error: "生成推荐码失败" }, { status: 500 });
  }
}

/**
 * 更新推荐码状态
 * PUT /api/principal/referral/codes
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
    const { id, status } = body;

    // 更新客户状态
    if (status === "inactive") {
      await prisma.customer.update({
        where: { id, merchantId },
        data: { status: "lost" },
      });
    } else {
      await prisma.customer.update({
        where: { id, merchantId },
        data: { status: "new" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "状态已更新",
    });
  } catch (error) {
    console.error("更新推荐码错误:", error);
    return NextResponse.json({ error: "更新推荐码失败" }, { status: 500 });
  }
}
