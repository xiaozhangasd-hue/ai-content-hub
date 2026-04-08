import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markOrderPaid } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const body = JSON.parse(payload || "{}") as {
      id?: string;
      event_type?: string;
      resource?: { ciphertext?: string };
      out_trade_no?: string;
      transaction_id?: string;
      trade_state?: string;
    };

    const eventId = body.id || `wx_${Date.now()}`;
    const eventType = body.event_type || "UNKNOWN";

    const exists = await prisma.paymentWebhookEvent.findUnique({
      where: { provider_eventId: { provider: "wechat", eventId } },
    });
    if (exists?.processed) {
      return NextResponse.json({ code: "SUCCESS", message: "OK" });
    }

    await prisma.paymentWebhookEvent.upsert({
      where: { provider_eventId: { provider: "wechat", eventId } },
      create: {
        provider: "wechat",
        eventId,
        eventType,
        payload,
      },
      update: {
        payload,
        eventType,
      },
    });

    // TODO: 这里后续接微信支付 V3 解密 resource.ciphertext，当前保留兼容 mock 字段
    const outTradeNo = body.out_trade_no || "";
    const transactionId = body.transaction_id || "";
    const tradeState = body.trade_state || "";

    if (outTradeNo && tradeState === "SUCCESS") {
      await markOrderPaid({
        orderNo: outTradeNo,
        provider: "wechat",
        providerOrderNo: transactionId || undefined,
        payload,
      });
    }

    await prisma.paymentWebhookEvent.update({
      where: { provider_eventId: { provider: "wechat", eventId } },
      data: { processed: true, processedAt: new Date() },
    });

    return NextResponse.json({ code: "SUCCESS", message: "OK" });
  } catch (error) {
    console.error("微信回调处理失败:", error);
    return NextResponse.json({ code: "FAIL", message: "处理失败" }, { status: 500 });
  }
}

