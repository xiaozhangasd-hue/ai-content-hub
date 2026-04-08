import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 添加跟进记录
 * POST /api/principal/crm/leads/[id]/followup
 */
export async function POST(
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
    const { id: leadId } = await params;
    const body = await request.json();
    const { type, content, result, nextAction, nextTime } = body;

    // 验证线索归属
    const lead = await prisma.customer.findFirst({
      where: { id: leadId, merchantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "线索不存在" }, { status: 404 });
    }

    // 创建跟进记录
    const followUp = await prisma.followUp.create({
      data: {
        customerId: leadId,
        type: type || "phone",
        content,
        result,
        nextAction,
        nextTime: nextTime ? new Date(nextTime) : null,
      },
    });

    // 更新线索状态
    await prisma.customer.update({
      where: { id: leadId },
      data: {
        lastContact: new Date(),
        nextFollowUp: nextTime ? new Date(nextTime) : null,
        status: lead.status === "new" ? "contacted" : lead.status,
      },
    });

    return NextResponse.json({
      success: true,
      data: followUp,
    });
  } catch (error) {
    console.error("添加跟进记录错误:", error);
    return NextResponse.json({ error: "添加跟进记录失败" }, { status: 500 });
  }
}

/**
 * 获取跟进记录列表
 * GET /api/principal/crm/leads/[id]/followup
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
    const { id: leadId } = await params;

    // 验证线索归属
    const lead = await prisma.customer.findFirst({
      where: { id: leadId, merchantId },
    });

    if (!lead) {
      return NextResponse.json({ error: "线索不存在" }, { status: 404 });
    }

    // 获取跟进记录
    const followUps = await prisma.followUp.findMany({
      where: { customerId: leadId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    console.error("获取跟进记录错误:", error);
    return NextResponse.json({ error: "获取跟进记录失败" }, { status: 500 });
  }
}
