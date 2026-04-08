import { ProviderConfigCheckResult, PaymentProvider } from "./types";

const providerRequiredKeys: Record<PaymentProvider, string[]> = {
  wechat: [
    "WECHAT_PAY_APP_ID",
    "WECHAT_PAY_MCH_ID",
    "WECHAT_PAY_API_V3_KEY",
    "WECHAT_PAY_PRIVATE_KEY",
    "WECHAT_PAY_CERT_SERIAL_NO",
  ],
  alipay: [
    "ALIPAY_APP_ID",
    "ALIPAY_PRIVATE_KEY",
    "ALIPAY_PUBLIC_KEY",
    "ALIPAY_NOTIFY_URL",
  ],
};

export function checkProviderConfig(provider: PaymentProvider): ProviderConfigCheckResult {
  const required = providerRequiredKeys[provider];
  const missingKeys = required.filter((key) => !process.env[key]);
  return {
    ok: missingKeys.length === 0,
    missingKeys,
  };
}

export function buildMockPayParams(provider: PaymentProvider, orderNo: string, amount: number) {
  if (provider === "wechat") {
    return {
      mode: "mock",
      codeUrl: `weixin://wxpay/mock?out_trade_no=${orderNo}&total_fee=${Math.round(amount * 100)}`,
    };
  }
  return {
    mode: "mock",
    paymentUrl: `https://openapi.alipay.com/gateway.do?out_trade_no=${orderNo}&total_amount=${amount}`,
  };
}

