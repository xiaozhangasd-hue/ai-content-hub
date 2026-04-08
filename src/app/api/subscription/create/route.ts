import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 创建订阅
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingCycle } = body; // billingCycle: 'monthly' | 'yearly'

    if (!planId) {
      return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    }

    // 查找套餐
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: '套餐不存在或已下架' }, { status: 400 });
    }

    // 计算订阅时间
    const now = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // 取消之前的订阅
    await prisma.subscription.updateMany({
      where: {
        merchantId,
        status: 'active',
      },
      data: {
        status: 'cancelled',
      },
    });

    // 创建新订阅
    const subscription = await prisma.subscription.create({
      data: {
        merchantId,
        planId: plan.id,
        status: 'active',
        startDate: now,
        endDate,
        autoRenew: true,
      },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planName: plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error('创建订阅失败:', error);
    return NextResponse.json({ error: '创建订阅失败' }, { status: 500 });
  }
}
