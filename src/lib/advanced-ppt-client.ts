/**
 * 高级PPT生成引擎
 * 多模型协作：深度分析 + 内容设计 + 风格配图
 */

// 设计风格
export type DesignStyle = 
  | "playful" // 童趣活泼 - 适合幼儿课程
  | "modern" // 现代简约 - 适合商务培训
  | "creative" // 创意艺术 - 适合美术音乐
  | "tech" // 科技未来 - 适合编程科技
  | "elegant"; // 优雅精致 - 适合高端课程

// 内容分析结果
export interface ContentAnalysis {
  mainTopics: string[];
  keyPoints: string[];
  targetAudience: string;
  difficulty: string;
  suggestedStyle: DesignStyle;
}

// 视觉语言
export interface VisualLanguage {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  titleStyle: string;
  bodyStyle: string;
  imageStyle: string; // 图片生成风格提示词
}

// 幻灯片
export interface AdvancedSlide {
  id: number;
  type: "cover" | "agenda" | "content" | "highlight" | "story" | "interactive" | "summary" | "ending";
  title: string;
  subtitle?: string;
  content: string[];
  visual: {
    layout: "centered" | "split" | "grid" | "timeline" | "comparison" | "story";
    imageUrl?: string;
    imagePosition: "background" | "left" | "right" | "center";
    iconEmoji?: string;
  };
  narrative: {
    hook: string; // 开场钩子
    keyMessage: string; // 核心信息
    transition: string; // 过渡到下一页
  };
  teacherNote: string;
}

// PPT剧本
export interface AdvancedStoryboard {
  title: string;
  subtitle: string;
  theme: {
    style: DesignStyle;
    visual: VisualLanguage;
    mood: string; // 情感基调
  };
  narrative: {
    opening: string; // 开场白
    closing: string; // 结束语
    keyTakeaways: string[]; // 核心收获
  };
  slides: AdvancedSlide[];
  targetAudience: string;
  duration: string;
}

// API返回
export interface AdvancedPPTResult {
  success: boolean;
  storyboard?: AdvancedStoryboard;
  error?: string;
}

// 设计风格配置
const DESIGN_STYLES: Record<DesignStyle, VisualLanguage> = {
  playful: {
    primaryColor: "#FF6B9D",
    secondaryColor: "#FFB347",
    accentColor: "#87CEEB",
    fontFamily: "Comic Sans MS, cursive",
    titleStyle: "font-bold text-3xl text-white drop-shadow-lg",
    bodyStyle: "text-xl text-gray-700",
    imageStyle: "可爱卡通风格, 明亮色彩, 儿童插画, 高质量, 简洁干净",
  },
  modern: {
    primaryColor: "#2563EB",
    secondaryColor: "#3B82F6",
    accentColor: "#60A5FA",
    fontFamily: "Inter, sans-serif",
    titleStyle: "font-bold text-4xl text-white tracking-tight",
    bodyStyle: "text-lg text-gray-600",
    imageStyle: "现代简约风格, 商务专业, 高级感, 蓝色调, 极简设计",
  },
  creative: {
    primaryColor: "#8B5CF6",
    secondaryColor: "#EC4899",
    accentColor: "#F59E0B",
    fontFamily: "Georgia, serif",
    titleStyle: "font-bold text-4xl text-white italic",
    bodyStyle: "text-xl text-gray-700",
    imageStyle: "艺术创意风格, 水彩质感, 梦幻色彩, 高质量插画",
  },
  tech: {
    primaryColor: "#06B6D4",
    secondaryColor: "#0891B2",
    accentColor: "#22D3EE",
    fontFamily: "JetBrains Mono, monospace",
    titleStyle: "font-bold text-4xl text-cyan-400",
    bodyStyle: "text-lg text-gray-300",
    imageStyle: "科技未来感, 赛博朋克风格, 蓝色光效, 高科技, 3D渲染",
  },
  elegant: {
    primaryColor: "#1F2937",
    secondaryColor: "#374151",
    accentColor: "#D4AF37",
    fontFamily: "Playfair Display, serif",
    titleStyle: "font-bold text-4xl text-white elegant",
    bodyStyle: "text-xl text-gray-600",
    imageStyle: "优雅精致风格, 金色点缀, 高端商务, 奢华感, 高级质感",
  },
};

export class AdvancedPPTClient {
  private apiKey: string;
  private baseUrl = "https://dashscope.aliyuncs.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 第一步：深度分析文档内容
   */
  private async analyzeContent(content: string, courseType: string): Promise<{
    mainTopics: string[];
    keyPoints: string[];
    targetAudience: string;
    difficulty: string;
    suggestedStyle: DesignStyle;
  }> {
    const prompt = `请深入分析以下${courseType}内容，提取核心信息：

内容：
${content.slice(0, 4000)}

请以JSON格式返回：
{
  "mainTopics": ["主题1", "主题2"],
  "keyPoints": ["要点1", "要点2", "要点3"],
  "targetAudience": "目标学员描述",
  "difficulty": "难度级别",
  "suggestedStyle": "playful/modern/creative/tech/elegant之一"
}`;

    const response = await this.callQwen(prompt, 
      "你是一位资深的教育内容分析师。请深入分析课程内容，提取核心教学要素。直接输出JSON格式。");

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("[AdvancedPPT] 分析解析错误:", e);
    }

    // 默认返回
    return {
      mainTopics: [courseType],
      keyPoints: ["课程核心内容"],
      targetAudience: "学员",
      difficulty: "中等",
      suggestedStyle: "modern",
    };
  }

  /**
   * 第二步：设计叙事结构和分镜
   */
  private async designStoryboard(
    content: string,
    analysis: ContentAnalysis,
    style: DesignStyle
  ): Promise<{
    title: string;
    subtitle: string;
    mood: string;
    opening: string;
    closing: string;
    slides: Array<{
      type: AdvancedSlide["type"];
      title: string;
      content: string[];
      layout: AdvancedSlide["visual"]["layout"];
      imagePrompt: string;
      hook: string;
      keyMessage: string;
    }>;
  }> {
    const styleDesc = {
      playful: "童趣活泼，适合幼儿",
      modern: "现代简约，专业大气",
      creative: "创意艺术，富有想象力",
      tech: "科技未来，炫酷动感",
      elegant: "优雅精致，高端品质",
    }[style];

    const prompt = `你是一位顶级PPT设计师和教育专家。请为以下课程设计一个高级感的PPT分镜剧本。

课程内容：
${content.slice(0, 5000)}

分析结果：
- 主要主题：${analysis.mainTopics.join("、")}
- 核心要点：${analysis.keyPoints.join("、")}
- 目标学员：${analysis.targetAudience}
- 设计风格：${styleDesc}

要求：
1. 设计10-15页幻灯片，包含：封面、目录、内容页、互动页、总结页
2. 每页要有明确的叙事目的（不是简单堆砌文字）
3. 设计多样化的布局：居中、左右分栏、网格、时间轴、对比等
4. 为每页设计配图提示词，风格统一
5. 设计开场白和结束语，有情感共鸣

请以JSON格式返回：
{
  "title": "PPT标题",
  "subtitle": "副标题",
  "mood": "情感基调描述",
  "opening": "开场白（吸引注意力的话）",
  "closing": "结束语（令人印象深刻的话）",
  "slides": [
    {
      "type": "cover/agenda/content/highlight/story/interactive/summary/ending",
      "title": "页面标题",
      "content": ["要点1", "要点2"],
      "layout": "centered/split/grid/timeline/comparison/story",
      "imagePrompt": "配图描述（详细描述场景、元素、风格）",
      "hook": "开场钩子（引起兴趣的话）",
      "keyMessage": "核心信息（一句话总结）"
    }
  ]
}`;

    const response = await this.callQwen(prompt,
      "你是一位顶级的PPT设计师和教育叙事专家。设计出令人印象深刻的教学演示，而不是平庸的模板。直接输出JSON格式。");

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("[AdvancedPPT] 剧本解析错误:", e);
    }

    // 默认返回
    return {
      title: "课程标题",
      subtitle: "副标题",
      mood: "专业认真",
      opening: "欢迎来到今天的课程",
      closing: "感谢大家的参与",
      slides: [],
    };
  }

  /**
   * 第三步：生成风格统一的配图
   */
  private async generateImage(prompt: string, visualStyle: VisualLanguage): Promise<string | null> {
    try {
      const fullPrompt = `${prompt}, ${visualStyle.imageStyle}`;

      const submitResponse = await fetch(`${this.baseUrl}/api/v1/services/aigc/text2image/image-synthesis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "X-DashScope-Async": "enable",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "wanx-v1",
          input: { prompt: fullPrompt },
          parameters: { style: "<auto>", size: "1024*1024", n: 1 },
        }),
      });

      if (!submitResponse.ok) return null;

      const { output } = await submitResponse.json();
      const taskId = output?.task_id;
      if (!taskId) return null;

      // 轮询等待
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));

        const taskResponse = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
          headers: { "Authorization": `Bearer ${this.apiKey}` },
        });

        if (!taskResponse.ok) continue;

        const taskData = await taskResponse.json();
        const status = taskData.output?.task_status;

        if (status === "SUCCEEDED") {
          return taskData.output?.results?.[0]?.url || null;
        } else if (status === "FAILED") {
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("[AdvancedPPT] 图片生成错误:", error);
      return null;
    }
  }

  /**
   * 调用通义千问
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
   * 生成高级PPT
   */
  async generatePPT(
    content: string,
    options: {
      courseType?: string;
      targetAudience?: string;
      style?: DesignStyle;
      generateImages?: boolean;
    }
  ): Promise<AdvancedPPTResult> {
    try {
      const { courseType = "课程", generateImages = true } = options;

      console.log("[AdvancedPPT] 🎬 开始高级PPT生成流程...");

      // Step 1: 深度分析
      console.log("[AdvancedPPT] 📊 Step 1: 深度分析内容...");
      const analysis = await this.analyzeContent(content, courseType);
      console.log("[AdvancedPPT] 分析结果:", analysis);

      // Step 2: 确定设计风格
      const style = options.style || analysis.suggestedStyle;
      const visualStyle = DESIGN_STYLES[style];
      console.log("[AdvancedPPT] 🎨 Step 2: 确定设计风格:", style);

      // Step 3: 设计叙事结构
      console.log("[AdvancedPPT] 📝 Step 3: 设计叙事结构...");
      const storyboard = await this.designStoryboard(content, analysis, style);
      console.log("[AdvancedPPT] 剧本页数:", storyboard.slides.length);

      // Step 4: 并行生成配图
      const slides: AdvancedSlide[] = [];
      
      // 先并行生成所有图片（最多同时生成3张）
      const batchSize = 3;
      const imageUrls: (string | undefined)[] = new Array(storyboard.slides.length).fill(undefined);
      
      if (generateImages) {
        console.log(`[AdvancedPPT] 🖼️ Step 4: 并行生成${storyboard.slides.length}张配图...`);
        
        for (let i = 0; i < storyboard.slides.length; i += batchSize) {
          const batch = storyboard.slides.slice(i, i + batchSize);
          const batchPromises = batch.map((slideData, batchIndex) => {
            const slideIndex = i + batchIndex;
            if (slideData.imagePrompt) {
              console.log(`[AdvancedPPT] 生成第${slideIndex + 1}页配图...`);
              return this.generateImage(slideData.imagePrompt, visualStyle);
            }
            return Promise.resolve(null);
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((url, batchIndex) => {
            imageUrls[i + batchIndex] = url || undefined;
          });
        }
      }

      // 组装幻灯片
      for (let i = 0; i < storyboard.slides.length; i++) {
        const slideData = storyboard.slides[i];
        const imageUrl = imageUrls[i];

        slides.push({
          id: i + 1,
          type: slideData.type,
          title: slideData.title,
          content: slideData.content.slice(0, 5),
          visual: {
            layout: slideData.layout,
            imageUrl,
            imagePosition: this.getImagePosition(slideData.layout),
          },
          narrative: {
            hook: slideData.hook,
            keyMessage: slideData.keyMessage,
            transition: i < storyboard.slides.length - 1 ? "让我们继续..." : "",
          },
          teacherNote: `教学要点：${slideData.keyMessage}`,
        });
      }

      console.log("[AdvancedPPT] ✅ PPT生成完成！");

      return {
        success: true,
        storyboard: {
          title: storyboard.title,
          subtitle: storyboard.subtitle,
          theme: {
            style,
            visual: visualStyle,
            mood: storyboard.mood,
          },
          narrative: {
            opening: storyboard.opening,
            closing: storyboard.closing,
            keyTakeaways: analysis.keyPoints.slice(0, 3),
          },
          slides,
          targetAudience: analysis.targetAudience,
          duration: `${Math.ceil(slides.length * 2)}分钟`,
        },
      };
    } catch (error) {
      console.error("[AdvancedPPT] 生成错误:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "生成失败",
      };
    }
  }

  /**
   * 根据布局确定图片位置
   */
  private getImagePosition(layout: AdvancedSlide["visual"]["layout"]): AdvancedSlide["visual"]["imagePosition"] {
    switch (layout) {
      case "split":
        return "right";
      case "story":
        return "background";
      default:
        return "center";
    }
  }
}
