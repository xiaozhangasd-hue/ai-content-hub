import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 从请求中提取token（支持cookie和Authorization头）
async function getTokenFromRequest(request: NextRequest): Promise<string | null> {
  // 优先从cookie获取
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) return cookieToken;
  
  // 从Authorization头获取
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  return null;
}

// 获取校区列表
export async function GET(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const merchantId = payload.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    // 获取该商家的所有校区
    const campuses = await prisma.campus.findMany({
      where: { merchantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            customers: true,
            students: true,
            teachers: true,
            classes: true
          }
        }
      }
    });

    return NextResponse.json({ campuses });
  } catch (error) {
    console.error('获取校区列表失败:', error);
    return NextResponse.json({ error: '获取校区列表失败' }, { status: 500 });
  }
}

// 创建校区
export async function POST(request: NextRequest) {
  try {
    const token = await getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const merchantId = payload.merchantId;
    if (!merchantId) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 });
    }

    const body = await request.json();
    const { name, address, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: '校区名称不能为空' }, { status: 400 });
    }

    // 检查是否已存在同名校区
    const existing = await prisma.campus.findFirst({
      where: { merchantId, name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: '校区名称已存在' }, { status: 400 });
    }

    // 获取最大排序号
    const maxSort = await prisma.campus.aggregate({
      where: { merchantId },
      _max: { sortOrder: true }
    });

    const campus = await prisma.campus.create({
      data: {
        merchantId,
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        sortOrder: (maxSort._max.sortOrder || 0) + 1
      }
    });

    return NextResponse.json({ campus });
  } catch (error) {
    console.error('创建校区失败:', error);
    return NextResponse.json({ error: '创建校区失败' }, { status: 500 });
  }
}
