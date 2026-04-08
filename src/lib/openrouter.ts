import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }
): Promise<string> {
  try {
    const response = await axios.post<ChatCompletionResponse>(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model,
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 4096,
        stream: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000",
          "X-Title": "AI Content Hub",
        },
      }
    );

    return response.data.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("OpenRouter API调用错误:", error.message);
    if (error.response) {
      console.error("响应状态:", error.response.status);
      console.error("响应数据:", JSON.stringify(error.response.data, null, 2));
      
      // 提供更友好的错误信息
      if (error.response.status === 401) {
        throw new Error("API Key无效，请检查配置");
      } else if (error.response.status === 403) {
        throw new Error("API Key无权限访问该模型，请检查账户余额或模型权限");
      } else if (error.response.status === 429) {
        throw new Error("API调用频率超限，请稍后重试");
      }
    }
    throw error;
  }
}

// Claude 3.5 Sonnet 文案生成
// 如果Claude不可用，会自动降级到其他模型
export async function generateTextWithClaude(prompt: string): Promise<string> {
  const systemPrompt = `你是一位专业的教育培训行业文案撰写人，为教培机构撰写朋友圈招生文案。

【核心原则】
1. 语言规范：使用正常的中文表达，不生造词语，不用奇怪比喻
2. 结构清晰：分段+要点，方便阅读
3. 真实可信：用具体事实说话，不夸大不虚假
4. 简洁有力：控制在200字以内

【严禁事项】
- 不要使用emoji表情符号
- 不要使用英文单词或拼音
- 不要添加"--图片"、"--视频"等标记
- 不要使用"长出舌头"等奇怪比喻
- 不要使用空洞的形容词
- 不要超过200字

【文案风格】
像老师或校长在朋友圈发招生信息，真诚、专业、接地气。

请根据用户提供的机构信息撰写文案，直接输出内容，不要解释。`;

  // 尝试多个模型，按优先级排序
  const models = [
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku",
    "openai/gpt-4o-mini",
    "openai/gpt-3.5-turbo",
    "meta-llama/llama-3.1-8b-instruct",
  ];

  for (const model of models) {
    try {
      console.log(`尝试使用模型: ${model}`);
      let result = await callOpenRouter(
        model,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        { temperature: 0.7 }
      );
      
      // 清理输出
      result = result
        .replace(/<[^>]+>/g, '')  // 移除HTML标签
        .replace(/\[.*?\]/g, '')  // 移除方括号内容
        .replace(/[a-zA-Z]+/g, '')  // 移除英文单词
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[😀-🙏🚀-🛿]/gu, '')  // 移除emoji
        .replace(/✓|✅|❌|•|✦|★|☆/g, '')  // 移除特殊符号
        .replace(/--图片|--视频/g, '')  // 移除残留标记
        .replace(/\n{3,}/g, '\n\n')  // 合并多个换行
        .replace(/\s{2,}/g, ' ')  // 合并多个空格
        .trim();
      
      console.log(`模型 ${model} 调用成功`);
      return result;
    } catch (error: any) {
      console.log(`模型 ${model} 调用失败:`, error.message);
      if (model === models[models.length - 1]) {
        throw error;
      }
      continue;
    }
  }

  throw new Error("所有模型都调用失败");
}

// 使用LLM生成图片提示词（为后续图片生成准备）
export async function generateImagePrompt(description: string, style: string): Promise<string> {
  const systemPrompt = `你是一位AI绘画提示词专家。
你的任务是将用户的简单描述转换为详细的Midjourney风格提示词。

提示词要求：
1. 英文输出
2. 包含详细的场景描述、光线、色彩、构图等
3. 添加适当的风格关键词
4. 控制在200词以内

请直接输出提示词，不需要额外的解释。`;

  // 尝试多个模型
  const models = [
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku",
    "openai/gpt-4o-mini",
    "openai/gpt-3.5-turbo",
    "meta-llama/llama-3.1-8b-instruct",
  ];

  for (const model of models) {
    try {
      return await callOpenRouter(
        model,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请为以下描述生成Midjourney提示词：\n描述：${description}\n风格：${style}` },
        ],
        { temperature: 0.7 }
      );
    } catch (error: any) {
      console.log(`模型 ${model} 调用失败:`, error.message);
      if (model === models[models.length - 1]) {
        throw error;
      }
      continue;
    }
  }

  throw new Error("所有模型都调用失败");
}

// 使用LLM生成视频脚本
export async function generateVideoScript(description: string, duration: number): Promise<string> {
  const systemPrompt = `你是一位短视频脚本创作专家。
你的任务是根据描述创作适合${duration}秒短视频的脚本。

脚本要求：
1. 清晰的时间轴
2. 画面描述
3. 文案/旁白
4. 背景音乐建议

请以JSON格式输出，包含scenes数组。`;

  // 尝试多个模型
  const models = [
    "anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-haiku",
    "openai/gpt-4o-mini",
    "openai/gpt-3.5-turbo",
    "meta-llama/llama-3.1-8b-instruct",
  ];

  for (const model of models) {
    try {
      return await callOpenRouter(
        model,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请创作视频脚本：${description}` },
        ],
        { temperature: 0.7 }
      );
    } catch (error: any) {
      console.log(`模型 ${model} 调用失败:`, error.message);
      if (model === models[models.length - 1]) {
        throw error;
      }
      continue;
    }
  }

  throw new Error("所有模型都调用失败");
}
