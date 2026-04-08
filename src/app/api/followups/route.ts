import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// 验证商家权限
async function verifyMerchant(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "ai-content-hub-jwt-secret-20240321-secure-key") as {
      merchantId: string;
    };
    return decoded.merchantId;
  } catch {
    return null;
  }
}

// 获取跟进记录
export async function GET(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ error: "缺少客户ID" }, { status: 400 });
    }

    // 验证客户属于该商家
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, merchantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    const followUps = await prisma.followUp.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, followUps });
  } catch (error) {
    console.error("获取跟进记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建跟进记录
export async function POST(request: NextRequest) {
  const merchantId = await verifyMerchant(request);
  if (!merchantId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // 验证客户属于该商家
    const customer = await prisma.customer.findFirst({
      where: { id: data.customerId, merchantId },
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    // 创建跟进记录
    const followUp = await prisma.followUp.create({
      data: {
        customerId: data.customerId,
        type: data.type,
        content: data.content,
        result: data.result,
        nextAction: data.nextAction,
        nextTime: data.nextTime ? new Date(data.nextTime) : null,
      },
    });

    // 更新客户信息
    const updateData: any = {
      lastContact: new Date(),
      updatedAt: new Date(),
    };

    if (data.nextTime) {
      updateData.nextFollowUp = new Date(data.nextTime);
    }

    // 根据跟进结果更新状态
    if (data.result === "已邀约") {
      updateData.status = "invited";
    } else if (data.result === "已到访") {
      updateData.status = "trial";
    } else if (data.result === "已报名") {
      updateData.status = "signed";
    } else if (data.result === "无意向") {
      updateData.status = "lost";
    }

    await prisma.customer.update({
      where: { id: data.customerId },
      data: updateData,
    });

    return NextResponse.json({ success: true, followUp });
  } catch (error) {
    console.error("创建跟进记录错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
