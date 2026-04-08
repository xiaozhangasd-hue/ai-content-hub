import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取线索列表
 * GET /api/principal/crm/leads
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
    const status = searchParams.get("status") || undefined;
    const source = searchParams.get("source") || undefined;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件
    const whereClause: Record<string, unknown> = {
      merchantId,
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      OR: search
        ? [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        : undefined,
    };

    const [leads, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          followUps: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    // 获取跟进人信息
    const result = leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      childName: lead.childName,
      childAge: lead.childAge,
      source: lead.source,
      status: lead.status,
      level: lead.level,
      intentCourse: lead.intentCourse,
      lastContact: lead.lastContact,
      nextFollowUp: lead.nextFollowUp,
      lastFollowUp: lead.followUps[0]?.createdAt || null,
      createdAt: lead.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取线索列表错误:", error);
    return NextResponse.json({ error: "获取线索列表失败" }, { status: 500 });
  }
}

/**
 * 创建线索
 * POST /api/principal/crm/leads
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
    const { name, phone, childName, childAge, source, intentCourse, level, note, campusId } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "姓名和手机号不能为空" }, { status: 400 });
    }

    // 检查是否已存在
    const existing = await prisma.customer.findFirst({
      where: { merchantId, phone },
    });

    if (existing) {
      return NextResponse.json({ error: "该手机号已存在线索" }, { status: 400 });
    }

    const lead = await prisma.customer.create({
      data: {
        merchantId,
        campusId,
        name,
        phone,
        childName,
        childAge,
        source,
        intentCourse,
        level: level || "warm",
        note,
        status: "new",
      },
    });

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("创建线索错误:", error);
    return NextResponse.json({ error: "创建线索失败" }, { status: 500 });
  }
}

/**
 * 更新线索
 * PUT /api/principal/crm/leads
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
    const { id, status, level, nextFollowUp, tags, note } = body;

    if (!id) {
      return NextResponse.json({ error: "线索ID不能为空" }, { status: 400 });
    }

    // 验证归属
    const lead = await prisma.customer.findFirst({
      where: { id, merchantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "线索不存在" }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        status,
        level,
        nextFollowUp: nextFollowUp ? new Date(nextFollowUp) : null,
        tags,
        note,
        lastContact: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("更新线索错误:", error);
    return NextResponse.json({ error: "更新线索失败" }, { status: 500 });
  }
}

/**
 * 删除线索
 * DELETE /api/principal/crm/leads?id=xxx
 */
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "线索ID不能为空" }, { status: 400 });
    }

    // 验证归属
    const lead = await prisma.customer.findFirst({
      where: { id, merchantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "线索不存在" }, { status: 404 });
    }

    // 删除跟进记录
    await prisma.followUp.deleteMany({ where: { customerId: id } });

    // 删除线索
    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除线索错误:", error);
    return NextResponse.json({ error: "删除线索失败" }, { status: 500 });
  }
}
