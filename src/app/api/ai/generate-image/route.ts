import { NextRequest, NextResponse } from "next/server";
import { KlingAIClient } from "@/lib/kling-client";
import { S3Storage } from "coze-coding-dev-sdk";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 图片生成API - 使用可灵AI
 * POST /api/ai/generate-image
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, size = "1024x1024", style = "cartoon" } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入提示词" }, { status: 400 });
    }

    // 检查可灵API配置
    if (!process.env.KLING_ACCESS_KEY || !process.env.KLING_SECRET_KEY) {
      return NextResponse.json(
        { error: "请配置可灵AI的Access Key和Secret Key" },
        { status: 500 }
      );
    }

    // 亚洲人面孔强制提示词
    const asianFacePrompt = "亚洲儿童，中国儿童，黑头发，黑眼睛，中国面孔，不要欧美人，不要白人，不要金发, Asian children, Chinese children, black hair, dark brown eyes, Asian facial features, no Western faces";
    
    // 风格提示词
    const stylePrompts: Record<string, string> = {
      cartoon: "cartoon style, colorful, friendly, suitable for children education",
      realistic: "realistic photography, professional lighting, high quality",
      watercolor: "watercolor painting style, soft colors, artistic, elegant",
      sketch: "pencil sketch style, hand drawn, artistic",
      anime: "anime style, Japanese animation, vibrant, cute",
      "oil-painting": "oil painting style, classic art, textured brushstrokes",
    };

    const stylePrompt = stylePrompts[style] || stylePrompts.cartoon;
    
    // 构建完整提示词
    const fullPrompt = `${prompt}, ${stylePrompt}, ${asianFacePrompt}`;

    // 尺寸映射
    const aspectRatioMap: Record<string, string> = {
      "1024x1024": "1:1",
      "1280x720": "16:9",
      "720x1280": "9:16",
      "1920x1080": "16:9",
      "2K": "1:1",
    };
    const aspectRatio = aspectRatioMap[size] || "1:1";

    // 使用可灵AI生成
    const client = new KlingAIClient();
    
    const taskResult = await client.generateImage({
      prompt: fullPrompt,
      aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16",
      style: style === "cartoon" ? "cartoon" : style === "anime" ? "anime" : "random",
      negativePrompt: "Western faces, blonde hair, blue eyes, Caucasian, non-Asian, 欧美人, 白人, 金发",
    });

    if (taskResult.status === 'failed') {
      return NextResponse.json(
        { error: taskResult.error || '图片生成失败' },
        { status: 500 }
      );
    }

    // 轮询等待结果
    const maxWaitTime = 120000; // 2分钟
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < maxWaitTime) {
      const status = await client.getImageTaskStatus(taskResult.taskId);
      
      if (status.status === 'succeed' && status.result?.videoUrl) {
        // 上传到对象存储
        let finalUrl = status.result.videoUrl;
        
        try {
          const imageResponse = await fetch(status.result.videoUrl);
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const fileName = `generated-images/${Date.now()}_${Math.random().toString(36).slice(2)}.png`;
          
          const storageKey = await storage.uploadFile({
            fileContent: imageBuffer,
            fileName,
            contentType: "image/png",
          });
          
          finalUrl = await storage.generatePresignedUrl({
            key: storageKey,
            expireTime: 86400 * 30,
          });
        } catch (uploadError) {
          console.warn("上传对象存储失败，使用原始URL:", uploadError);
        }

        return NextResponse.json({
          success: true,
          imageUrl: finalUrl,
          taskId: taskResult.taskId,
        });
      } else if (status.status === 'failed') {
        return NextResponse.json(
          { error: status.error || '图片生成失败' },
          { status: 500 }
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return NextResponse.json(
      { error: '图片生成超时，请稍后重试' },
      { status: 500 }
    );
  } catch (error) {
    console.error("图片生成错误:", error);
    
    const errorMessage = error instanceof Error ? error.message : "图片生成失败";
    
    if (errorMessage.includes('Access Key') || errorMessage.includes('Secret Key')) {
      return NextResponse.json(
        { error: '请配置可灵AI的API密钥。前往 https://klingai.com/cn/dev 获取。' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
