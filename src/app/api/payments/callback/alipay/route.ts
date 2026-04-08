import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const params = new URLSearchParams(payload);
    const outTradeNo = params.get("out_trade_no") || "";
    const tradeNo = params.get("trade_no") || "";
    const tradeStatus = params.get("trade_status") || "";
    const notifyId = params.get("notify_id") || `${outTradeNo}_${tradeNo}_${Date.now()}`;

    if (!outTradeNo) {
      return new NextResponse("fail", { status: 400 });
    }

    // 幂等：同一回调事件只处理一次
    const exists = await prisma.paymentWebhookEvent.findUnique({
      where: { provider_eventId: { provider: "alipay", eventId: notifyId } },
    });
    if (exists?.processed) {
      return new NextResponse("success");
    }

    await prisma.paymentWebhookEvent.upsert({
      where: { provider_eventId: { provider: "alipay", eventId: notifyId } },
      create: {
        provider: "alipay",
        eventId: notifyId,
        eventType: tradeStatus,
        payload,
        processed: false,
      },
      update: { payload, eventType: tradeStatus },
    });

    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      await markOrderPaid({
        orderNo: outTradeNo,
        provider: "alipay",
        providerOrderNo: tradeNo || undefined,
        payload,
      });
    }

    await prisma.paymentWebhookEvent.update({
      where: { provider_eventId: { provider: "alipay", eventId: notifyId } },
      data: { processed: true, processedAt: new Date() },
    });

    return new NextResponse("success");
  } catch (error) {
    console.error("支付宝回调处理失败:", error);
    return new NextResponse("fail", { status: 500 });
  }
}

