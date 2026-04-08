import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 获取试听列表
 * GET /api/principal/trial-classes
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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 构建查询条件 - 获取有试听状态的客户
    const whereClause: Record<string, unknown> = {
      merchantId,
      status: { in: ["invited", "trial", "signed", "lost"] },
      ...(status ? { status } : {}),
      OR: search
        ? [
            { name: { contains: search } },
            { phone: { contains: search } },
          ]
        : undefined,
    };

    const [trials, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          followUps: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    const result = trials.map((trial) => ({
      id: trial.id,
      name: trial.name,
      phone: trial.phone,
      childName: trial.childName,
      intentCourse: trial.intentCourse,
      status: trial.status,
      lastContact: trial.lastContact,
      note: trial.note,
      createdAt: trial.createdAt,
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
    console.error("获取试听列表错误:", error);
    return NextResponse.json({ error: "获取试听列表失败" }, { status: 500 });
  }
}

/**
 * 创建试听记录
 * POST /api/principal/trial-classes
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
    const { customerId, courseName, teacherId, trialDate, note } = body;

    // 更新客户状态为已邀约
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, merchantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // 创建跟进记录作为试听安排
    const followUp = await prisma.followUp.create({
      data: {
        customerId,
        type: "trial",
        content: `安排试听课程: ${courseName}`,
        nextAction: trialDate ? `试听时间: ${new Date(trialDate).toLocaleString("zh-CN")}` : undefined,
      },
    });

    // 更新客户状态
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        status: "invited",
        lastContact: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error("创建试听记录错误:", error);
    return NextResponse.json({ error: "创建试听记录失败" }, { status: 500 });
  }
}
