import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 记录使用量
export async function POST(request: NextRequest) {
  try {
    const merchantId = request.headers.get('x-merchant-id');
    if (!merchantId) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body; // text, image, video, avatar

    if (!type) {
      return NextResponse.json({ error: '缺少类型参数' }, { status: 400 });
    }

    // 获取当前年月
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 更新或创建使用记录
    const existingRecord = await prisma.usageRecord.findUnique({
      where: {
        merchantId_type_period: {
          merchantId,
          type,
          period,
        },
      },
    });

    if (existingRecord) {
      await prisma.usageRecord.update({
        where: {
          id: existingRecord.id,
        },
        data: {
          count: { increment: 1 },
        },
      });
    } else {
      await prisma.usageRecord.create({
        data: {
          merchantId,
          type,
          period,
          count: 1,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录使用量失败:', error);
    return NextResponse.json({ error: '记录使用量失败' }, { status: 500 });
  }
}
