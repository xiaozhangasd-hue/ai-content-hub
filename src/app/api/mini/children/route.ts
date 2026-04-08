import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取孩子列表
 * GET /api/mini/children
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

    // 获取家长关联的孩子
    const parentWithChildren = await prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        children: {
          where: { status: "active" },
          include: {
            student: {
              include: {
                campus: true,
                enrollments: {
                  where: { status: "active" },
                  include: {
                    class: {
                      include: {
                        courseTemplate: true,
                        teacher: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parentWithChildren) {
      return NextResponse.json({ children: [] });
    }

    const children = parentWithChildren.children.map((pc) => ({
      id: pc.student.id,
      name: pc.student.name,
      avatar: pc.student.avatar,
      birthDate: pc.student.birthDate?.toISOString().split("T")[0],
      gender: pc.student.gender,
      campus: pc.student.campus?.name,
      relationship: pc.relationship,
      isPrimary: pc.isPrimary,
      enrollments: pc.student.enrollments.map((e) => ({
        classId: e.classId,
        className: e.class.name,
        courseName: e.class.courseTemplate?.name,
        teacher: e.class.teacher?.name,
        remainingHours: e.remainingHours,
        status: e.status,
      })),
    }));

    return NextResponse.json({ children });
  } catch (error) {
    console.error("获取孩子列表错误:", error);
    return NextResponse.json(
      { error: "获取数据失败" },
      { status: 500 }
    );
  }
}
