import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";

/**
 * 小程序家长登录
 * POST /api/mini/auth/login
 * 
 * 支持验证码登录
 */
export async function POST(request: NextRequest) {
  try {
    const { phone, code, openid } = await request.json();

    // 验证手机号
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "请输入正确的手机号" },
        { status: 400 }
      );
    }

    // 验证验证码
    if (!code) {
      return NextResponse.json(
        { error: "请输入验证码" },
        { status: 400 }
      );
    }

    // 查询验证码
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      return NextResponse.json(
        { error: "验证码错误或已过期" },
        { status: 400 }
      );
    }

    // 删除已使用的验证码
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    // 查找或创建家长账号
    let parent = await prisma.parent.findUnique({
      where: { phone },
      include: {
        children: {
          where: { status: "active" },
          include: {
            student: {
              include: {
                campus: true,
                enrollments: {
                  where: { status: "active" },
                  include: {
                    class: {
                      include: {
                        courseTemplate: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      // 创建新家长账号
      parent = await prisma.parent.create({
        data: {
          phone,
          openid: openid || null,
        },
        include: {
          children: {
            where: { status: "active" },
            include: {
              student: {
                include: {
                  campus: true,
                  enrollments: {
                    where: { status: "active" },
                    include: {
                      class: {
                        include: {
                          courseTemplate: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else if (openid && !parent.openid) {
      // 更新 openid
      await prisma.parent.update({
        where: { id: parent.id },
        data: { openid, lastLogin: new Date() },
      });
    } else {
      // 更新最后登录时间
      await prisma.parent.update({
        where: { id: parent.id },
        data: { lastLogin: new Date() },
      });
    }

    // 尝试通过手机号自动关联孩子（如果孩子的家长电话匹配）
    if (parent.children.length === 0) {
      const matchingStudents = await prisma.student.findMany({
        where: {
          parentPhone: phone,
        },
        include: {
          campus: true,
          enrollments: {
            where: { status: "active" },
            include: {
              class: {
                include: {
                  courseTemplate: true,
                },
              },
            },
          },
        },
      });

      if (matchingStudents.length > 0) {
        // 检查是否已存在绑定关系
        const existingBindings = await prisma.parentChild.findMany({
          where: {
            parentId: parent!.id,
            studentId: { in: matchingStudents.map((s) => s.id) },
          },
        });

        const existingStudentIds = new Set(existingBindings.map((b) => b.studentId));
        const newBindings = matchingStudents.filter((s) => !existingStudentIds.has(s.id));

        if (newBindings.length > 0) {
          // 自动关联孩子
          await prisma.parentChild.createMany({
            data: newBindings.map((student) => ({
              parentId: parent!.id,
              studentId: student.id,
              relationship: "other",
              status: "active",
              isPrimary: true,
            })),
          });
        }

        // 重新获取家长信息
        parent = await prisma.parent.findUnique({
          where: { id: parent.id },
          include: {
            children: {
              where: { status: "active" },
              include: {
                student: {
                  include: {
                    campus: true,
                    enrollments: {
                      where: { status: "active" },
                      include: {
                        class: {
                          include: {
                            courseTemplate: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })!;
      }
    }

    // 生成 JWT Token
    const token = generateToken({
      parentId: parent!.id,
      phone: parent!.phone,
      role: "parent",
    });

    // 构建返回的孩子信息
    const children = parent!.children.map((pc) => ({
      id: pc.student.id,
      name: pc.student.name,
      avatar: pc.student.avatar,
      birthDate: pc.student.birthDate,
      gender: pc.student.gender,
      campus: pc.student.campus?.name,
      relationship: pc.relationship,
      isPrimary: pc.isPrimary,
    }));

    // 检查是否需要绑定孩子
    const bindChildRequired = children.length === 0;

    return NextResponse.json({
      success: true,
      token,
      role: "parent",
      user: {
        id: parent!.id,
        phone: parent!.phone,
        name: parent!.name,
        avatar: parent!.avatar,
      },
      children,
      bindChildRequired,
    });
  } catch (error) {
    console.error("小程序登录错误:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
