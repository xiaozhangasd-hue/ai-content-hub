import { prisma } from "@/lib/prisma";
import { buildMockPayParams, checkProviderConfig } from "./providers";
import { CreatePaymentOrderInput, CreatePaymentOrderResult } from "./types";

function generateOrderNo(prefix: string) {
  const d = new Date();
  const datePart =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
  const randomPart = Math.random().toString().slice(2, 8);
  return `${prefix}${datePart}${randomPart}`;
}

export async function createPaymentOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
  const orderNo = generateOrderNo("P");
  const configCheck = checkProviderConfig(input.provider);

  const order = await prisma.paymentOrder.create({
    data: {
      orderNo,
      merchantId: input.merchantId,
      planId: input.planId || null,
      provider: input.provider,
      channel: input.channel || null,
      businessType: input.businessType || "subscription",
      subject: input.subject,
      body: input.body || null,
      amount: input.amount,
      status: "pending",
      extra: input.metadata ? JSON.stringify(input.metadata) : null,
      expiredAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  // 尚未配置真实支付参数时返回 mock 支付参数，便于前后端联调
  const payParams = !configCheck.ok
    ? {
        ...buildMockPayParams(input.provider, orderNo, input.amount),
        missingConfig: configCheck.missingKeys,
      }
    : {
        mode: "ready_for_api_integration",
        message: "Provider config exists. Next step: wire official SDK/API calls.",
      };

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    provider: input.provider,
    payParams,
  };
}

export async function markOrderPaid(params: {
  orderNo: string;
  provider: "wechat" | "alipay";
  providerOrderNo?: string;
  payload?: string;
}) {
  const order = await prisma.paymentOrder.findUnique({
    where: { orderNo: params.orderNo },
  });
  if (!order) return null;
  if (order.status === "paid") return order;

  const updated = await prisma.paymentOrder.update({
    where: { id: order.id },
    data: {
      status: "paid",
      providerOrderNo: params.providerOrderNo || order.providerOrderNo,
      paidAt: new Date(),
      notifyAt: new Date(),
      notifyPayload: params.payload || null,
    },
  });

  await prisma.paymentTransaction.create({
    data: {
      orderId: updated.id,
      merchantId: updated.merchantId,
      provider: params.provider,
      tradeNo: params.providerOrderNo || null,
      outTradeNo: updated.orderNo,
      status: "success",
      amount: updated.amount,
      paidAt: new Date(),
      rawPayload: params.payload || null,
    },
  });

  // 支付成功后自动开通会员（线上支付场景）
  if (updated.businessType === "subscription" && updated.planId) {
    let billingCycle: "monthly" | "yearly" = "yearly";
    try {
      const extra = updated.extra ? (JSON.parse(updated.extra) as { billingCycle?: "monthly" | "yearly" }) : null;
      if (extra?.billingCycle === "monthly") billingCycle = "monthly";
    } catch {
      // ignore invalid extra json
    }

    await prisma.subscription.updateMany({
      where: { merchantId: updated.merchantId, status: "active" },
      data: { status: "expired" },
    });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (billingCycle === "monthly" ? 1 : 12));

    await prisma.subscription.create({
      data: {
        merchantId: updated.merchantId,
        planId: updated.planId,
        status: "active",
        startDate,
        endDate,
        autoRenew: false,
      },
    });
  }

  return updated;
}

