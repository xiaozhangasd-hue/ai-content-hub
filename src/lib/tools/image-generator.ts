/**
 * 图片生成工具
 * 使用可灵AI生成图片 - 专为教培机构设计，优先生成亚洲儿童面孔
 */

import { KlingAIClient } from '@/lib/kling-client';
import { S3Storage } from "coze-coding-dev-sdk";

interface ImageGenerationParams {
  prompt: string;
  style?: "cartoon" | "realistic" | "watercolor" | "sketch" | "anime" | "oil-painting";
  size?: "1024x1024" | "1280x720" | "720x1280" | "1920x1080";
  count?: number; // 生成数量，1-4张
}

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageUrls?: string[]; // 多图返回
  count?: number;
  error?: string;
  taskId?: string;
}

// 风格映射到英文提示词
const STYLE_PROMPTS: Record<string, string> = {
  cartoon: "cartoon style, colorful, friendly, suitable for children education, vibrant colors, Asian children characters",
  realistic: "realistic photography, professional lighting, high quality, detailed, Asian people only, no Western faces",
  watercolor: "watercolor painting style, soft colors, artistic, elegant, dreamy, Asian children",
  sketch: "pencil sketch style, hand drawn, artistic, simple lines, clean, Asian children",
  anime: "anime style, Japanese animation, vibrant, cute, detailed illustration, Asian characters, black hair, dark eyes",
  "oil-painting": "oil painting style, classic art, textured brushstrokes, rich colors, Asian children",
};

// 亚洲人面孔强制提示词 - 可灵是中国公司，对中文提示词理解更好
const ASIAN_FACE_PROMPT_CN = "亚洲儿童，中国儿童，黑头发，黑眼睛，中国面孔，不要欧美人，不要白人，不要金发";
const ASIAN_FACE_PROMPT_EN = "Asian children, Chinese children, black hair, dark brown eyes, Asian facial features, no Western faces, no blonde hair, no blue eyes, typical East Asian appearance";

// 尺寸映射到可灵的宽高比
const ASPECT_RATIO_MAP: Record<string, string> = {
  "1024x1024": "1:1",
  "1280x720": "16:9",
  "720x1280": "9:16",
  "1920x1080": "16:9",
  "1080x1920": "9:16",
};

export async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  const { prompt, style = "cartoon", size = "1024x1024", count = 1 } = params;

  // 限制数量
  const imageCount = Math.min(Math.max(count, 1), 4);

  // 构建完整的提示词 - 中英文混合，增强亚洲面孔识别
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.cartoon;
  
  // 可灵API是中国公司，中文提示词效果更好
  const fullPrompt = `${prompt}, ${ASIAN_FACE_PROMPT_CN}, ${stylePrompt}, ${ASIAN_FACE_PROMPT_EN}`;

  // 解析尺寸为宽高比
  const aspectRatio = ASPECT_RATIO_MAP[size] || "1:1";

  try {
    // 使用可灵AI生成图片
    const client = new KlingAIClient();
    
    // 提交图片生成任务
    const taskResult = await client.generateImage({
      prompt: fullPrompt,
      aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16",
      style: style === "cartoon" ? "cartoon" : style === "anime" ? "anime" : "random",
      negativePrompt: "Western faces, blonde hair, blue eyes, Caucasian, non-Asian, 欧美人, 白人, 金发",
    });

    if (taskResult.status === 'failed') {
      return {
        success: false,
        error: taskResult.error || '图片生成失败',
      };
    }

    const taskId = taskResult.taskId;

    // 轮询等待结果（最多等待2分钟）
    const maxWaitTime = 120000;
    const startTime = Date.now();
    const pollInterval = 3000;

    while (Date.now() - startTime < maxWaitTime) {
      const status = await client.getImageTaskStatus(taskId);
      
      if (status.status === 'succeed' && status.result?.videoUrl) {
        // 上传到对象存储
        const uploadedUrl = await uploadToStorage(status.result.videoUrl);
        const finalUrl = uploadedUrl || status.result.videoUrl;
        
        return {
          success: true,
          imageUrl: finalUrl,
          count: 1,
          taskId,
        };
      } else if (status.status === 'failed') {
        return {
          success: false,
          error: status.error || '图片生成失败',
          taskId,
        };
      }
      
      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      success: false,
      error: '图片生成超时，请稍后重试',
      taskId,
    };
  } catch (error) {
    console.error("可灵AI图片生成错误:", error);
    
    // 提供更友好的错误提示
    const errorMessage = error instanceof Error ? error.message : "图片生成失败";
    
    if (errorMessage.includes('Access Key') || errorMessage.includes('Secret Key')) {
      return {
        success: false,
        error: '请配置可灵AI的Access Key和Secret Key。前往 https://klingai.com/cn/dev 获取API密钥。',
      };
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return {
        success: false,
        error: 'API密钥无效或已过期，请检查可灵AI的Access Key和Secret Key配置。',
      };
    }
    
    if (errorMessage.includes('402') || errorMessage.includes('余额') || errorMessage.includes('资源')) {
      return {
        success: false,
        error: '可灵AI账户余额不足，请前往 https://klingai.com/cn 充值后重试。',
      };
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// 批量生成不同风格的图片
export async function generateMultipleStyles(
  prompt: string,
  styles: Array<"cartoon" | "realistic" | "watercolor" | "sketch"> = ["cartoon", "realistic"],
  size: "1024x1024" | "1280x720" | "720x1280" = "1024x1024"
): Promise<ImageGenerationResult> {
  // 串行生成，避免并发过多
  const results: string[] = [];
  
  for (const style of styles) {
    const result = await generateImage({ prompt, style, size, count: 1 });
    if (result.success && result.imageUrl) {
      results.push(result.imageUrl);
    }
    // 每次生成后等待1秒，避免频率限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (results.length > 0) {
    return {
      success: true,
      imageUrls: results,
      imageUrl: results[0],
      count: results.length,
    };
  }

  return {
    success: false,
    error: "所有风格生成均失败",
  };
}

// 上传图片到对象存储
async function uploadToStorage(imageUrl: string): Promise<string | null> {
  try {
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: "",
      secretKey: "",
      bucketName: process.env.COZE_BUCKET_NAME,
      region: process.env.COZE_BUCKET_REGION || "cn-beijing",
    });

    if (!process.env.COZE_BUCKET_ENDPOINT_URL || !process.env.COZE_BUCKET_NAME) {
      console.warn("S3 config missing, returning original URL");
      return null;
    }

    // 下载图片
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // 生成文件名
    const fileName = `assistant/images/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    // 上传
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: "image/png",
    });

    // 生成签名URL
    const signedUrl = await storage.generatePresignedUrl({
      key: key,
      expireTime: 86400 * 30, // 30天
    });

    return signedUrl;
  } catch (error) {
    console.error("Upload to storage error:", error);
    return null;
  }
}
