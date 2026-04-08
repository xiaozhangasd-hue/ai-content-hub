import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 更新学生
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
    const { name, gender, birthDate, phone, parentName, parentPhone, note } = data;

    const student = await prisma.student.update({
      where: { id },
      data: {
        name: name || undefined,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone || null,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error("更新学生错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除学生
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

    await prisma.student.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除学生错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
