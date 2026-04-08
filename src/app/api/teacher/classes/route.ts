import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取老师关联的班级列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get("teacherId");

    if (!teacherId) {
      return NextResponse.json({ error: "缺少教师ID" }, { status: 400 });
    }

    // 获取老师关联的班级
    const classes = await prisma.class.findMany({
      where: {
        teacherId,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        campusId: true,
        courseTemplateId: true,
        campus: {
          select: {
            name: true,
          },
        },
        courseTemplate: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        courseName: cls.courseTemplate?.name,
        campusName: cls.campus?.name,
        studentCount: cls._count.enrollments,
      })),
    });
  } catch (error) {
    console.error("获取班级列表错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取失败" },
      { status: 500 }
    );
  }
}
