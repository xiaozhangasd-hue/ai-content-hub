import { NextRequest, NextResponse } from "next/server";
import { S3Storage } from "coze-coding-dev-sdk";

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

// 支持的文件类型
const ALLOWED_TYPES = {
  word: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword", // .doc
  ],
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
};

// 解析Word文档内容
async function parseWordDocument(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("解析Word文档失败:", error);
    throw new Error("无法解析Word文档");
  }
}

// 上传图片到对象存储并返回可访问URL
async function uploadImageToStorage(file: File): Promise<{ key: string; url: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 生成唯一文件名
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `course-images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  
  try {
    // 上传文件
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });
    
    // 生成签名URL（有效期1小时，足够AI识别）
    const url = await storage.generatePresignedUrl({
      key: key,
      expireTime: 3600,
    });
    
    console.log("图片上传成功:", key);
    return { key, url };
  } catch (error) {
    console.error("图片上传失败:", error);
    throw new Error("图片上传失败");
  }
}

// 识别图片内容（使用硅基流动的Qwen3-VL视觉模型）
async function recognizeImage(imageUrl: string): Promise<string> {
  try {
    console.log("开始图片识别，图片URL:", imageUrl.slice(0, 80) + "...");
    console.log("SILICONFLOW_API_KEY前缀:", process.env.SILICONFLOW_API_KEY?.slice(0, 10));
    
    // 使用硅基流动的Qwen3-VL视觉模型识别图片（使用URL方式）
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SILICONFLOW_API_KEY}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen3-VL-8B-Instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
              {
                type: "text",
                text: "请详细描述这张图片的内容。要求：1. 描述图片的主题、场景和主要内容 2. 列出图片中的关键元素和细节 3. 分析这张图片适合用于什么类型的课程或教学场景。请用中文回答，回答要详细具体。",
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("图片识别API错误:", response.status, errorText);
      throw new Error(`图片识别失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error("图片识别返回内容为空:", JSON.stringify(data));
      throw new Error("图片识别返回内容为空");
    }
    
    console.log("图片识别成功:", content.slice(0, 100));
    return content;
  } catch (error) {
    console.error("硅基流动图片识别失败:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    // 验证token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 检查文件类型
    const fileType = file.type;
    let parsedType = "";
    let content = "";

    if (ALLOWED_TYPES.word.includes(fileType)) {
      parsedType = "word";
      content = await parseWordDocument(file);
    } else if (ALLOWED_TYPES.image.includes(fileType)) {
      parsedType = "image";
      
      try {
        // 先上传图片到对象存储
        const { url } = await uploadImageToStorage(file);
        
        // 使用签名URL调用视觉API识别
        content = await recognizeImage(url);
      } catch (uploadError) {
        console.error("图片处理失败:", uploadError);
        // 如果上传或识别失败，返回提示信息
        content = `【图片文件】${file.name}\n\n图片识别服务暂时不可用，建议您在下方手动补充图片内容的详细描述，以便生成更准确的课程内容。`;
      }
    } else {
      return NextResponse.json(
        { error: "不支持的文件类型，请上传Word文档或图片" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      type: parsedType,
      fileName: file.name,
      content,
      message: parsedType === "word" ? "Word文档已解析" : "图片已识别",
    });
  } catch (error) {
    console.error("文件上传错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 500 }
    );
  }
}
