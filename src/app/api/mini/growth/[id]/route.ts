import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取成长档案详情
 * GET /api/mini/growth/:id
 */
export async function GET(
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

    const { id: growthId } = await params;

    // 获取成长档案详情
    const record = await prisma.growthRecord.findUnique({
      where: { id: growthId },
      include: {
        student: {
          include: {
            campus: true,
          },
        },
      },
    });

    // 如果有关联的反馈ID，单独查询反馈
    let feedback = null;
    if (record?.feedbackId) {
      feedback = await prisma.feedback.findUnique({
        where: { id: record.feedbackId },
        include: {
          lesson: {
            include: { class: true },
          },
          teacher: true,
        },
      });
    }

    if (!record) {
      return NextResponse.json({ error: "档案不存在" }, { status: 404 });
    }

    // 验证家长是否有权限访问
    if (!record.isPublic) {
      const parentChild = await prisma.parentChild.findFirst({
        where: {
          parentId: payload.parentId,
          studentId: record.studentId,
          status: "active",
        },
      });

      if (!parentChild) {
        return NextResponse.json({ error: "无权限访问" }, { status: 403 });
      }
    }

    const response = {
      id: record.id,
      type: record.type,
      title: record.title,
      content: record.content,
      media: record.media ? JSON.parse(record.media) : [],
      recordDate: record.recordDate.toISOString().split("T")[0],
      tags: record.tags ? JSON.parse(record.tags) : [],
      student: {
        id: record.student.id,
        name: record.student.name,
        avatar: record.student.avatar,
        campus: record.student.campus?.name,
      },
      className: feedback?.lesson?.class?.name,
      teacher: feedback?.teacher
        ? {
            id: feedback.teacher.id,
            name: feedback.teacher.name,
            avatar: feedback.teacher.avatar,
          }
        : null,
      feedback: feedback
        ? {
            id: feedback.id,
            content: feedback.content,
            ratings: feedback.ratings ? JSON.parse(feedback.ratings) : null,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取成长档案详情错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
