import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { generateImage, generateMultipleStyles } from "@/lib/tools/image-generator";
import { generatePPT } from "@/lib/tools/ppt-generator";
import { generateCopywriting } from "@/lib/tools/copywriting-generator";
import { generateAvatar, generateLipSync } from "@/lib/tools/avatar-generator";
import { generateTTS, AVAILABLE_VOICES, recommendVoice } from "@/lib/tools/tts-generator";
import { generateVideo, VIDEO_STYLES } from "@/lib/tools/video-generator";
import {
  generateIndustryPrompt,
  enhanceImagePrompt,
  enhanceCopywritingPrompt,
  getIndustryConfig,
} from "@/lib/prompt-templates/industry-prompts";

/**
 * 南都AI 智能助手 API - 升级版
 * 
 * 升级内容：
 * 1. 使用更强模型 doubao-seed-2-0-pro
 * 2. 集成行业专属知识库
 * 3. 双重生成模式：先生成详细描述，再调用工具
 * 4. 智能工具调用优化
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 基础系统提示词（核心身份）
const BASE_SYSTEM_PROMPT = `你是南都AI智能助手，专门为教培机构提供招生增长解决方案。

## 身份信息
- 产品名称：南都AI
- 出品方：帝都科技
- 目标用户：艺术类、体育类、科技类、学科类教培机构

## 核心能力

### 1. 文案生成 (copywriting) - 双重生成模式
生成各类招生文案，包括朋友圈、海报文案、活动宣传等。
**重要**：先生成详细的文案创作思路，再输出最终文案。

### 2. 图片生成 (image) - 双重生成模式
AI生成招生海报、课程卡片、活动宣传图等。
**重要**：先生成详细的画面描述（包含场景、人物、色彩、氛围），再调用图片生成。

### 3. PPT生成 (ppt)
智能分析内容，自动生成专业PPT。

### 4. 语音合成 (tts)
将文案转换为自然流畅的语音。

### 5. 数字人生成 (avatar)
生成AI数字人视频，用于课程介绍、机构宣传。

### 6. 视频生成 (video)
AI生成宣传视频，展示机构环境和课程亮点。

## 双重生成模式说明

为了生成更细腻、更专业的内容，请按以下流程操作：

### 图片生成流程
1. 先思考并描述画面的详细内容（用文字输出给用户看）
2. 再调用工具生成图片

**图片描述必须包含**：
- 画面主体：人物/物体的位置、动作、表情
- 场景环境：室内/室外、背景元素
- 色彩氛围：主色调、光线感觉
- 风格定位：卡通/写实/水彩等
- 情感表达：温馨/活力/专业等

### 文案生成流程
1. 先分析目标用户痛点
2. 构思文案框架和核心卖点
3. 再输出最终文案

## 工具调用格式

当需要调用工具时，请使用以下JSON格式（单独一行）：
\`\`\`tool
{
  "tool": "工具名称",
  "params": {
    // 工具参数
  }
}
\`\`\`

### 图片生成工具
\`\`\`tool
{
  "tool": "image",
  "params": {
    "prompt": "详细的图片描述（必须详细，包含主体、场景、氛围、色彩等）",
    "style": "cartoon|realistic|watercolor|sketch|anime|oil-painting",
    "size": "1024x1024|1280x720|720x1280",
    "count": 1-4
  }
}
\`\`\`

**重要提示**：
- 图片描述必须详细、具体
- 人物形象应该是亚洲人面孔
- 避免使用模糊的描述词

### 多风格批量生成
\`\`\`tool
{
  "tool": "image-batch",
  "params": {
    "prompt": "图片描述",
    "styles": ["cartoon", "realistic", "watercolor"],
    "size": "1024x1024"
  }
}
\`\`\`

### PPT生成工具
\`\`\`tool
{
  "tool": "ppt",
  "params": {
    "title": "PPT标题",
    "content": "内容大纲或详细内容（按章节分行）",
    "theme": "education-blue|business|creative|minimal"
  }
}
\`\`\`

### 文案生成工具
\`\`\`tool
{
  "tool": "copywriting",
  "params": {
    "type": "poster|moment|activity|course",
    "subject": "科目",
    "target": "目标人群",
    "keyPoints": ["要点1", "要点2", "要点3"],
    "tone": "专业/温馨/活力/励志",
    "length": "短/中/长"
  }
}
\`\`\`

### 语音合成工具
\`\`\`tool
{
  "tool": "tts",
  "params": {
    "text": "要合成的文本（最多500字）",
    "voiceId": "female-tianmei|male-qingxin|female-zhixin|male-chenshu",
    "speed": 1.0
  }
}
\`\`\`

### 数字人生成工具
\`\`\`tool
{
  "tool": "avatar",
  "params": {
    "text": "数字人要说的内容",
    "model": "v1|v2"
  }
}
\`\`\`

### 视频生成工具
\`\`\`tool
{
  "tool": "video",
  "params": {
    "prompt": "视频画面描述（详细描述场景、动作、转场）",
    "duration": 5,
    "aspectRatio": "16:9|9:16|1:1"
  }
}
\`\`\`

## 对话风格
- 专业但亲切，像一位资深招生顾问
- 先理解需求，再给出方案
- 生成前先思考，输出详细描述
- 提供多种选项让用户选择
- 生成结果后主动询问是否需要调整`;

// 构建完整的系统提示词
function buildSystemPrompt(
  merchantInfo?: {
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
    category?: string;
    subjects?: string[];
    targetAge?: string;
    features?: string[];
    slogan?: string;
    philosophy?: string;
    brandStyle?: string;
  },
  industry?: string
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // 添加行业专属知识
  if (industry) {
    const industryConfig = getIndustryConfig(industry);
    prompt += generateIndustryPrompt(industry);
  }

  // 添加机构信息
  if (merchantInfo && merchantInfo.name) {
    prompt += "\n\n## 当前机构信息\n\n";
    prompt += `用户已配置的机构信息如下：\n`;
    prompt += `- 机构名称：${merchantInfo.name}`;

    if (merchantInfo.city) prompt += `\n- 所在城市：${merchantInfo.city}`;
    if (merchantInfo.address) prompt += `\n- 地址：${merchantInfo.address}`;
    if (merchantInfo.phone) prompt += `\n- 联系电话：${merchantInfo.phone}`;
    if (merchantInfo.category) prompt += `\n- 行业分类：${merchantInfo.category}`;
    if (merchantInfo.subjects && merchantInfo.subjects.length > 0) {
      prompt += `\n- 开设课程：${merchantInfo.subjects.join("、")}`;
    }
    if (merchantInfo.targetAge) prompt += `\n- 目标年龄段：${merchantInfo.targetAge}`;
    if (merchantInfo.features && merchantInfo.features.length > 0) {
      prompt += `\n- 特色优势：${merchantInfo.features.join("、")}`;
    }
    if (merchantInfo.slogan) prompt += `\n- 企业标语：${merchantInfo.slogan}`;
    if (merchantInfo.philosophy) prompt += `\n- 教育理念：${merchantInfo.philosophy}`;
    if (merchantInfo.brandStyle) prompt += `\n- 品牌调性：${merchantInfo.brandStyle}`;

    prompt += `\n\n**重要**：在生成任何内容时，请自动使用上述机构信息，不要再次询问已配置的信息。`;
  }

  return prompt;
}

// 工具处理器映射
const TOOL_HANDLERS: Record<string, (params: any, context?: any) => Promise<any>> = {
  image: (params, context) => {
    // 增强图片提示词
    const enhancedPrompt = context?.industry
      ? enhanceImagePrompt(params.prompt, context.industry, params.style)
      : params.prompt;
    return generateImage({ ...params, prompt: enhancedPrompt });
  },
  "image-batch": (params, context) => {
    const enhancedPrompt = context?.industry
      ? enhanceImagePrompt(params.prompt, context.industry)
      : params.prompt;
    return generateMultipleStyles(enhancedPrompt, params.styles, params.size);
  },
  ppt: generatePPT,
  copywriting: (params, context) => {
    // 增强文案生成
    return generateCopywriting({
      ...params,
      industry: context?.industry,
      merchantName: context?.merchantName,
    });
  },
  tts: generateTTS,
  avatar: generateAvatar,
  lipsync: generateLipSync,
  video: generateVideo,
};

// 解析工具调用
function parseToolCall(content: string): Array<{ tool: string; params: any }> {
  const results: Array<{ tool: string; params: any }> = [];
  const regex = /```tool\s*\n?([\s\S]*?)\n?```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    try {
      const toolData = JSON.parse(match[1]);
      results.push(toolData);
    } catch {
      // 忽略解析错误
    }
  }

  return results;
}

// 工具上下文
interface ToolContext {
  industry?: string;
  merchantName?: string;
  subjects?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, conversationId, merchantInfo, attachments } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "请提供消息内容" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建LLM客户端
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 确定行业
    const industry = merchantInfo?.category || "other";

    // 构建系统提示词
    let systemPrompt = buildSystemPrompt(merchantInfo, industry);

    // 工具上下文
    const toolContext: ToolContext = {
      industry,
      merchantName: merchantInfo?.name,
      subjects: merchantInfo?.subjects,
    };

    // 如果有文件附件
    if (attachments && attachments.length > 0) {
      const fileDescriptions = attachments.map((f: any) => {
        if (f.category === "image") {
          return `- 图片文件「${f.name}」: 用户上传了一张图片，请分析图片内容并回答用户问题`;
        } else if (f.category === "pdf") {
          return `- PDF文件「${f.name}」: ${f.extractedContent?.slice(0, 3000) || "PDF内容已提取"}`;
        } else if (f.category === "document") {
          return `- 文档文件「${f.name}」: ${f.extractedContent?.slice(0, 3000) || "文档已上传"}`;
        } else if (f.category === "spreadsheet") {
          return `- 表格文件「${f.name}」: ${f.extractedContent?.slice(0, 3000) || "表格数据已提取"}`;
        } else {
          return `- 文件「${f.name}」: ${f.extractedContent || "文件已上传"}`;
        }
      });

      systemPrompt += `\n\n## 用户上传的文件\n\n用户上传了以下文件，请根据文件内容回答问题或执行操作：\n${fileDescriptions.join("\n")}\n\n**重要提示**：\n- 如果用户要求"生成PPT"或"根据文档生成PPT"，请提取文件中的关键内容，使用ppt工具生成\n- 如果用户上传的是图片并要求分析，请描述图片内容\n- 如果用户上传的是文档，请根据文档内容执行相应操作\n- 表格数据请帮助分析和整理`;
    }

    // 构建消息
    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string | any[] }) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      })),
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";
        let processedTools = new Set<string>();

        try {
          // 使用更强模型 - doubao-seed-2-0-pro
          const llmStream = client.stream(llmMessages, {
            model: "doubao-seed-2-0-pro-260215", // 升级为旗舰模型
            temperature: 0.7,
          });

          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;

              // 发送文本内容
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`)
              );
            }
          }

          // 解析并处理工具调用
          const toolCalls = parseToolCall(fullContent);

          for (const toolCall of toolCalls) {
            const toolKey = `${toolCall.tool}-${JSON.stringify(toolCall.params)}`;
            if (processedTools.has(toolKey)) continue;
            processedTools.add(toolKey);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "tool_start", tool: toolCall.tool })}\n\n`
              )
            );

            const handler = TOOL_HANDLERS[toolCall.tool];
            if (handler) {
              try {
                // 传入上下文
                const result = await handler(toolCall.params, toolContext);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_result",
                      tool: toolCall.tool,
                      result,
                    })}\n\n`
                  )
                );
              } catch (error) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool_error",
                      tool: toolCall.tool,
                      error: error instanceof Error ? error.message : "工具调用失败",
                    })}\n\n`
                  )
                );
              }
            } else {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "tool_error",
                    tool: toolCall.tool,
                    error: "未知的工具类型",
                  })}\n\n`
                )
              );
            }
          }

          // 发送完成信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : "生成失败",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "服务错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 获取可用工具列表
export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      model: "doubao-seed-2-0-pro-260215",
      features: [
        "双重生成模式 - 先思考再输出",
        "行业专属知识库 - 精准话术",
        "智能图片描述 - 更细腻的画面",
        "智能文案生成 - 更专业的表达",
      ],
      tools: [
        {
          id: "image",
          name: "图片生成",
          description: "AI生成招生海报、课程卡片等（双重生成模式）",
          params: {
            prompt: { type: "string", required: true, description: "详细的图片描述" },
            style: {
              type: "string",
              enum: ["cartoon", "realistic", "watercolor", "sketch", "anime", "oil-painting"],
              default: "cartoon",
            },
            size: {
              type: "string",
              enum: ["1024x1024", "1280x720", "720x1280"],
              default: "1024x1024",
            },
            count: { type: "number", min: 1, max: 4, default: 1 },
          },
        },
        {
          id: "ppt",
          name: "PPT生成",
          description: "智能分析内容生成专业PPT",
          params: {
            title: { type: "string", required: true, description: "PPT标题" },
            content: { type: "string", required: true, description: "内容大纲" },
            theme: {
              type: "string",
              enum: ["education-blue", "business", "creative", "minimal"],
              default: "education-blue",
            },
          },
        },
        {
          id: "copywriting",
          name: "文案生成",
          description: "生成招生文案、朋友圈内容等（双重生成模式）",
          params: {
            type: {
              type: "string",
              enum: ["poster", "moment", "activity", "course"],
              required: true,
            },
            subject: { type: "string", description: "科目" },
            target: { type: "string", description: "目标人群" },
            keyPoints: { type: "array", description: "核心要点" },
            tone: { type: "string", description: "语气风格" },
            length: { type: "string", enum: ["短", "中", "长"], default: "中" },
          },
        },
        {
          id: "tts",
          name: "语音合成",
          description: "将文本转换为自然语音",
          params: {
            text: { type: "string", required: true, maxLength: 500 },
            voiceId: {
              type: "string",
              enum: AVAILABLE_VOICES.map((v) => v.id),
              default: "female-tianmei",
            },
            speed: { type: "number", min: 0.5, max: 2, default: 1 },
          },
        },
        {
          id: "avatar",
          name: "数字人生成",
          description: "生成AI数字人视频",
          params: {
            text: { type: "string", required: true, description: "数字人要说的内容" },
            model: { type: "string", enum: ["v1", "v2"], default: "v2" },
          },
        },
        {
          id: "video",
          name: "视频生成",
          description: "AI生成宣传视频",
          params: {
            prompt: { type: "string", required: true, description: "视频画面描述" },
            duration: { type: "number", min: 5, max: 10, default: 5 },
            aspectRatio: { type: "string", enum: ["16:9", "9:16", "1:1"], default: "16:9" },
          },
        },
      ],
      voices: AVAILABLE_VOICES,
      videoStyles: VIDEO_STYLES,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
