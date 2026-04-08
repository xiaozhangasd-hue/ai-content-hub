import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// 验证管理员权限
async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as {
      adminId?: string;
      id?: string;
      role?: string;
    };
    if (!decoded.role || (decoded.role !== "platform" && decoded.role !== "super_admin")) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// 获取商家列表
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { phone: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        include: {
          _count: {
            select: {
              contents: true,
              courses: true,
              subscriptions: true,
            },
          },
          subscriptions: {
            where: { status: "active" },
            include: { plan: true },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.merchant.count({ where }),
    ]);

    // 获取每个商家的使用量统计
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageStats = await prisma.usageRecord.groupBy({
      by: ["merchantId", "type"],
      where: { period: currentMonth },
      _sum: { count: true },
    });

    const usageMap = new Map<string, Record<string, number>>();
    usageStats.forEach((stat) => {
      if (!usageMap.has(stat.merchantId)) {
        usageMap.set(stat.merchantId, {});
      }
      usageMap.get(stat.merchantId)![stat.type] = stat._sum.count || 0;
    });

    const result = merchants.map((m) => ({
      id: m.id,
      phone: m.phone,
      name: m.name,
      institution: m.institution,
      category: m.category,
      city: m.city,
      createdAt: m.createdAt,
      contentCount: m._count.contents,
      courseCount: m._count.courses,
      subscription: m.subscriptions[0]?.plan.name || "免费版",
      usage: usageMap.get(m.id) || {},
    }));

    return NextResponse.json({
      success: true,
      merchants: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("获取商家列表错误:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 新增商家
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { phone, password, name, institution, category, city } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const exists = await prisma.merchant.findUnique({ where: { phone } });
    if (exists) {
      return NextResponse.json({ error: "该手机号已存在" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const merchant = await prisma.merchant.create({
      data: {
        phone,
        password: hashedPassword,
        name: name || null,
        institution: institution || null,
        category: category || null,
        city: city || null,
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        phone: merchant.phone,
        name: merchant.name,
        institution: merchant.institution,
        category: merchant.category,
        city: merchant.city,
        createdAt: merchant.createdAt,
      },
    });
  } catch (error) {
    console.error("新增商家错误:", error);
    return NextResponse.json({ error: "新增商家失败" }, { status: 500 });
  }
}

// 删除商家
export async function DELETE(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin || admin.role !== "super_admin") {
    return NextResponse.json({ error: "权限不足" }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "缺少商家ID" }, { status: 400 });
    }

    await prisma.merchant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除商家错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
