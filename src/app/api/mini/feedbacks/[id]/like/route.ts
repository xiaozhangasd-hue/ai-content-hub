import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 点赞点评
 * POST /api/mini/feedbacks/:id/like
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: feedbackId } = await params;

    // 更新点赞状态
    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { liked: true },
    });

    return NextResponse.json({
      success: true,
      liked: feedback.liked,
    });
  } catch (error) {
    console.error("点赞点评错误:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
