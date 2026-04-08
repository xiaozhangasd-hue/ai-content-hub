/**
 * AI服务适配层
 * 支持多种AI服务：扣子(Coze)、DeepSeek、硅基流动等
 */

// AI服务提供商类型
export type AIProvider = 'coze' | 'deepseek' | 'siliconflow';

// AI配置
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  botId?: string; // 扣子Bot ID
}

// 聊天消息
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 聊天选项
export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  userId?: string;
}

// 获取AI配置
export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'coze') as AIProvider;
  
  switch (provider) {
    case 'coze':
      return {
        provider: 'coze',
        apiKey: process.env.COZE_API_KEY || process.env.COZE_PAT || '',
        baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn',
        botId: process.env.COZE_BOT_ID || '',
      };
    
    case 'deepseek':
      return {
        provider: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.AI_MODEL || 'deepseek-chat',
      };
    
    case 'siliconflow':
      return {
        provider: 'siliconflow',
        apiKey: process.env.SILICONFLOW_API_KEY || '',
        baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
        model: process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3',
      };
    
    default:
      return {
        provider: 'coze',
        apiKey: process.env.COZE_API_KEY || process.env.COZE_PAT || '',
        baseUrl: 'https://api.coze.cn',
        botId: process.env.COZE_BOT_ID || '',
      };
  }
}

// 创建AI客户端
export class AIClient {
  private config: AIConfig;

  constructor(config?: AIConfig) {
    this.config = config || getAIConfig();
  }

  // 扣子API对话（流式）
  private async *cozeChatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string> {
    const { userId = 'default_user' } = options;
    
    if (!this.config.apiKey) {
      throw new Error('请配置扣子API Key (COZE_API_KEY)');
    }
    
    if (!this.config.botId) {
      throw new Error('请配置扣子Bot ID (COZE_BOT_ID)');
    }

    // 将消息转换为扣子格式
    const additionalMessages = messages
      .filter(m => m.role !== 'system') // 扣子不支持system消息，由Bot配置决定
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
        content_type: 'text',
      }));

    try {
      const response = await fetch(`${this.config.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          bot_id: this.config.botId,
          user_id: userId,
          stream: true,
          auto_save_history: true,
          additional_messages: additionalMessages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('扣子API错误:', error);
        throw new Error(`扣子API请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data:')) {
            const data = trimmedLine.slice(5).trim();
            if (!data || data === '') continue;

            try {
              const parsed = JSON.parse(data);
              
              // 扣子v3 API事件类型
              if (parsed.event === 'conversation.message.delta') {
                // 流式内容增量
                const content = parsed.data?.content || '';
                if (content) {
                  yield content;
                }
              } else if (parsed.event === 'conversation.message.completed') {
                // 消息完成
                const content = parsed.data?.content || '';
                if (content) {
                  yield content;
                }
              } else if (parsed.event === 'error') {
                throw new Error(parsed.data?.msg || '扣子API返回错误');
              }
            } catch (parseError) {
              // 忽略解析错误，继续处理
              console.debug('解析扣子响应:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('扣子流式聊天错误:', error);
      throw error;
    }
  }

  // OpenAI兼容API对话（流式）
  private async *openaiChatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string> {
    const { temperature = 0.7, maxTokens = 2000 } = options;

    if (!this.config.apiKey) {
      throw new Error('请配置AI API Key');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI请求失败: ${response.status} ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('AI流式聊天错误:', error);
      throw error;
    }
  }

  // 统一的流式聊天接口
  async *chatStream(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string> {
    if (this.config.provider === 'coze') {
      yield* this.cozeChatStream(messages, options);
    } else {
      yield* this.openaiChatStream(messages, options);
    }
  }

  // 非流式聊天
  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    let fullContent = '';
    for await (const chunk of this.chatStream(messages, options)) {
      fullContent += chunk;
    }
    return fullContent;
  }

  // 创建流式响应（用于API）
  createStreamResponse(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Response {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const client = new AIClient();
        
        try {
          for await (const chunk of client.chatStream(messages, options)) {
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error('流式输出错误:', error);
          const errorMessage = error instanceof Error ? error.message : 'AI回复出错，请重试';
          const errorData = JSON.stringify({ error: errorMessage });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

// 导出默认客户端
export const aiClient = new AIClient();
