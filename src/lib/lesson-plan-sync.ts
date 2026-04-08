/**
 * 教案同步专家
 * 当PPT结构变化时，自动生成/更新配套的教学教案
 */

// ==================== 类型定义 ====================

export interface PPTChange {
  added?: Array<{
    id: string;
    title: string;
    type: string;
    content?: string[];
  }>;
  modified?: Array<{
    id: string;
    oldTitle: string;
    newTitle: string;
    content?: string[];
  }>;
  deleted?: Array<{
    id: string;
    title: string;
  }>;
  reordered?: number[];
}

export interface CourseContext {
  courseType: string;
  targetAudience: string;
  totalDuration: string;
}

export interface LessonSection {
  id: string;
  title: string;
  duration: string;
  linkedPageId: string;
  status?: "new" | "modified" | "deleted";
  objectives: string;
  script: string;
  interaction: string;
  teachingTips?: string;
  materials?: string[];
}

export interface LessonPlan {
  title: string;
  courseType: string;
  targetAudience: string;
  sections: LessonSection[];
  totalDuration: string;
  summary?: {
    addedSections: number;
    modifiedSections: number;
    deletedSections: number;
  };
}

export interface SyncResult {
  updatedLessonPlan: LessonPlan;
  upgradeHighlights: string[];
  conflicts: Array<{
    type: string;
    sectionId: string;
    message: string;
    suggestion?: string;
  }>;
}

// ==================== 教案同步服务 ====================

export class LessonPlanSyncService {
  private apiKey: string;
  private baseUrl = "https://dashscope.aliyuncs.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 同步教案 - 核心方法
   */
  async syncLessonPlan(
    pptChanges: PPTChange,
    originalLessonPlan: LessonPlan | string | null,
    courseContext: CourseContext
  ): Promise<SyncResult> {
    console.log("[LessonPlanSync] 开始同步教案...");
    console.log("[LessonPlanSync] 变更:", JSON.stringify(pptChanges, null, 2));

    // 解析原有教案
    let originalPlan: LessonPlan;
    if (typeof originalLessonPlan === "string") {
      originalPlan = this.parseLessonPlan(originalLessonPlan);
    } else if (originalLessonPlan) {
      originalPlan = originalLessonPlan;
    } else {
      originalPlan = this.createEmptyLessonPlan(courseContext);
    }

    const conflicts: SyncResult["conflicts"] = [];
    const upgradeHighlights: string[] = [];
    let addedCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;

    // 处理新增页面
    if (pptChanges.added && pptChanges.added.length > 0) {
      console.log(`[LessonPlanSync] 处理${pptChanges.added.length}个新增页面...`);
      const newSections = await this.generateSectionsForNewPages(
        pptChanges.added,
        courseContext,
        originalPlan.sections.length
      );
      
      for (const section of newSections) {
        originalPlan.sections.push(section);
        addedCount++;
      }
      
      upgradeHighlights.push(`新增${addedCount}个教学环节：${pptChanges.added.map(p => p.title).join("、")}`);
    }

    // 处理修改页面
    if (pptChanges.modified && pptChanges.modified.length > 0) {
      console.log(`[LessonPlanSync] 处理${pptChanges.modified.length}个修改页面...`);
      for (const change of pptChanges.modified) {
        const sectionIndex = originalPlan.sections.findIndex(
          s => s.linkedPageId === change.id
        );
        
        if (sectionIndex !== -1) {
          const updatedSection = await this.updateSectionForModifiedPage(
            originalPlan.sections[sectionIndex],
            change,
            courseContext
          );
          originalPlan.sections[sectionIndex] = updatedSection;
          modifiedCount++;
        }
      }
      
      if (modifiedCount > 0) {
        upgradeHighlights.push(`优化${modifiedCount}个教学环节`);
      }
    }

    // 处理删除页面
    if (pptChanges.deleted && pptChanges.deleted.length > 0) {
      console.log(`[LessonPlanSync] 处理${pptChanges.deleted.length}个删除页面...`);
      for (const change of pptChanges.deleted) {
        const sectionIndex = originalPlan.sections.findIndex(
          s => s.linkedPageId === change.id
        );
        
        if (sectionIndex !== -1) {
          // 标记为删除而不是真的删除，让教师确认
          originalPlan.sections[sectionIndex].status = "deleted";
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        upgradeHighlights.push(`移除${deletedCount}个教学环节`);
      }
    }

    // 处理重排序
    if (pptChanges.reordered && pptChanges.reordered.length > 0) {
      console.log("[LessonPlanSync] 处理页面重排序...");
      const reorderedSections = this.reorderSections(
        originalPlan.sections,
        pptChanges.reordered
      );
      originalPlan.sections = reorderedSections;
      upgradeHighlights.push("调整教学环节顺序");
    }

    // 检测时长冲突
    const durationConflicts = this.detectDurationConflicts(originalPlan.sections);
    conflicts.push(...durationConflicts);

    // 计算总时长
    const totalMinutes = this.calculateTotalDuration(originalPlan.sections);
    originalPlan.totalDuration = `${totalMinutes}分钟`;

    // 添加总结
    originalPlan.summary = {
      addedSections: addedCount,
      modifiedSections: modifiedCount,
      deletedSections: deletedCount,
    };

    console.log("[LessonPlanSync] 同步完成！");

    return {
      updatedLessonPlan: originalPlan,
      upgradeHighlights,
      conflicts,
    };
  }

  /**
   * 为新增页面生成教案章节
   */
  private async generateSectionsForNewPages(
    addedPages: PPTChange["added"],
    context: CourseContext,
    startIndex: number
  ): Promise<LessonSection[]> {
    const sections: LessonSection[] = [];

    for (let i = 0; i < addedPages!.length; i++) {
      const page = addedPages![i];
      console.log(`[LessonPlanSync] 生成章节: ${page.title}`);

      // 使用AI生成教案内容
      const generated = await this.generateSectionWithAI(page, context);
      
      sections.push({
        id: `section_${String(startIndex + i + 1).padStart(3, "0")}`,
        title: page.title,
        duration: generated.duration,
        linkedPageId: page.id,
        status: "new",
        objectives: generated.objectives,
        script: generated.script,
        interaction: generated.interaction,
        teachingTips: generated.teachingTips,
        materials: generated.materials,
      });
    }

    return sections;
  }

  /**
   * 使用AI生成教案章节内容
   */
  private async generateSectionWithAI(
    page: { id: string; title: string; type: string; content?: string[] },
    context: CourseContext
  ): Promise<{
    duration: string;
    objectives: string;
    script: string;
    interaction: string;
    teachingTips?: string;
    materials?: string[];
  }> {
    const prompt = `你是一位资深的幼儿教育专家和教案设计师。请为以下PPT页面生成配套的教学教案。

【课程背景】
- 课程类型：${context.courseType}
- 目标学员：${context.targetAudience}
- 页面类型：${page.type}

【页面信息】
- 标题：${page.title}
${page.content ? `- 内容：${page.content.join("、")}` : ""}

【生成要求】
1. 教学目标：用幼儿易懂的语言，1-2句话
2. 教师话术：包含引导语、讲解语、总结语，用"师:"开头
3. 互动设计：1-2个适合${context.targetAudience}的互动环节（游戏、模仿、问答）
4. 时长：知识页2分钟，教学关卡3-5分钟
5. 语言风格：生动有趣，适合${context.targetAudience}

请以JSON格式输出：
{
  "duration": "X分钟",
  "objectives": "教学目标",
  "script": "教师话术（包含师:引导语、讲解语、总结语）",
  "interaction": "互动设计（具体可执行）",
  "teachingTips": "教学提示（可选）",
  "materials": ["所需材料1", "所需材料2"]
}`;

    try {
      const response = await fetch(`${this.baseUrl}/compatible-mode/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen-plus",
          messages: [
            {
              role: "system",
              content: "你是一位资深的幼儿教育专家，擅长设计生动有趣的教学教案。请直接输出JSON格式。",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI生成失败: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content || "";

      // 解析JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("[LessonPlanSync] AI生成错误:", error);
    }

    // 默认返回
    return this.getDefaultSectionContent(page, context);
  }

  /**
   * 获取默认教案内容（AI失败时的降级方案）
   */
  private getDefaultSectionContent(
    page: { id: string; title: string; type: string; content?: string[] },
    context: CourseContext
  ): {
    duration: string;
    objectives: string;
    script: string;
    interaction: string;
    teachingTips?: string;
    materials?: string[];
  } {
    const isKnowledge = page.type === "knowledge" || page.type === "content";
    const duration = isKnowledge ? "2分钟" : "3分钟";

    return {
      duration,
      objectives: `让${context.targetAudience}理解"${page.title}"的核心内容`,
      script: `师：小朋友们，我们来看看"${page.title}"！\n师：（讲解内容）\n师：太棒了，大家都学会了！`,
      interaction: `【互动环节】请小朋友跟着老师一起做动作，加深理解。`,
      teachingTips: `配合PPT第${page.id}页进行讲解`,
      materials: ["PPT课件"],
    };
  }

  /**
   * 更新修改页面对应的教案章节
   */
  private async updateSectionForModifiedPage(
    section: LessonSection,
    change: { id: string; oldTitle: string; newTitle: string; content?: string[] },
    context: CourseContext
  ): Promise<LessonSection> {
    // 更新标题
    section.title = change.newTitle;
    section.status = "modified";

    // 如果核心内容变化较大，重新生成话术
    if (change.content && change.content.length > 0) {
      const generated = await this.generateSectionWithAI(
        { id: change.id, title: change.newTitle, type: "content", content: change.content },
        context
      );
      
      section.objectives = generated.objectives;
      section.script = generated.script;
      section.interaction = generated.interaction;
    }

    return section;
  }

  /**
   * 重排序教案章节
   */
  private reorderSections(
    sections: LessonSection[],
    newOrder: number[]
  ): LessonSection[] {
    const reordered: LessonSection[] = [];
    for (const index of newOrder) {
      if (sections[index]) {
        reordered.push(sections[index]);
      }
    }
    // 添加未在newOrder中的章节
    for (let i = 0; i < sections.length; i++) {
      if (!newOrder.includes(i)) {
        reordered.push(sections[i]);
      }
    }
    return reordered;
  }

  /**
   * 检测时长冲突
   */
  private detectDurationConflicts(
    sections: LessonSection[]
  ): SyncResult["conflicts"] {
    const conflicts: SyncResult["conflicts"] = [];

    for (const section of sections) {
      if (section.status === "deleted") continue;

      const minutes = parseInt(section.duration) || 2;
      
      // 检测过长或过短
      if (minutes > 5) {
        conflicts.push({
          type: "duration_too_long",
          sectionId: section.id,
          message: `教案时长${section.duration}，建议拆分为多个环节`,
          suggestion: `将"${section.title}"拆分为2个环节，每个2-3分钟`,
        });
      } else if (minutes < 1) {
        conflicts.push({
          type: "duration_too_short",
          sectionId: section.id,
          message: `教案时长${section.duration}，内容可能不够充实`,
          suggestion: `为"${section.title}"增加互动环节或补充讲解`,
        });
      }
    }

    return conflicts;
  }

  /**
   * 计算总时长
   */
  private calculateTotalDuration(sections: LessonSection[]): number {
    return sections
      .filter(s => s.status !== "deleted")
      .reduce((total, section) => {
        const minutes = parseInt(section.duration) || 2;
        return total + minutes;
      }, 0);
  }

  /**
   * 解析教案文本
   */
  private parseLessonPlan(text: string): LessonPlan {
    // 简单解析，实际可以做更复杂的NLP解析
    return {
      title: "解析的教案",
      courseType: "通用课程",
      targetAudience: "学员",
      sections: [],
      totalDuration: "30分钟",
    };
  }

  /**
   * 创建空教案
   */
  private createEmptyLessonPlan(context: CourseContext): LessonPlan {
    return {
      title: `${context.courseType}教案`,
      courseType: context.courseType,
      targetAudience: context.targetAudience,
      sections: [],
      totalDuration: "0分钟",
    };
  }

  /**
   * 从PPT生成完整教案
   */
  async generateLessonPlanFromPPT(
    slides: Array<{ id: number; title: string; type: string; content: string[] }>,
    context: CourseContext
  ): Promise<LessonPlan> {
    console.log(`[LessonPlanSync] 从${slides.length}页PPT生成完整教案...`);

    const sections: LessonSection[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const generated = await this.generateSectionWithAI(
        { id: String(slide.id), title: slide.title, type: slide.type, content: slide.content },
        context
      );

      sections.push({
        id: `section_${String(i + 1).padStart(3, "0")}`,
        title: slide.title,
        duration: generated.duration,
        linkedPageId: String(slide.id),
        objectives: generated.objectives,
        script: generated.script,
        interaction: generated.interaction,
        teachingTips: generated.teachingTips,
        materials: generated.materials,
      });
    }

    const totalMinutes = this.calculateTotalDuration(sections);

    return {
      title: `${context.courseType}教案`,
      courseType: context.courseType,
      targetAudience: context.targetAudience,
      sections,
      totalDuration: `${totalMinutes}分钟`,
    };
  }
}
