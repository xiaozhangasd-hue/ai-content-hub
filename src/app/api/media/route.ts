import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { S3Storage } from "coze-coding-dev-sdk";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 获取媒体列表
export async function GET(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchantId");
    const campusId = searchParams.get("campusId");
    const studentId = searchParams.get("studentId");
    const teacherId = searchParams.get("teacherId");
    const classId = searchParams.get("classId");
    const type = searchParams.get("type"); // photo/video
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    if (!merchantId) {
      return NextResponse.json({ error: "缺少商家ID" }, { status: 400 });
    }

    // 构建查询条件
    const where: any = {
      merchantId,
      status: "active",
    };

    if (campusId) where.campusId = campusId;
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (classId) where.classId = classId;
    if (type) where.type = type;
    
    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) where.recordDate.gte = new Date(startDate);
      if (endDate) where.recordDate.lte = new Date(endDate);
    }

    // 查询总数
    const total = await prisma.studentMedia.count({ where });

    // 查询列表
    const medias = await prisma.studentMedia.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        recordDate: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 为每个媒体生成预览URL
    const mediasWithUrl = await Promise.all(
      medias.map(async (media) => {
        try {
          const previewUrl = await storage.generatePresignedUrl({
            key: media.storageKey,
            expireTime: 3600,
          });
          return {
            ...media,
            previewUrl,
          };
        } catch (error) {
          console.error("生成预览URL失败:", media.id, error);
          return {
            ...media,
            previewUrl: null,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: mediasWithUrl,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("获取媒体列表错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取失败" },
      { status: 500 }
    );
  }
}

// 删除媒体
export async function DELETE(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json({ error: "缺少媒体ID" }, { status: 400 });
    }

    // 查询媒体记录
    const media = await prisma.studentMedia.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "媒体不存在" }, { status: 404 });
    }

    // 软删除（更新状态为deleted）
    await prisma.studentMedia.update({
      where: { id: mediaId },
      data: { status: "deleted" },
    });

    // TODO: 从对象存储删除文件（可以异步执行）

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除媒体错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 }
    );
  }
}

// 更新媒体信息
export async function PUT(request: NextRequest) {
  try {
    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已过期" }, { status: 401 });
    }

    const body = await request.json();
    const { mediaId, studentId, description, tags, isPublic } = body;

    if (!mediaId) {
      return NextResponse.json({ error: "缺少媒体ID" }, { status: 400 });
    }

    // 更新媒体
    const media = await prisma.studentMedia.update({
      where: { id: mediaId },
      data: {
        studentId,
        description,
        tags,
        isPublic,
      },
    });

    return NextResponse.json({
      success: true,
      media,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新媒体错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败" },
      { status: 500 }
    );
  }
}
