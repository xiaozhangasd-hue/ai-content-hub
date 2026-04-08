import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * 收藏/取消收藏
 * POST /api/ai-assistant/favorite
 * 
 * 请求体：
 * - id: 历史记录ID
 * - isFavorite: 是否收藏
 */
export async function POST(request: NextRequest) {
  try {
    // 验证身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { id, isFavorite } = body;

    if (!id) {
      return NextResponse.json({ error: "记录ID不能为空" }, { status: 400 });
    }

    // 更新收藏状态
    const record = await prisma.aiAssistantHistory.update({
      where: { id },
      data: { isFavorite: isFavorite ?? true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        isFavorite: record.isFavorite,
      },
    });
  } catch (error) {
    console.error("收藏操作错误:", error);
    return NextResponse.json(
      { error: "收藏操作失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除记录
 * DELETE /api/ai-assistant/favorite?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证身份
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "记录ID不能为空" }, { status: 400 });
    }

    // 软删除
    await prisma.aiAssistantHistory.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除记录错误:", error);
    return NextResponse.json(
      { error: "删除失败" },
      { status: 500 }
    );
  }
}
