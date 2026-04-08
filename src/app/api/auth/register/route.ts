import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * 注册API
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, password, name, institution, category } = await request.json();

    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "请输入正确的手机号" },
        { status: 400 }
      );
    }

    // 验证密码
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要6位" },
        { status: 400 }
      );
    }

    // 检查手机号是否已注册
    const existingMerchant = await prisma.merchant.findUnique({
      where: { phone },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { error: "该手机号已注册，请直接登录" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const merchant = await prisma.merchant.create({
      data: {
        phone,
        password: hashedPassword,
        name: name || null,
        institution: institution || null,
        category: category || null,
      },
    });

    // 生成JWT token
    const token = generateToken({
      merchantId: merchant.id,
      phone: merchant.phone,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: merchant.id,
        phone: merchant.phone,
        name: merchant.name,
        institution: merchant.institution,
        category: merchant.category,
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
