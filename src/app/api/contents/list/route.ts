import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      merchantId: user.merchantId || "",
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: contents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("获取内容列表错误:", error);
    return NextResponse.json(
      { error: "获取内容列表失败" },
      { status: 500 }
    );
  }
}
