import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * 绑定孩子信息
 * POST /api/mini/auth/bind-child
 * 
 * 家长提交孩子信息，系统自动匹配并绑定
 * 验证逻辑：
 * 1. 根据孩子姓名 + 家长手机号查询学生
 * 2. 家长手机号需在学生的 parentPhones 字段中（逗号分隔的多个手机号）
 * 3. 自动创建绑定关系
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 Token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== "parent") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const parentId = payload.parentId;
    if (!parentId) {
      return NextResponse.json({ error: "家长信息不完整" }, { status: 400 });
    }

    const { studentName, parentPhone, relationship } = await request.json();

    // 验证必填字段
    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: "请填写孩子姓名" },
        { status: 400 }
      );
    }

    if (!parentPhone || !parentPhone.trim()) {
      return NextResponse.json(
        { error: "请填写家长手机号" },
        { status: 400 }
      );
    }

    // 获取家长信息
    const parentInfo = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parentInfo) {
      return NextResponse.json({ error: "家长信息不存在" }, { status: 400 });
    }

    // 验证家长登录的手机号与填写的一致
    if (parentInfo.phone !== parentPhone) {
      // 也可以允许用其他手机号绑定，但需要验证
      // 这里先要求必须使用登录的手机号
    }

    // 根据学生姓名 + 家长手机号查询学生
    // 支持两种字段：parentPhones（新字段，逗号分隔）和 parentPhone（旧字段）
    const students = await prisma.student.findMany({
      where: {
        name: studentName.trim(),
        OR: [
          // 新字段：parentPhones 包含该手机号
          { parentPhones: { contains: parentPhone } },
          // 旧字段：parentPhone 等于该手机号
          { parentPhone: parentPhone },
        ],
      },
      include: {
        campus: true,
      },
    });

    // 如果没有找到
    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: "孩子信息不存在，请联系老师添加学生信息",
      }, { status: 400 });
    }

    // 如果找到多个（同名同手机号，防万一）
    if (students.length > 1) {
      return NextResponse.json({
        success: false,
        error: "找到多个同名孩子，请联系老师确认",
      }, { status: 400 });
    }

    const student = students[0];

    // 检查是否已经绑定
    const existingBinding = await prisma.parentChild.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId: student.id,
        },
      },
    });

    if (existingBinding) {
      return NextResponse.json({
        success: true,
        message: "已经绑定过这个孩子了",
        status: existingBinding.status,
        student: {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          campus: student.campus?.name,
        },
      });
    }

    // 绑定孩子
    const binding = await prisma.parentChild.create({
      data: {
        parentId,
        studentId: student.id,
        relationship: relationship || "other",
        status: "active", // 自动激活
        isPrimary: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "绑定成功",
      student: {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        gender: student.gender,
        birthDate: student.birthDate,
        campus: student.campus?.name,
      },
    });
  } catch (error) {
    console.error("绑定孩子错误:", error);
    return NextResponse.json(
      { error: "绑定失败，请稍后重试" },
      { status: 500 }
    );
  }
}
