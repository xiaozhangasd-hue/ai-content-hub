export type PaymentProvider = "wechat" | "alipay";

export type CreatePaymentOrderInput = {
  merchantId: string;
  planId?: string;
  subject: string;
  body?: string;
  amount: number;
  provider: PaymentProvider;
  channel?: string;
  businessType?: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentOrderResult = {
  orderId: string;
  orderNo: string;
  provider: PaymentProvider;
  payParams: Record<string, unknown>;
};

export type ProviderConfigCheckResult = {
  ok: boolean;
  missingKeys: string[];
};

