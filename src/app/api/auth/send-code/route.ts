import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 生成6位验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 验证腾讯云验证码票据
 * 文档：https://cloud.tencent.com/document/product/1110/36926
 */
async function verifyCaptcha(ticket: string, randstr: string, userIp: string): Promise<boolean> {
  const appId = process.env.TENCENT_CAPTCHA_APP_ID;
  const appSecret = process.env.TENCENT_CAPTCHA_APP_SECRET;

  // 如果没有配置验证码，直接通过
  if (!appId || !appSecret) {
    console.log("未配置腾讯云验证码，跳过验证");
    return true;
  }

  // 如果没有传票据，验证失败
  if (!ticket) {
    return false;
  }

  try {
    const response = await fetch(
      `https://ssl.captcha.qq.com/ticket/verify?aid=${appId}&AppSecretKey=${appSecret}&Ticket=${ticket}&Randstr=${randstr}&UserIP=${userIp}`,
      {
        method: "GET",
      }
    );

    const data = await response.json();
    
    // response: 1 验证成功，0 验证失败
    if (data.response === 1) {
      return true;
    } else {
      console.error("验证码验证失败:", data);
      return false;
    }
  } catch (error) {
    console.error("验证码验证异常:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, captchaTicket, captchaRandstr } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "请输入正确的手机号" },
        { status: 400 }
      );
    }

    // 验证腾讯云验证码
    const captchaEnabled = process.env.TENCENT_CAPTCHA_APP_ID && process.env.TENCENT_CAPTCHA_APP_SECRET;
    
    if (captchaEnabled) {
      const userIp = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "127.0.0.1";
      
      const isValidCaptcha = await verifyCaptcha(
        captchaTicket || "", 
        captchaRandstr || "", 
        userIp
      );

      if (!isValidCaptcha) {
        return NextResponse.json(
          { error: "人机验证失败，请重新验证" },
          { status: 400 }
        );
      }
    }

    // 生成验证码
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 删除该手机号的旧验证码
    await prisma.verificationCode.deleteMany({
      where: { phone },
    });

    // 保存新验证码
    await prisma.verificationCode.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // 在实际项目中，这里应该调用短信服务发送验证码
    // 开发环境下，我们直接返回验证码（生产环境需要删除）
    console.log(`验证码已生成: ${phone} -> ${code}`);

    return NextResponse.json({
      success: true,
      message: "验证码已发送",
      // 开发环境返回验证码，生产环境删除此字段
      devCode: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("发送验证码错误:", error);
    return NextResponse.json(
      { error: "发送验证码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
