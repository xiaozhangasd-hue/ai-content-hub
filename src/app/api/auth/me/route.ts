import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: user.merchantId },
      select: {
        id: true,
        phone: true,
        name: true,
        createdAt: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: merchant,
    });
  } catch (error) {
    console.error("获取用户信息错误:", error);
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }
}
