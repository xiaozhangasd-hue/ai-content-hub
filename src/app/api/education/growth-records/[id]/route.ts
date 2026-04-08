import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取单条成长记录
export async function GET(
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

    const record = await prisma.growthRecord.findFirst({
      where: {
        id,
        student: { merchantId: decoded.merchantId },
      },
      include: {
        student: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("获取成长记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 更新成长记录
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
    const { studentId, type, title, content, media, recordDate, tags, classId } = data;

    // 验证记录存在且属于当前商家
    const existingRecord = await prisma.growthRecord.findFirst({
      where: {
        id,
        student: { merchantId: decoded.merchantId },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const record = await prisma.growthRecord.update({
      where: { id },
      data: {
        ...(studentId && { studentId }),
        ...(type && { type }),
        ...(title && { title }),
        content: content || null,
        media: media ? JSON.stringify(media) : null,
        recordDate: recordDate ? new Date(recordDate) : undefined,
        tags: tags ? JSON.stringify(tags) : null,
      },
      include: {
        student: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("更新成长记录错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// 删除成长记录
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

    // 验证记录存在且属于当前商家
    const existingRecord = await prisma.growthRecord.findFirst({
      where: {
        id,
        student: { merchantId: decoded.merchantId },
      },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    await prisma.growthRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除成长记录错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
