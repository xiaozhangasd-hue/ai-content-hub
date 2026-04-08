import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 获取老师档案
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少教师ID" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
        merchantId: true,
        campusId: true,
        campus: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "教师不存在" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("获取教师档案错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取失败" },
      { status: 500 }
    );
  }
}
