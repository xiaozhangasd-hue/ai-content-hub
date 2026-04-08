import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 获取用户当月使用量
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 获取当前年月
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 查询当月使用量
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        merchantId,
        period,
      },
    });

    // 转换为使用量对象
    const usage = {
      text: usageRecords.find((r) => r.type === 'text')?.count || 0,
      image: usageRecords.find((r) => r.type === 'image')?.count || 0,
      video: usageRecords.find((r) => r.type === 'video')?.count || 0,
      avatar: usageRecords.find((r) => r.type === 'avatar')?.count || 0,
    };

    // 获取用户当前套餐的限制
    const subscription = await prisma.subscription.findFirst({
      where: {
        merchantId,
        status: 'active',
        endDate: { gte: now },
      },
      include: {
        plan: true,
      },
    });

    // 默认免费版限制
    const defaultLimits = {
      textDaily: 3,
      imageMonthly: 5,
      videoMonthly: 1,
      avatarMonthly: 0,
    };

    let limits = defaultLimits;
    let planName = '免费版';

    if (subscription?.plan?.limits) {
      try {
        limits = JSON.parse(subscription.plan.limits);
        planName = subscription.plan.name;
      } catch (e) {
        console.error('解析套餐限制失败', e);
      }
    }

    // 获取今日文案使用量
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayContents = await prisma.content.count({
      where: {
        merchantId,
        type: 'text',
        createdAt: { gte: today },
      },
    });

    return NextResponse.json({
      usage,
      limits,
      dailyUsage: {
        text: todayContents,
      },
      plan: {
        name: planName,
        endDate: subscription?.endDate,
      },
      canGenerate: {
        text: limits.textDaily === -1 || todayContents < limits.textDaily,
        image: limits.imageMonthly === -1 || usage.image < limits.imageMonthly,
        video: limits.videoMonthly === -1 || usage.video < limits.videoMonthly,
        avatar: limits.avatarMonthly === -1 || usage.avatar < limits.avatarMonthly,
      },
    });
  } catch (error) {
    console.error('获取使用量失败:', error);
    return NextResponse.json({ error: '获取使用量失败' }, { status: 500 });
  }
}
