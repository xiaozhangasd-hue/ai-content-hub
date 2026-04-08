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

// 更新校区
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, address, phone, status } = body;

    // 验证校区归属
    const campus = await prisma.campus.findFirst({
      where: { id, merchantId }
    });

    if (!campus) {
      return NextResponse.json({ error: '校区不存在' }, { status: 404 });
    }

    // 检查名称是否重复
    if (name && name.trim() !== campus.name) {
      const existing = await prisma.campus.findFirst({
        where: { merchantId, name: name.trim() }
      });
      if (existing) {
        return NextResponse.json({ error: '校区名称已存在' }, { status: 400 });
      }
    }

    const updated = await prisma.campus.update({
      where: { id },
      data: {
        name: name?.trim() || campus.name,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        status: status || campus.status
      }
    });

    return NextResponse.json({ campus: updated });
  } catch (error) {
    console.error('更新校区失败:', error);
    return NextResponse.json({ error: '更新校区失败' }, { status: 500 });
  }
}

// 删除校区
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // 验证校区归属
    const campus = await prisma.campus.findFirst({
      where: { id, merchantId },
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

    if (!campus) {
      return NextResponse.json({ error: '校区不存在' }, { status: 404 });
    }

    // 检查校区下是否有数据
    const hasData = campus._count.customers > 0 || 
                    campus._count.students > 0 || 
                    campus._count.teachers > 0 || 
                    campus._count.classes > 0;

    if (hasData) {
      return NextResponse.json({ 
        error: '该校区下有数据，无法删除。请先将数据迁移到其他校区。' 
      }, { status: 400 });
    }

    await prisma.campus.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除校区失败:', error);
    return NextResponse.json({ error: '删除校区失败' }, { status: 500 });
  }
}
