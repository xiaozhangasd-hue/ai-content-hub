import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 获取充值记录
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

    const recharges = await prisma.recharge.findMany({
      where: {
        student: { merchantId: decoded.merchantId },
        AND: studentId ? { studentId } : {},
      },
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, recharges });
  } catch (error) {
    console.error("获取充值记录错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 创建充值记录
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
    const { studentId, hours, amount, paymentType, remark } = data;

    if (!studentId || !hours) {
      return NextResponse.json({ error: "学生和课时为必填项" }, { status: 400 });
    }

    // 创建充值记录
    const recharge = await prisma.recharge.create({
      data: {
        studentId,
        hours: parseFloat(hours),
        amount: amount ? parseFloat(amount) : null,
        paymentType: paymentType || null,
        remark: remark || null,
        operatorId: decoded.merchantId,
      },
    });

    // 更新学生所有班级的课时
    await prisma.enrollment.updateMany({
      where: { studentId, status: "active" },
      data: {
        totalHours: { increment: parseFloat(hours) },
        remainingHours: { increment: parseFloat(hours) },
      },
    });

    return NextResponse.json({ success: true, recharge });
  } catch (error) {
    console.error("创建充值记录错误:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
