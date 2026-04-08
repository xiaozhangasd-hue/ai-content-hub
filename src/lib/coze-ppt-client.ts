/**
 * 扣子PPT生成客户端
 * 使用扣子的工作流API生成高质量PPT
 */

import { LLMClient, Config } from "coze-coding-dev-sdk";

// PPT生成结果
export interface CozePPTResult {
  success: boolean;
  pptUrl?: string; // 生成的PPT下载链接
  slides?: Array<{
    title: string;
    content: string[];
    imageUrl?: string;
  }>;
  error?: string;
}

export interface CozePPTOptions {
  courseType?: string;
  targetAudience?: string;
  style?: string;
}

export class CozePPTClient {
  private apiKey: string;
  private workflowId: string;
  private baseUrl: string = "https://api.coze.cn";

  constructor(apiKey: string, workflowId: string) {
    this.apiKey = apiKey;
    this.workflowId = workflowId;
  }

  /**
   * 使用扣子工作流生成PPT
   * 需要在扣子平台创建一个PPT生成工作流
   */
  async generatePPT(
    content: string,
    options: CozePPTOptions = {}
  ): Promise<CozePPTResult> {
    try {
      const { courseType = "通用课程", targetAudience = "学员", style = "现代简约" } = options;

      console.log("[CozePPT] 开始生成PPT...");

      // 方案1: 使用扣子工作流API
      // 需要在扣子平台创建一个PPT生成工作流
      const workflowResponse = await fetch(`${this.baseUrl}/v1/workflow/run`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_id: this.workflowId,
          parameters: {
            content,
            courseType,
            targetAudience,
            style,
          },
        }),
      });

      if (!workflowResponse.ok) {
        const errorData = await workflowResponse.json();
        console.error("[CozePPT] 工作流调用失败:", errorData);
        
        // 如果工作流不存在，降级到LLM生成方案
        return this.generatePPTWithLLM(content, options);
      }

      const workflowData = await workflowResponse.json();
      console.log("[CozePPT] 工作流执行结果:", workflowData);

      // 解析工作流输出
      if (workflowData.code === 0 && workflowData.data) {
        const output = workflowData.data;
        
        // 如果工作流直接返回PPT URL
        if (output.ppt_url || output.file_url) {
          return {
            success: true,
            pptUrl: output.ppt_url || output.file_url,
          };
        }

        // 如果返回结构化数据
        if (output.slides) {
          return {
            success: true,
            slides: output.slides,
          };
        }
      }

      // 降级到LLM方案
      return this.generatePPTWithLLM(content, options);
    } catch (error) {
      console.error("[CozePPT] 生成错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      };
    }
  }

  /**
   * 使用扣子LLM生成PPT内容（降级方案）
   * 使用扣子的OpenAI兼容接口，不需要Bot ID
   */
  async generatePPTWithLLM(
    content: string,
    options: CozePPTOptions
  ): Promise<CozePPTResult> {
    try {
      console.log("[CozePPT] 使用OpenAI兼容API生成PPT内容...");

      const { courseType = "通用课程", targetAudience = "学员" } = options;

      // 使用扣子的OpenAI兼容接口
      // 文档: https://www.coze.cn/docs/developer_guides/chat_v3
      const response = await fetch(`${this.baseUrl}/open_api/v2/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: `ppt-${Date.now()}`,
          bot_id: "74728282xxxx", // 需要替换为实际的Bot ID
          user_id: "ppt-user",
          stream: false,
          additional_messages: [
            {
              role: "user",
              content: `你是一位专业的PPT设计师。请为以下${courseType}设计一份PPT，目标学员是${targetAudience}。

课程内容：
${content.slice(0, 3000)}

要求：
1. 设计8-12页幻灯片
2. 第一页封面，最后一页总结
3. 每页3-5个要点
4. 直接输出JSON格式

输出格式：
{
  "title": "课程标题",
  "slides": [
    {"title": "页面标题", "content": ["要点1", "要点2"]}
  ]
}`,
              content_type: "text",
            },
          ],
        }),
      });

      // 如果扣子API失败，尝试使用豆包API（通过阿里云百炼）
      if (!response.ok) {
        console.log("[CozePPT] 扣子API失败，尝试使用豆包API...");
        return this.generatePPTWithDoubao(content, options);
      }

      const data = await response.json();
      console.log("[CozePPT] API响应:", JSON.stringify(data).slice(0, 500));

      // 解析响应
      const messages = data.messages || [];
      const assistantMsg = messages.find((m: any) => 
        m.role === "assistant" && m.type === "answer"
      );

      if (!assistantMsg?.content) {
        return this.generatePPTWithDoubao(content, options);
      }

      const responseText = assistantMsg.content;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return this.generatePPTWithDoubao(content, options);
      }

      const pptData = JSON.parse(jsonMatch[0]);
      console.log("[CozePPT] 成功生成", pptData.slides?.length, "页幻灯片");

      return {
        success: true,
        slides: pptData.slides || [],
      };
    } catch (error) {
      console.error("[CozePPT] LLM生成错误:", error);
      // 降级到豆包
      return this.generatePPTWithDoubao(content, options);
    }
  }

  /**
   * 使用豆包API生成PPT（最终降级方案）
   */
  private async generatePPTWithDoubao(
    content: string,
    options: CozePPTOptions
  ): Promise<CozePPTResult> {
    try {
      console.log("[CozePPT] 使用豆包API生成PPT...");

      const { courseType = "通用课程", targetAudience = "学员" } = options;
      const bailianKey = process.env.BAILIAN_API_KEY;

      if (!bailianKey) {
        return {
          success: false,
          error: "未配置扣子API Key或阿里云百炼API Key",
        };
      }

      // 使用阿里云百炼的通义千问
      const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bailianKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            {
              role: "system",
              content: "你是一位专业的PPT设计师。请根据课程内容设计PPT，直接输出JSON格式。",
            },
            {
              role: "user",
              content: `请为以下${courseType}设计一份PPT，目标学员是${targetAudience}。

课程内容：
${content.slice(0, 3000)}

要求：
1. 设计8-12页幻灯片
2. 第一页封面，最后一页总结
3. 每页3-5个要点

输出JSON格式：
{
  "title": "课程标题",
  "slides": [
    {"title": "页面标题", "content": ["要点1", "要点2"]}
  ]
}`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`豆包API调用失败: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || "";

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("无法解析JSON");
      }

      const pptData = JSON.parse(jsonMatch[0]);
      console.log("[CozePPT] 豆包成功生成", pptData.slides?.length, "页幻灯片");

      return {
        success: true,
        slides: pptData.slides || [],
      };
    } catch (error) {
      console.error("[CozePPT] 豆包生成错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      };
    }
  }

  /**
   * 使用扣子Bot生成PPT
   * 需要先在扣子平台创建一个PPT生成Bot
   */
  async generatePPTWithBot(
    botId: string,
    content: string,
    options: CozePPTOptions = {}
  ): Promise<CozePPTResult> {
    try {
      console.log("[CozePPT] 使用Bot生成PPT...");

      const { courseType = "通用课程", targetAudience = "学员" } = options;

      // 创建对话
      const chatResponse = await fetch(`${this.baseUrl}/v3/chat`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bot_id: botId,
          user_id: "ppt-user",
          stream: false,
          auto_save_history: true,
          additional_messages: [
            {
              role: "user",
              content: `请为以下${courseType}生成一份高质量的PPT，目标学员是${targetAudience}。\n\n课程内容：\n${content.slice(0, 4000)}`,
              content_type: "text",
            },
          ],
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Bot调用失败: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      
      // 提取回复内容
      const messages = chatData.messages || [];
      const assistantMessage = messages.find((m: any) => m.role === "assistant" && m.type === "answer");
      
      if (!assistantMessage) {
        throw new Error("Bot未返回有效回复");
      }

      // 检查是否有文件输出
      const fileMessage = messages.find((m: any) => m.type === "file");
      if (fileMessage?.content?.file_url) {
        return {
          success: true,
          pptUrl: fileMessage.content.file_url,
        };
      }

      // 解析文本回复
      const responseText = assistantMessage.content || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const pptData = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          slides: pptData.slides || [],
        };
      }

      return {
        success: false,
        error: "Bot返回内容格式错误",
      };
    } catch (error) {
      console.error("[CozePPT] Bot生成错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      };
    }
  }
}
