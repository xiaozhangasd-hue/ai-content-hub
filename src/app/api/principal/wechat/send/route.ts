import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 发送微信订阅消息
 * POST /api/principal/wechat/send
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
    const { templateId, recipientId, data, sendTime } = body;

    // 验证接收者
    const recipient = await prisma.customer.findFirst({
      where: { id: recipientId, merchantId },
    });

    if (!recipient) {
      return NextResponse.json({ error: "接收者不存在" }, { status: 404 });
    }

    // 创建通知记录
    const notification = await prisma.notification.create({
      data: {
        studentId: recipientId,
        type: "system",
        title: data.title || "系统通知",
        content: JSON.stringify(data),
        data: JSON.stringify({ templateId, sendTime }),
      },
    });

    return NextResponse.json({
      success: true,
      message: sendTime ? "消息已加入发送队列" : "消息发送成功",
      data: { id: notification.id },
    });
  } catch (error) {
    console.error("发送订阅消息错误:", error);
    return NextResponse.json({ error: "发送订阅消息失败" }, { status: 500 });
  }
}

/**
 * 批量发送微信订阅消息
 * PUT /api/principal/wechat/send
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
    const { templateId, recipientIds, data } = body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json({ error: "请选择接收者" }, { status: 400 });
    }

    // 创建通知记录
    const notifications = [];
    for (const recipientId of recipientIds) {
      const notification = await prisma.notification.create({
        data: {
          studentId: recipientId,
          type: "system",
          title: data.title || "系统通知",
          content: JSON.stringify(data),
          data: JSON.stringify({ templateId }),
        },
      });
      notifications.push(notification);
    }

    return NextResponse.json({
      success: true,
      message: `已发送 ${notifications.length} 条消息`,
      data: {
        sentCount: notifications.length,
      },
    });
  } catch (error) {
    console.error("批量发送订阅消息错误:", error);
    return NextResponse.json({ error: "批量发送失败" }, { status: 500 });
  }
}
