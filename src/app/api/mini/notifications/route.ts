import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取消息列表
 * GET /api/mini/notifications?childId=xxx&type=all&page=1
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const parentId = payload.parentId;
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const type = searchParams.get("type") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    // 构建查询条件
    const where: Record<string, unknown> = { parentId };
    if (childId) {
      where.studentId = childId;
    }
    if (type !== "all") {
      where.type = type;
    }

    // 获取消息列表
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    const notificationList = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      data: n.data ? JSON.parse(n.data) : null,
      isRead: n.isRead,
      readAt: n.readAt?.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      notifications: notificationList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取消息列表错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
