import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // 更新班级基本信息
    const classItem = await prisma.class.update({
      where: { id },
      data: {
        name: data.name || undefined,
        courseTemplateId: data.courseTemplateId || null,
        teacherId: data.teacherId || null,
        capacity: data.capacity || undefined,
        note: data.note || null,
      },
    });

    // 更新排课时间表
    if (data.schedules) {
      await prisma.schedule.deleteMany({ where: { classId: id } });
      await prisma.schedule.createMany({
        data: data.schedules.map((s: any) => ({
          classId: id,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          classroom: s.classroom || null,
        })),
      });
    }

    return NextResponse.json({ success: true, class: classItem });
  } catch (error) {
    console.error("更新班级错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.class.update({
      where: { id },
      data: { status: "ended" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除班级错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
