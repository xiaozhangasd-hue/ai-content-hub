import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 默认套餐配置
const defaultPlans = [
  {
    name: '免费版',
    price: 0,
    yearlyPrice: 0,
    features: JSON.stringify([
      '每日3次文案生成',
      '每月5张图片生成',
      '每月1个视频生成',
      '基础模板库',
      '营销日历',
    ]),
    limits: JSON.stringify({
      textDaily: 3,
      imageMonthly: 5,
      videoMonthly: 1,
      avatarMonthly: 0,
    }),
    sortOrder: 1,
  },
  {
    name: '基础版',
    price: 99,
    yearlyPrice: 990,
    features: JSON.stringify([
      '每日20次文案生成',
      '每月30张图片生成',
      '每月10个视频生成',
      '完整模板库',
      '营销日历',
      'AI头像生成',
      '数据看板',
    ]),
    limits: JSON.stringify({
      textDaily: 20,
      imageMonthly: 30,
      videoMonthly: 10,
      avatarMonthly: 10,
    }),
    sortOrder: 2,
  },
  {
    name: '专业版',
    price: 299,
    yearlyPrice: 2990,
    features: JSON.stringify([
      '每日100次文案生成',
      '每月100张图片生成',
      '每月50个视频生成',
      '完整模板库',
      '营销日历',
      'AI头像生成',
      '数据看板',
      '优先客服支持',
    ]),
    limits: JSON.stringify({
      textDaily: 100,
      imageMonthly: 100,
      videoMonthly: 50,
      avatarMonthly: 50,
    }),
    sortOrder: 3,
  },
  {
    name: '企业版',
    price: 999,
    yearlyPrice: 9990,
    features: JSON.stringify([
      '无限次文案生成',
      '无限图片生成',
      '无限视频生成',
      '完整模板库',
      '营销日历',
      'AI头像生成',
      '数据看板',
      '专属客服经理',
      '定制化功能开发',
      '多账号管理',
    ]),
    limits: JSON.stringify({
      textDaily: -1,
      imageMonthly: -1,
      videoMonthly: -1,
      avatarMonthly: -1,
    }),
    sortOrder: 4,
  },
];

// 初始化套餐数据
export async function POST(request: NextRequest) {
  try {
    // 检查是否已有套餐数据
    const existingPlans = await prisma.membershipPlan.count();
    
    if (existingPlans > 0) {
      return NextResponse.json({ 
        message: '套餐数据已存在',
        count: existingPlans 
      });
    }

    // 创建默认套餐
    for (const plan of defaultPlans) {
      await prisma.membershipPlan.create({
        data: {
          name: plan.name,
          price: plan.price,
          yearlyPrice: plan.yearlyPrice,
          features: plan.features,
          limits: plan.limits,
          sortOrder: plan.sortOrder,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      message: '套餐数据初始化成功',
      count: defaultPlans.length 
    });
  } catch (error) {
    console.error('初始化套餐失败:', error);
    return NextResponse.json({ error: '初始化套餐失败' }, { status: 500 });
  }
}
