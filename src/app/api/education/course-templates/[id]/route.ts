import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const course = await prisma.courseTemplate.update({
      where: { id },
      data: {
        name: data.name || undefined,
        category: data.category || null,
        totalHours: data.totalHours || undefined,
        duration: data.duration || undefined,
        price: data.price || null,
        description: data.description || null,
      },
    });

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error("更新课程模板错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.courseTemplate.update({
      where: { id },
      data: { status: "inactive" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除课程模板错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
