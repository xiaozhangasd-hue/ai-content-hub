import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取成长档案
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
    const studentId = searchParams.get("studentId") || "";
    const type = searchParams.get("type") || "";

    const records = await prisma.growthRecord.findMany({
      where: {
        student: { merchantId: decoded.merchantId },
        AND: [
          studentId ? { studentId } : {},
          type ? { type } : {},
        ],
      },
      include: {
        student: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { recordDate: "desc" },
    });

    // 格式化返回数据
    const formattedRecords = records.map(record => ({
      ...record,
      media: record.media ? JSON.parse(record.media) : null,
      tags: record.tags ? JSON.parse(record.tags) : null,
    }));

    return NextResponse.json({ success: true, records: formattedRecords });
  } catch (error) {
    console.error("获取成长档案错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建成长档案
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
    const { studentId, type, title, content, media, recordDate, tags } = data;

    if (!studentId || !type || !title) {
      return NextResponse.json({ error: "缺少必填项" }, { status: 400 });
    }

    const record = await prisma.growthRecord.create({
      data: {
        studentId,
        type,
        title,
        content: content || null,
        media: media ? JSON.stringify(media) : null,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        tags: tags ? JSON.stringify(tags) : null,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("创建成长档案错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
