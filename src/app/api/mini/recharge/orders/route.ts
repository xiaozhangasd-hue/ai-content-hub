import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// 生成订单号
function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `RC${year}${month}${day}${random}`;
}

/**
 * 创建充值订单
 * POST /api/mini/recharge/orders
 */
export async function POST(request: NextRequest) {
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
    const { childId, classId, packageId, hours, amount } = await request.json();

    // 验证必填字段
    if (!parentId || !childId || !classId || !hours || !amount) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 验证家长是否有权限访问该孩子
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId,
        studentId: childId,
        status: "active",
      },
    });

    if (!parentChild) {
      return NextResponse.json({ error: "无权限访问该孩子信息" }, { status: 403 });
    }

    // 获取班级信息
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { merchantId: true },
    });

    if (!classInfo) {
      return NextResponse.json({ error: "班级不存在" }, { status: 404 });
    }

    // 获取套餐信息
    let giftHours = 0;
    if (packageId) {
      const pkg = await prisma.rechargePackage.findUnique({
        where: { id: packageId },
      });
      if (pkg) {
        giftHours = pkg.gift;
      }
    }

    // 创建订单
    const order = await prisma.rechargeOrder.create({
      data: {
        orderNo: generateOrderNo(),
        parentId,
        studentId: childId,
        classId,
        packageId,
        merchantId: classInfo.merchantId,
        hours,
        giftHours,
        amount,
        status: "pending",
      },
    });

    // 这里应该调用微信支付接口获取支付参数
    // 由于是演示，直接返回模拟数据
    const paymentParams = {
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: Math.random().toString(36).substring(2, 15),
      package: `prepay_id=wx${Date.now()}`,
      signType: "RSA",
      paySign: "mock_sign",
    };

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNo: order.orderNo,
      paymentParams,
    });
  } catch (error) {
    console.error("创建充值订单错误:", error);
    return NextResponse.json(
      { error: "创建订单失败" },
      { status: 500 }
    );
  }
}

/**
 * 查询订单状态
 * GET /api/mini/recharge/orders/:orderId
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

    const url = new URL(request.url);
    const orderId = url.pathname.split("/").pop();

    if (!orderId) {
      return NextResponse.json({ error: "缺少订单ID" }, { status: 400 });
    }

    // 获取订单
    const order = await prisma.rechargeOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 验证订单所属
    if (order.parentId !== payload.parentId) {
      return NextResponse.json({ error: "无权限访问该订单" }, { status: 403 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNo: order.orderNo,
      status: order.status,
      hours: order.hours + order.giftHours,
      amount: order.amount,
      paidAt: order.paidAt?.toISOString(),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("查询订单错误:", error);
    return NextResponse.json(
      { error: "查询失败" },
      { status: 500 }
    );
  }
}
