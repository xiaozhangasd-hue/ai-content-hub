import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 更新试听反馈
 * PUT /api/principal/trial-classes/[id]/feedback
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const { rating, feedback, interested, status } = body;

    // 验证客户归属
    const customer = await prisma.customer.findFirst({
      where: { id, merchantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // 创建反馈跟进记录
    const followUp = await prisma.followUp.create({
      data: {
        customerId: id,
        type: "visit",
        content: `试听反馈: 评分${rating || "-"}/5, ${feedback || ""}`,
        result: interested ? "有意愿" : "无意愿",
      },
    });

    // 更新客户状态
    await prisma.customer.update({
      where: { id },
      data: {
        status: status || "trial",
        note: customer.note
          ? `${customer.note}\n[试听反馈] ${feedback}`
          : `[试听反馈] ${feedback}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error("更新试听反馈错误:", error);
    return NextResponse.json({ error: "更新试听反馈失败" }, { status: 500 });
  }
}

/**
 * 获取试听反馈列表
 * GET /api/principal/trial-classes/[id]/feedback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    // 验证客户归属
    const customer = await prisma.customer.findFirst({
      where: { id, merchantId },
      include: {
        followUps: {
          where: { type: { in: ["trial", "visit"] } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          childName: customer.childName,
          intentCourse: customer.intentCourse,
          status: customer.status,
          note: customer.note,
        },
        feedbacks: customer.followUps,
      },
    });
  } catch (error) {
    console.error("获取试听反馈错误:", error);
    return NextResponse.json({ error: "获取试听反馈失败" }, { status: 500 });
  }
}
