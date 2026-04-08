import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { createPaymentOrder } from "@/lib/payments/service";

const MONTHLY_PRICE_BY_PLAN_NAME: Record<string, number> = {
  基础版: 199,
  专业版: 699,
  企业版: 1299,
};

function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as { role?: string };
    if (!decoded.role || (decoded.role !== "platform" && decoded.role !== "super_admin")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const admin = verifyAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  try {
    const body = await request.json();
    const { merchantId, planId, provider, channel, billingCycle } = body as {
      merchantId?: string;
      planId?: string;
      provider?: "wechat" | "alipay";
      channel?: string;
      billingCycle?: "monthly" | "yearly";
    };

    if (!merchantId || !planId || !provider) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const [merchant, plan] = await Promise.all([
      prisma.merchant.findUnique({ where: { id: merchantId } }),
      prisma.membershipPlan.findUnique({ where: { id: planId } }),
    ]);
    if (!merchant || !plan) {
      return NextResponse.json({ error: "商家或套餐不存在" }, { status: 404 });
    }
    const cycle = billingCycle === "monthly" ? "monthly" : "yearly";
    const monthlyPrice = MONTHLY_PRICE_BY_PLAN_NAME[plan.name];
    const amount =
      cycle === "monthly"
        ? monthlyPrice ?? Number((plan.price / 12).toFixed(2))
        : plan.yearlyPrice || plan.price;

    const result = await createPaymentOrder({
      merchantId,
      planId,
      provider,
      channel: channel || "page",
      subject: `会员订阅-${plan.name}-${cycle === "monthly" ? "月付" : "年付"}`,
      body: `商家 ${merchant.phone} 订阅 ${plan.name}（${cycle === "monthly" ? "月付" : "年付"}）`,
      amount,
      businessType: "subscription",
      metadata: { source: "admin_finance", createdByRole: "platform_admin", billingCycle: cycle },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("创建支付订单失败:", error);
    return NextResponse.json({ error: "创建支付订单失败" }, { status: 500 });
  }
}

