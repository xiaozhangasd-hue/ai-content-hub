import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取课时余额
 * GET /api/mini/hours?childId=xxx
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

    if (!childId) {
      return NextResponse.json({ error: "缺少孩子ID" }, { status: 400 });
    }

    // 验证家长是否有权限访问该孩子
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId,
        studentId: childId,
        status: "active",
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: "active" },
              include: {
                class: true,
              },
            },
          },
        },
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    const enrollments = parentChild.student.enrollments.map((e) => ({
      classId: e.classId,
      className: e.class.name,
      remainingHours: e.remainingHours,
      totalHours: e.totalHours,
      usedHours: e.totalHours - e.remainingHours,
      warningLevel:
        e.remainingHours < 3 ? "critical" : e.remainingHours < 5 ? "low" : "normal",
    }));

    const totalRemaining = enrollments.reduce((sum, e) => sum + e.remainingHours, 0);

    return NextResponse.json({
      childId: parentChild.student.id,
      childName: parentChild.student.name,
      enrollments,
      totalRemaining,
    });
  } catch (error) {
    console.error("获取课时余额错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
