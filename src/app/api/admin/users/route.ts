import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const DEFAULT_PLAN_CONFIG: Record<
  string,
  { monthlyPrice: number; yearlyPrice: number; sortOrder: number; features: string[] }
> = {
  基础版: {
    monthlyPrice: 199,
    yearlyPrice: 1980,
    sortOrder: 2,
    features: ["AI文案生成", "3个子账号", "基础数据统计"],
  },
  专业版: {
    monthlyPrice: 699,
    yearlyPrice: 6800,
    sortOrder: 3,
    features: ["全部基础功能", "10个子账号", "教务管理系统", "高级数据分析"],
  },
  企业版: {
    monthlyPrice: 1299,
    yearlyPrice: 12800,
    sortOrder: 4,
    features: ["全部专业功能", "无限子账号", "专属客服支持", "定制化功能"],
  },
};

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "admin-secret") as {
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

// 获取用户列表
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { phone: { contains: search } },
            { name: { contains: search } },
          ],
        }
      : {};

    // 获取用户列表
    const users = await prisma.merchant.findMany({
      where,
      include: {
        subscriptions: {
          where: {
            status: "active",
            endDate: { gte: new Date() },
          },
          include: {
            plan: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { contents: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 获取总数
    const total = await prisma.merchant.count({ where });

    // 格式化用户数据
    const formattedUsers = users.map((user) => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      createdAt: user.createdAt,
      subscription: user.subscriptions[0]
        ? {
            planName: user.subscriptions[0].plan?.name,
            planPrice: user.subscriptions[0].plan?.price || 0,
            startDate: user.subscriptions[0].startDate,
            status: user.subscriptions[0].status,
            endDate: user.subscriptions[0].endDate,
          }
        : null,
      contentCount: user._count.contents,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

// 手动开通会员
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const { phone, planId, planName, months = 12 } = await request.json();
    if (!phone || (!planId && !planName)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const merchant = await prisma.merchant.findUnique({ where: { phone } });
    if (!merchant) {
      return NextResponse.json({ error: "商家不存在" }, { status: 404 });
    }

    let plan =
      (planId
        ? await prisma.membershipPlan.findUnique({ where: { id: planId } })
        : null) ||
      (planName
        ? await prisma.membershipPlan.findFirst({
            where: {
              isActive: true,
              OR: [{ name: planName }, { name: { contains: planName } }],
            },
            orderBy: { sortOrder: "asc" },
          })
        : null);

    // 强兜底：后台手动开通时，即使套餐不存在/停用也自动可开通
    const normalizedPlanName =
      planName && ["基础版", "专业版", "企业版"].includes(planName) ? planName : "基础版";
    const fallbackConfig = DEFAULT_PLAN_CONFIG[normalizedPlanName];

    if (!plan) {
      plan = await prisma.membershipPlan.create({
        data: {
          name: normalizedPlanName,
          price: fallbackConfig.yearlyPrice,
          yearlyPrice: fallbackConfig.yearlyPrice,
          features: JSON.stringify(fallbackConfig.features),
          limits: JSON.stringify({}),
          isActive: true,
          sortOrder: fallbackConfig.sortOrder,
        },
      });
    } else if (!plan.isActive) {
      plan = await prisma.membershipPlan.update({
        where: { id: plan.id },
        data: { isActive: true },
      });
    }

    await prisma.subscription.updateMany({
      where: { merchantId: merchant.id, status: "active" },
      data: { status: "expired" },
    });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Number(months));

    const subscription = await prisma.subscription.create({
      data: {
        merchantId: merchant.id,
        planId: plan.id,
        status: "active",
        startDate,
        endDate,
        autoRenew: false,
      },
      include: { plan: true, merchant: true },
    });

    // 线下手动开通也写入统一订单台账，便于财务与会员对账
    await prisma.paymentOrder.create({
      data: {
        orderNo: `OFF${Date.now()}${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}`,
        merchantId: merchant.id,
        planId: plan.id,
        provider: "offline",
        channel: "offline",
        businessType: "subscription",
        subject: `线下开通-${plan.name}`,
        body: `管理员线下开通会员，手机号 ${merchant.phone}`,
        amount: Number(months) >= 12 ? plan.yearlyPrice || plan.price : (DEFAULT_PLAN_CONFIG[plan.name]?.monthlyPrice || 0),
        status: "paid",
        paidAt: new Date(),
        notifyAt: new Date(),
        extra: JSON.stringify({ source: "manual_open", months: Number(months) }),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        merchantPhone: subscription.merchant.phone,
        merchantName: subscription.merchant.institution || subscription.merchant.name,
        planName: subscription.plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error("手动开通会员失败:", error);
    return NextResponse.json({ error: "手动开通失败" }, { status: 500 });
  }
}
