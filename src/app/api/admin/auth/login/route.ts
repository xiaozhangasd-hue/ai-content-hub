import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// 初始化默认管理员（首次运行时）
async function initDefaultAdmin() {
  const existingAdmin = await prisma.admin.findFirst();
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "超级管理员",
        role: "super_admin",
      },
    });
    console.log("默认管理员已创建: admin / admin123");
  }
}

export async function POST(request: NextRequest) {
  try {
    await initDefaultAdmin();
    
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
    }

    // 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "账号不存在或已禁用" }, { status: 401 });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    // 更新最后登录时间
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // 生成JWT
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || "admin-secret",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("管理员登录错误:", error);
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
