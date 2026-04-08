import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取孩子详情
 * GET /api/mini/children/:id
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

    const { id: childId } = await params;
    const parentId = payload.parentId;

    // 验证家长是否有权限访问该孩子
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId,
        studentId: childId,
        status: "active",
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    // 获取孩子详细信息
    const student = await prisma.student.findUnique({
      where: { id: childId },
      include: {
        campus: true,
        enrollments: {
          where: { status: "active" },
          include: {
            class: {
              include: {
                courseTemplate: true,
                teacher: true,
                campus: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "孩子不存在" }, { status: 404 });
    }

    const response = {
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      birthDate: student.birthDate?.toISOString().split("T")[0],
      gender: student.gender,
      phone: student.phone,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      campus: student.campus
        ? {
            id: student.campus.id,
            name: student.campus.name,
            address: student.campus.address,
            phone: student.campus.phone,
          }
        : null,
      enrollments: student.enrollments.map((e) => ({
        classId: e.classId,
        className: e.class.name,
        courseName: e.class.courseTemplate?.name,
        teacher: e.class.teacher
          ? {
              id: e.class.teacher.id,
              name: e.class.teacher.name,
              phone: e.class.teacher.phone,
            }
          : null,
        remainingHours: e.remainingHours,
        totalHours: e.totalHours,
        joinDate: e.joinDate.toISOString().split("T")[0],
      })),
      relationship: parentChild.relationship,
      isPrimary: parentChild.isPrimary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取孩子详情错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
