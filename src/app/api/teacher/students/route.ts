import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ParentInfo {
  name: string;
  relationship: string;
  phone: string;
}

/**
 * 获取学员列表
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const merchantId = payload.merchantId;
    const teacherId = payload.teacherId;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    // 获取老师所教班级
    const teacherClasses = await prisma.class.findMany({
      where: { teacherId, merchantId },
      select: { id: true, name: true },
    });
    const classIds = teacherClasses.map((c) => c.id);

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      });
    }

    // 查询学员
    const whereClause: Record<string, unknown> = {
      merchantId,
      enrollments: {
        some: {
          classId: { in: classIds },
          status: "active",
        },
      },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { parentPhone: { contains: search } },
        { parentPhones: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        include: {
          enrollments: {
            where: { status: "active" },
            include: {
              class: { select: { id: true, name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.student.count({ where: whereClause }),
    ]);

    // 获取考勤统计
    const result = await Promise.all(
      students.map(async (student) => {
        const attendances = await prisma.attendance.findMany({
          where: { studentId: student.id },
        });

        const total = attendances.length;
        const present = attendances.filter((a) => a.status === "present").length;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        return {
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          gender: student.gender,
          birthDate: student.birthDate,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentPhones: student.parentPhones,
          classes: student.enrollments.map((e) => ({
            id: e.class.id,
            name: e.class.name,
            remainingHours: e.remainingHours,
            totalHours: e.totalHours,
          })),
          totalRemainingHours: student.enrollments.reduce(
            (sum, e) => sum + e.remainingHours,
            0
          ),
          totalHours: student.enrollments.reduce((sum, e) => sum + e.totalHours, 0),
          attendance: {
            total,
            present,
            absent: attendances.filter((a) => a.status === "absent").length,
            leave: attendances.filter((a) => a.status === "leave").length,
            rate,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取学员列表错误:", error);
    return NextResponse.json({ error: "获取学员列表失败" }, { status: 500 });
  }
}

/**
 * 添加学员
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || !payload.merchantId) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const merchantId = payload.merchantId;
    const body = await request.json();
    
    const { 
      name, 
      gender = "male", 
      birthDate, 
      phone, 
      classId, 
      note,
      parents = [] 
    } = body;

    // 验证必填字段
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入学员姓名" }, { status: 400 });
    }

    // 验证家长信息
    const validParents: ParentInfo[] = parents.filter(
      (p: ParentInfo) => p.phone && p.phone.trim()
    );
    
    if (validParents.length === 0) {
      return NextResponse.json({ error: "请至少填写一个家长的手机号" }, { status: 400 });
    }

    // 合并所有家长手机号
    const parentPhones = validParents.map((p: ParentInfo) => p.phone).join(",");

    // 获取第一个家长作为主要联系人（兼容旧数据）
    const primaryParent = validParents[0];

    // 创建学员
    const student = await prisma.student.create({
      data: {
        merchantId,
        campusId: payload.campusId || null,
        name: name.trim(),
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone || null,
        parentName: primaryParent?.name || null,
        parentPhone: primaryParent?.phone || null,
        parentPhones,
        note: note || null,
      },
    });

    // 如果指定了班级，创建 enrollment
    if (classId) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId,
          remainingHours: 0,
          totalHours: 0,
          status: "active",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        gender: student.gender,
        birthDate: student.birthDate,
        parentPhones: student.parentPhones,
        parents: validParents,
      },
    });
  } catch (error) {
    console.error("添加学员错误:", error);
    return NextResponse.json({ error: "添加学员失败" }, { status: 500 });
  }
}
