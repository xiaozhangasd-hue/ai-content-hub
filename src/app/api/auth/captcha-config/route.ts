import { NextResponse } from "next/server";

/**
 * 腾讯云验证码配置接口
 * GET /api/auth/captcha-config
 * 
 * 返回腾讯云验证码AppId供前端使用
 */
export async function GET() {
  const appId = process.env.TENCENT_CAPTCHA_APP_ID;

  if (!appId) {
    // 未配置验证码，返回空
    return NextResponse.json({ 
      appId: null,
      enabled: false 
    });
  }

  return NextResponse.json({ 
    appId,
    enabled: true 
  });
}
