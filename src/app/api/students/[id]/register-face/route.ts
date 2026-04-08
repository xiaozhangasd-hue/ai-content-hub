import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { S3Storage } from "coze-coding-dev-sdk";
import { baiduFaceService } from "@/lib/face-recognition";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 注册学员人脸 - 将学员照片注册到人脸库
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;
    
    // 查询学员
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "学员不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { mediaId, imageBase64 } = body;

    let base64Data = imageBase64;
    let storageKey = null;

    // 如果提供了mediaId，从媒体获取图片
    if (mediaId) {
      const media = await prisma.studentMedia.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        return NextResponse.json({ error: "媒体不存在" }, { status: 404 });
      }

      if (media.type !== "photo") {
        return NextResponse.json({ error: "只支持图片类型" }, { status: 400 });
      }

      const imageBuffer = await storage.readFile({ fileKey: media.storageKey });
      base64Data = imageBuffer.toString("base64");
      storageKey = media.storageKey;
    } else if (!imageBase64) {
      return NextResponse.json(
        { error: "请提供mediaId或imageBase64" },
        { status: 400 }
      );
    }

    // 检测人脸
    const faces = await baiduFaceService.detectFace(base64Data, {
      maxFaceNum: 1,
      faceField: "quality",
    });

    if (faces.length === 0) {
      return NextResponse.json({ error: "未检测到人脸" }, { status: 400 });
    }

    const face = faces[0];

    // 检查人脸质量
    if (face.quality < 30) {
      return NextResponse.json(
        { error: "人脸质量过低，请使用更清晰的照片" },
        { status: 400 }
      );
    }

    // 注册到百度人脸库
    const userInfo = JSON.stringify({
      name: student.name,
      studentId: student.id,
    });

    const result = await baiduFaceService.registerFace(
      base64Data,
      studentId,
      userInfo
    );

    console.log("人脸注册成功:", result.faceToken);

    // 保存到数据库
    const studentFace = await prisma.studentFace.create({
      data: {
        studentId,
        faceToken: result.faceToken,
        imageKey: storageKey || `base64_${Date.now()}`,
        quality: face.quality,
        status: "active",
      },
    });

    // 如果是从媒体注册的，更新媒体的学员关联
    if (mediaId) {
      await prisma.studentMedia.update({
        where: { id: mediaId },
        data: {
          studentId,
          faceDetected: true,
          faceCount: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        faceId: studentFace.id,
        faceToken: result.faceToken,
        quality: face.quality,
        student: {
          id: student.id,
          name: student.name,
        },
      },
      message: "人脸注册成功",
    });
  } catch (error) {
    console.error("人脸注册错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "人脸注册失败" },
      { status: 500 }
    );
  }
}

/**
 * 获取学员已注册的人脸列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;

    // 查询学员
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: "学员不存在" }, { status: 404 });
    }

    // 查询已注册的人脸
    const faces = await prisma.studentFace.findMany({
      where: {
        studentId,
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: faces,
    });
  } catch (error) {
    console.error("获取人脸列表错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取失败" },
      { status: 500 }
    );
  }
}

/**
 * 删除学员人脸
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;
    const { searchParams } = new URL(request.url);
    const faceId = searchParams.get("faceId");

    if (!faceId) {
      return NextResponse.json({ error: "缺少人脸ID" }, { status: 400 });
    }

    // 查询人脸记录
    const face = await prisma.studentFace.findUnique({
      where: { id: faceId },
    });

    if (!face || face.studentId !== studentId) {
      return NextResponse.json({ error: "人脸记录不存在" }, { status: 404 });
    }

    // 从百度人脸库删除
    try {
      await baiduFaceService.deleteFace(studentId, face.faceToken);
    } catch (baiduError) {
      console.error("从百度人脸库删除失败:", baiduError);
      // 继续删除本地记录
    }

    // 软删除本地记录
    await prisma.studentFace.update({
      where: { id: faceId },
      data: { status: "deleted" },
    });

    return NextResponse.json({
      success: true,
      message: "人脸删除成功",
    });
  } catch (error) {
    console.error("删除人脸错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除失败" },
      { status: 500 }
    );
  }
}
