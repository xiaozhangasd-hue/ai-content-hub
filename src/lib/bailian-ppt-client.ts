/**
 * 阿里云百炼PPT生成客户端
 * 1. 通义千问生成内容
 * 2. 通义万相生成配图
 * 3. 返回完整PPT数据
 */

// PPT幻灯片
export interface PPTSlide {
  id: number;
  type: "cover" | "content" | "highlight" | "interactive" | "ending";
  title: string;
  subtitle?: string;
  content: string[];
  teacherNote?: string;
  interaction?: string;
  imageUrl?: string;
  bgColor?: string;
  accentColor?: string;
}

// PPT数据
export interface PPTStoryboard {
  title: string;
  subtitle?: string;
  targetAudience: string;
  duration: string;
  slides: PPTSlide[];
}

// API返回结果
export interface BailianPPTResult {
  success: boolean;
  storyboard?: PPTStoryboard;
  error?: string;
}

export class BailianPPTClient {
  private apiKey: string;
  private baseUrl = "https://dashscope.aliyuncs.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 调用通义千问生成文本
   */
  private async callQwen(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/compatible-mode/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`通义千问调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * 调用通义万相生成图片
   */
  private async generateImage(prompt: string): Promise<string | null> {
    try {
      // 提交任务
      const submitResponse = await fetch(`${this.baseUrl}/api/v1/services/aigc/text2image/image-synthesis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "X-DashScope-Async": "enable",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "wanx-v1",
          input: {
            prompt: `${prompt}, 可爱卡通风格, 明亮色彩, 高质量插画`,
          },
          parameters: {
            style: "<auto>",
            size: "1024*1024",
            n: 1,
          },
        }),
      });

      if (!submitResponse.ok) {
        console.error("[BailianPPT] 图片任务提交失败:", submitResponse.status);
        return null;
      }

      const submitData = await submitResponse.json();
      const taskId = submitData.output?.task_id;
      if (!taskId) {
        return null;
      }

      // 轮询等待结果
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000)); // 等待2秒

        const taskResponse = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
          },
        });

        if (!taskResponse.ok) continue;

        const taskData = await taskResponse.json();
        const status = taskData.output?.task_status;

        if (status === "SUCCEEDED") {
          return taskData.output?.results?.[0]?.url || null;
        } else if (status === "FAILED") {
          console.error("[BailianPPT] 图片生成失败:", taskData.output?.message);
          return null;
        }
      }

      console.error("[BailianPPT] 图片生成超时");
      return null;
    } catch (error) {
      console.error("[BailianPPT] 图片生成错误:", error);
      return null;
    }
  }

  /**
   * 生成完整PPT
   */
  async generatePPT(
    content: string,
    options: {
      courseType?: string;
      targetAudience?: string;
      generateImages?: boolean; // 是否生成配图
    }
  ): Promise<BailianPPTResult> {
    try {
      const { courseType = "通用课程", targetAudience = "学员", generateImages = true } = options;

      console.log("[BailianPPT] 开始生成PPT，课程类型:", courseType, "目标学员:", targetAudience);

      // 第一步：生成PPT大纲
      const outlinePrompt = `请根据以下课程内容，生成一份完整的PPT设计方案。

课程内容：
${content.slice(0, 6000)}

要求：
1. 设计8-12页幻灯片
2. 第一页是封面，最后一页是总结
3. 每页内容简洁，适合演示
4. 为每页设计配图描述（用于AI生图）

请直接输出JSON格式：
{
  "title": "PPT主标题",
  "subtitle": "副标题",
  "slides": [
    {
      "title": "页面标题",
      "content": ["要点1", "要点2", "要点3"],
      "imagePrompt": "配图描述（用于AI生成图片）"
    }
  ]
}`;

      const outlineText = await this.callQwen(outlinePrompt, 
        "你是一位专业的PPT设计师和教育专家。请根据课程内容设计精美的PPT方案，确保内容结构清晰、适合目标学员。直接输出JSON格式，不要有其他文字。");

      console.log("[BailianPPT] AI返回内容长度:", outlineText.length);

      // 解析JSON
      let pptData;
      try {
        const jsonMatch = outlineText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          pptData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("无法解析AI返回的JSON");
        }
      } catch (parseError) {
        console.error("[BailianPPT] JSON解析错误:", parseError);
        return { success: false, error: "AI返回内容格式错误，请重试" };
      }

      if (!pptData.slides || pptData.slides.length === 0) {
        return { success: false, error: "生成的内容为空" };
      }

      console.log("[BailianPPT] 成功生成", pptData.slides.length, "页幻灯片");

      // 第二步：为每页生成配图
      const slides: PPTSlide[] = [];
      const totalSlides = pptData.slides.length;

      for (let i = 0; i < totalSlides; i++) {
        const slide = pptData.slides[i];
        const type = this.getSlideType(i, totalSlides);
        const colors = this.generateGradient();

        let imageUrl: string | undefined;

        // 生成配图（如果启用）
        if (generateImages && slide.imagePrompt) {
          console.log(`[BailianPPT] 正在为第${i + 1}页生成配图...`);
          imageUrl = await this.generateImage(slide.imagePrompt) || undefined;
          if (imageUrl) {
            console.log(`[BailianPPT] 第${i + 1}页配图生成成功`);
          }
        }

        slides.push({
          id: i + 1,
          type,
          title: slide.title,
          subtitle: type === "cover" ? `面向${targetAudience}` : undefined,
          content: slide.content.slice(0, 5),
          teacherNote: `本页介绍${slide.title}，引导学生理解核心概念`,
          interaction: type === "interactive" ? "请思考：这些要点如何应用到实际场景中？" : undefined,
          imageUrl,
          bgColor: colors.bgColor,
          accentColor: colors.accentColor,
        });
      }

      return {
        success: true,
        storyboard: {
          title: pptData.title || `${courseType}课程`,
          subtitle: pptData.subtitle || `面向${targetAudience}`,
          targetAudience,
          duration: `${Math.ceil(totalSlides * 2)}分钟`,
          slides,
        },
      };
    } catch (error) {
      console.error("[BailianPPT] 生成错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      };
    }
  }

  /**
   * 根据索引确定幻灯片类型
   */
  private getSlideType(index: number, total: number): PPTSlide["type"] {
    if (index === 0) return "cover";
    if (index === total - 1) return "ending";
    if (index % 3 === 0) return "highlight";
    if (index % 5 === 4) return "interactive";
    return "content";
  }

  /**
   * 生成随机渐变色
   */
  private generateGradient(): { bgColor: string; accentColor: string } {
    const colors = [
      { bgColor: "#8B5CF6", accentColor: "#EC4899" },
      { bgColor: "#3B82F6", accentColor: "#06B6D4" },
      { bgColor: "#10B981", accentColor: "#34D399" },
      { bgColor: "#F59E0B", accentColor: "#F97316" },
      { bgColor: "#EF4444", accentColor: "#F87171" },
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
