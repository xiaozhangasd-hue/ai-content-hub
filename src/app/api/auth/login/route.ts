import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

/**
 * 统一登录API
 * POST /api/auth/login
 * 
 * 支持三种角色登录：
 * 1. 平台管理员 - 跳转到总后台 /admin
 * 2. 商家（校长）- 跳转到商家后台 /dashboard
 * 3. 老师（子账号）- 跳转到老师工作台 /teacher
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    // 验证账号
    if (!phone) {
      return NextResponse.json(
        { error: "请输入账号" },
        { status: 400 }
      );
    }

    // 验证密码
    if (!password) {
      return NextResponse.json(
        { error: "请输入密码" },
        { status: 400 }
      );
    }

    // 1. 尝试平台管理员登录
    const platformAdmin = await prisma.platformAdmin.findUnique({
      where: { username: phone },
    });

    if (platformAdmin) {
      const isValidPassword = await bcrypt.compare(password, platformAdmin.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      // 更新最后登录时间
      await prisma.platformAdmin.update({
        where: { id: platformAdmin.id },
        data: { lastLogin: new Date() },
      });

      const token = generateToken({
        id: platformAdmin.id,
        username: platformAdmin.username,
        role: "platform",
      });

      return NextResponse.json({
        success: true,
        token,
        role: "platform",
        redirectTo: "/admin",
        user: {
          id: platformAdmin.id,
          username: platformAdmin.username,
          name: platformAdmin.name || "平台管理员",
        },
      });
    }

    // 2. 尝试商家登录
    const merchant = await prisma.merchant.findUnique({
      where: { phone },
    });

    if (merchant) {
      const isValidPassword = await bcrypt.compare(password, merchant.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      const token = generateToken({
        merchantId: merchant.id,
        phone: merchant.phone,
        role: "merchant",
      });

      return NextResponse.json({
        success: true,
        token,
        role: "merchant",
        redirectTo: "/dashboard",
        user: {
          id: merchant.id,
          phone: merchant.phone,
          name: merchant.name,
          institution: merchant.institution,
          category: merchant.category,
        },
      });
    }

    // 2.5 尝试校区管理员登录（Admin表，登录到商家后台）
    const admin = await prisma.admin.findUnique({
      where: { username: phone },
      include: {
        campus: true,
      },
    });

    if (admin && admin.isActive) {
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      // 更新最后登录时间
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLogin: new Date() },
      });

      const isSystemAdmin =
        admin.role === "super_admin" ||
        admin.role === "platform" ||
        admin.role === "admin";

      const token = generateToken({
        adminId: admin.id,
        merchantId: admin.campus?.merchantId || "",
        campusId: admin.campusId || "",
        username: admin.username,
        role: admin.role, // campus_manager 或 admin
      });

      return NextResponse.json({
        success: true,
        token,
        role: isSystemAdmin ? "platform" : "merchant",
        redirectTo: isSystemAdmin ? "/admin" : "/dashboard",
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name || (isSystemAdmin ? "系统管理员" : "校区管理员"),
          campus: admin.campus?.name,
          accountRole: admin.role, // 具体角色：campus_manager/admin
        },
      });
    }

    // 3. 尝试老师子账号登录
    const teacher = await prisma.teacher.findFirst({
      where: { 
        username: phone,
        password: { not: null },
      },
      include: {
        campus: true,
      },
    });

    if (teacher && teacher.password) {
      const isValidPassword = await bcrypt.compare(password, teacher.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: "密码错误" }, { status: 400 });
      }

      // 更新最后登录时间
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { lastLogin: new Date() },
      });

      const token = generateToken({
        teacherId: teacher.id,
        merchantId: teacher.merchantId,
        username: teacher.username || "",
        role: "teacher",
      });

      return NextResponse.json({
        success: true,
        token,
        role: "teacher",
        redirectTo: "/teacher",
        user: {
          id: teacher.id,
          username: teacher.username,
          name: teacher.name,
          campus: teacher.campus?.name,
          accountRole: teacher.accountRole || "teacher",
        },
      });
    }

    // 账号不存在
    return NextResponse.json(
      { error: "账号不存在，请检查账号或联系管理员" },
      { status: 400 }
    );
  } catch (error) {
    console.error("登录错误:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
