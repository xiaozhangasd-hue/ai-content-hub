import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取课堂点评
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId") || "";
    const studentId = searchParams.get("studentId") || "";
    const teacherId = searchParams.get("teacherId") || "";

    const feedbacks = await prisma.feedback.findMany({
      where: {
        teacher: { merchantId: decoded.merchantId },
        AND: [
          lessonId ? { lessonId } : {},
          studentId ? { studentId } : {},
          teacherId ? { teacherId } : {},
        ],
      },
      include: {
        lesson: {
          include: { class: { select: { id: true, name: true } } },
        },
        student: { select: { id: true, name: true, avatar: true } },
        teacher: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error("获取点评列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建课堂点评
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const data = await request.json();
    const { lessonId, studentId, teacherId, content, images, video, ratings, tags } = data;

    if (!lessonId || !studentId || !teacherId || !content) {
      return NextResponse.json({ error: "缺少必填项" }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        lessonId,
        studentId,
        teacherId,
        content,
        images: images ? JSON.stringify(images) : null,
        video: video || null,
        ratings: ratings ? JSON.stringify(ratings) : null,
        tags: tags ? JSON.stringify(tags) : null,
      },
      include: {
        lesson: { include: { class: true } },
        student: true,
        teacher: true,
      },
    });

    // 自动创建成长档案记录
    await prisma.growthRecord.create({
      data: {
        studentId,
        type: "feedback",
        title: "课堂点评",
        content,
        media: images ? JSON.stringify(images) : null,
        recordDate: new Date(),
        feedbackId: feedback.id,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("创建点评错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// 更新点赞状态
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const data = await request.json();
    const { id, liked, parentComment } = data;

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        liked: liked !== undefined ? liked : undefined,
        parentComment: parentComment !== undefined ? parentComment : undefined,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error("更新点评错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
