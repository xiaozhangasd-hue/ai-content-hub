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
 * 人脸检测API - 检测图片中的人脸并自动关联到学员
 */
export async function POST(request: NextRequest) {
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
    const { mediaId, autoMatch = true } = body;

    if (!mediaId) {
      return NextResponse.json({ error: "缺少媒体ID" }, { status: 400 });
    }

    // 查询媒体记录
    const media = await prisma.studentMedia.findUnique({
      where: { id: mediaId },
      include: {
        student: true,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "媒体不存在" }, { status: 404 });
    }

    if (media.type !== "photo") {
      return NextResponse.json({ error: "只支持图片类型" }, { status: 400 });
    }

    // 获取图片
    const imageBuffer = await storage.readFile({ fileKey: media.storageKey });
    const imageBase64 = imageBuffer.toString("base64");

    // 调用百度人脸检测
    const faces = await baiduFaceService.detectFace(imageBase64, {
      maxFaceNum: 10,
      faceField: "age,gender,expression,quality",
    });

    console.log(`检测到 ${faces.length} 张人脸`);

    // 更新媒体记录
    const updatedMedia = await prisma.studentMedia.update({
      where: { id: mediaId },
      data: {
        faceDetected: true,
        faceCount: faces.length,
        faceData: JSON.stringify(faces),
      },
    });

    // 自动匹配学员（如果开启了自动匹配且媒体未关联学员）
    let matchedStudents: any[] = [];
    
    if (autoMatch && faces.length > 0 && !media.studentId) {
      // 在人脸库中搜索
      for (const face of faces) {
        try {
          const matches = await baiduFaceService.searchFace(imageBase64, 3);
          
          for (const match of matches) {
            if (match.score >= 80 && match.userId) {
              // 找到匹配的学员
              const student = await prisma.student.findUnique({
                where: { id: match.userId },
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              });
              
              if (student) {
                matchedStudents.push({
                  student,
                  confidence: match.score / 100,
                  faceLocation: face.location,
                });
                
                // 保存匹配记录
                await prisma.mediaFaceMatch.create({
                  data: {
                    mediaId,
                    faceId: face.faceToken, // 临时使用faceToken
                    confidence: match.score / 100,
                    faceRect: JSON.stringify(face.location),
                  },
                });
              }
            }
          }
        } catch (searchError) {
          console.error("人脸搜索失败:", searchError);
        }
      }
      
      // 如果只匹配到一个学员，自动关联
      if (matchedStudents.length === 1) {
        await prisma.studentMedia.update({
          where: { id: mediaId },
          data: { studentId: matchedStudents[0].student.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mediaId,
        faceCount: faces.length,
        faces: faces.map(f => ({
          location: f.location,
          quality: f.quality,
          age: f.age,
          gender: f.gender,
        })),
        matchedStudents,
        autoLinked: matchedStudents.length === 1,
      },
    });
  } catch (error) {
    console.error("人脸检测错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "人脸检测失败" },
      { status: 500 }
    );
  }
}
