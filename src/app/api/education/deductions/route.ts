import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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
    const enrollmentId = searchParams.get("enrollmentId") || "";

    const deductions = await prisma.deduction.findMany({
      where: {
        enrollment: {
          student: { merchantId: decoded.merchantId },
          AND: enrollmentId ? { id: enrollmentId } : {},
        },
      },
      include: {
        enrollment: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 获取关联的课程信息
    const lessonIds = deductions.filter(d => d.lessonId).map(d => d.lessonId) as string[];
    const lessons = lessonIds.length > 0 ? await prisma.lesson.findMany({
      where: { id: { in: lessonIds } },
      include: { class: { select: { id: true, name: true } } },
    }) : [];

    const lessonMap = new Map(lessons.map(l => [l.id, l]));

    const result = deductions.map(d => ({
      ...d,
      lesson: d.lessonId ? lessonMap.get(d.lessonId) : null,
    }));

    return NextResponse.json({ success: true, deductions: result });
  } catch (error) {
    console.error("获取消课记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
