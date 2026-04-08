import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 家长评论
 * POST /api/mini/feedbacks/:id/comment
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
    const { comment } = await request.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "请输入评论内容" }, { status: 400 });
    }

    // 更新家长评论
    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { parentComment: comment.trim() },
    });

    return NextResponse.json({
      success: true,
      comment: feedback.parentComment,
    });
  } catch (error) {
    console.error("家长评论错误:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
