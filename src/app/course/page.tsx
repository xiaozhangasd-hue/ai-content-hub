"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  FileUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Volume2,
  Download,
  MessageCircle,
  X,
  Wand2,
  Target,
  Bot,
  Play,
  CheckCircle,
  Lightbulb,
} from "lucide-react";

// 课程类型
const COURSE_TYPES = [
  { id: "口才课程", label: "口才", emoji: "🎤" },
  { id: "编程课程", label: "编程", emoji: "💻" },
  { id: "美术课程", label: "美术", emoji: "🎨" },
  { id: "音乐课程", label: "音乐", emoji: "🎵" },
  { id: "早教课程", label: "早教", emoji: "👶" },
  { id: "其他", label: "其他", emoji: "📚" },
];

// 目标学员
const TARGET_AUDIENCES = ["3-5岁幼儿", "小学生", "初中生", "高中生", "成人学员", "全年龄"];

// 设计风格
const DESIGN_STYLES = [
  { id: "playful", label: "童趣活泼", emoji: "🎈" },
  { id: "modern", label: "现代简约", emoji: "✨" },
  { id: "creative", label: "创意艺术", emoji: "🎨" },
  { id: "tech", label: "科技未来", emoji: "🚀" },
];

// 推荐类型
interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionType: string;
  actionData: {
    buttonText?: string;
    text?: string;
  };
  applied?: boolean;
}

// 幻灯片类型
interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  content: string[];
  imageUrl?: string;
  teacherNote?: string;
  duration?: string;
}

// PPT剧本
interface Storyboard {
  title: string;
  subtitle?: string;
  theme: {
    visual: {
      primaryColor: string;
      secondaryColor: string;
    };
  };
  slides: Slide[];
  targetAudience: string;
}

// 上传文件
interface UploadedFile {
  id: string;
  name: string;
  content: string;
}

// 会话ID
let globalSessionId = `session_${Date.now()}`;

export default function CourseGeneratorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========== 状态 ==========
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [courseType, setCourseType] = useState("口才课程");
  const [targetAudience, setTargetAudience] = useState("3-5岁幼儿");
  const [designStyle, setDesignStyle] = useState("playful");

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showTeacherNote, setShowTeacherNote] = useState(true);

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);

  // 推荐系统
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isProcessingRec, setIsProcessingRec] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [pptDownloadUrl, setPptDownloadUrl] = useState<string | null>(null);

  const [previewTab, setPreviewTab] = useState<"ppt" | "lesson">("ppt");

  // ========== 调用扣子智能体 ==========
  const callCozeAgent = useCallback(async (action: string, content: any): Promise<{ content: string; pptUrl?: string }> => {
    const response = await fetch("/api/coze-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        content,
        sessionId: globalSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error("智能体请求失败");
    }

    // 读取流式响应
    const reader = response.body?.getReader();
    if (!reader) throw new Error("无响应内容");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let pptUrl: string | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const dataLines = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        for (const dataLine of dataLines) {
          try {
            const parsed = JSON.parse(dataLine);
            if (parsed.type === "delta" && parsed.content) {
              fullContent += parsed.content;
              setStreamingText(fullContent);
            } else if (parsed.type === "ppt_ready" && parsed.url) {
              // 智能体生成了真实PPT文件
              pptUrl = parsed.url;
              setPptDownloadUrl(parsed.url);
              console.log("[PPT] Download URL received:", parsed.url);
            } else if (parsed.type === "final" && parsed.content) {
              fullContent = parsed.content;
              if (parsed.pptDownloadUrl && !pptUrl) {
                pptUrl = parsed.pptDownloadUrl;
                setPptDownloadUrl(parsed.pptDownloadUrl);
              }
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    return { content: fullContent, pptUrl };
  }, []);

  // ========== 文件上传 ==========
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      const isWord = file.name.endsWith(".docx") || file.name.endsWith(".doc");
      const isPdf = file.name.endsWith(".pdf");

      if (!isWord && !isPdf) {
        toast.error(`${file.name} 格式不支持`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} 超过20MB限制`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/course/parse", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setUploadedFiles((prev) => [
            ...prev,
            {
              id: Date.now().toString() + Math.random(),
              name: file.name,
              content: data.content || "",
            },
          ]);
          toast.success(`${file.name} 上传成功`);
        } else {
          toast.error(`${file.name} 解析失败`);
        }
      } catch (error) {
        toast.error(`${file.name} 上传失败`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ========== 使用扣子智能体生成PPT ==========
  const generatePPT = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("请先上传文档");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStoryboard(null);
    setRecommendations([]);
    setStreamingText("");
    globalSessionId = `session_${Date.now()}`;

    try {
      const allContent = uploadedFiles.map((f) => `【${f.name}】\n${f.content}`).join("\n\n---\n\n");

      setProgressText("🤖 AI正在分析文档...");
      setProgress(20);
      setPptDownloadUrl(null);

      // 调用扣子智能体
      const result = await callCozeAgent("generate_ppt", {
        courseType,
        targetAudience,
        style: designStyle,
        documentContent: allContent,
        content: allContent,
      });

      setProgressText("📋 解析生成结果...");
      setProgress(70);

      // 如果智能体返回了真实PPT下载链接，显示成功消息
      if (result.pptUrl) {
        toast.success("PPT已生成！可以下载真实PPT文件");
      }

      // 解析结果（用于前端预览）
      const storyboard = parsePPTResult(result.content);
      
      if (storyboard && storyboard.slides.length > 0) {
        setStoryboard(storyboard);
        setCurrentSlideIndex(0);
        setProgress(100);
        toast.success(`已生成 ${storyboard.slides.length} 页幻灯片！`);

        // 生成推荐
        setTimeout(() => {
          generateRecommendations(storyboard);
        }, 500);
      } else if (result.pptUrl) {
        // 即使JSON解析失败，只要有PPT链接也算成功
        setStoryboard({
          title: "课件已生成",
          theme: { visual: { primaryColor: "#8B5CF6", secondaryColor: "#EC4899" } },
          slides: [{ id: 1, type: "cover", title: "PPT已生成", content: ["请点击右侧下载按钮获取真实PPT文件"], duration: "1分钟" }],
          targetAudience,
        });
        setProgress(100);
      } else {
        throw new Error("生成的内容格式不正确");
      }
    } catch (error) {
      console.error("生成错误:", error);
      toast.error(error instanceof Error ? error.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
      setStreamingText("");
    }
  };

  // ========== 解析PPT生成结果 ==========
  // 辅助函数：从JSON创建Storyboard
  const createStoryboardFromJSON = (parsed: any): Storyboard => {
    return {
      title: parsed.title || "课件",
      subtitle: parsed.subtitle,
      theme: parsed.theme || {
        visual: {
          primaryColor: "#8B5CF6",
          secondaryColor: "#EC4899",
        },
      },
      slides: (parsed.slides || parsed.pages || []).map((s: any, i: number) => ({
        id: i + 1,
        type: s.type || "content",
        title: s.title || s.name || `第${i + 1}页`,
        subtitle: s.subtitle,
        content: typeof s.content === "string" 
          ? s.content.split("\n").filter((c: string) => c.trim())
          : (s.content || s.points || []),
        imageUrl: s.imageUrl || s.image,
        teacherNote: s.teacherNote || s.script,
        duration: s.duration || "2分钟",
      })),
      targetAudience,
    };
  };

  const parsePPTResult = (result: string): Storyboard | null => {
    try {
      // 先尝试提取markdown代码块中的JSON
      const codeBlockMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          const parsed = JSON.parse(codeBlockMatch[1].trim());
          if (parsed.slides || parsed.pages) {
            return createStoryboardFromJSON(parsed);
          }
        } catch (e) {
          console.log("Code block parse failed, trying raw extraction");
        }
      }

      // 尝试提取第一个完整的JSON对象
      const extractJSON = (text: string): string | null => {
        const startIndex = text.indexOf("{");
        if (startIndex === -1) return null;
        
        let depth = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = startIndex; i < text.length; i++) {
          const char = text[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === "\\") {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === "{") depth++;
            if (char === "}") {
              depth--;
              if (depth === 0) {
                return text.substring(startIndex, i + 1);
              }
            }
          }
        }
        return null;
      };

      const jsonStr = extractJSON(result);
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.slides || parsed.pages) {
          return createStoryboardFromJSON(parsed);
        }
      }

      // 如果无法解析JSON，尝试从文本中提取结构
      const lines = result.split("\n").filter((l) => l.trim());
      const slides: Slide[] = [];
      let currentSlide: Partial<Slide> | null = null;

      for (const line of lines) {
        // 匹配页面标题（如 "第1页：xxx" 或 "## 1. xxx"）
        const titleMatch = line.match(/^(第?\d+页?[:：.、\s]+(.+)|##\s*\d+[.、\s]+(.+)|\*\*\d+[.、\s]+(.+)\*\*)/);
        if (titleMatch) {
          if (currentSlide && currentSlide.title) {
            slides.push({
              id: slides.length + 1,
              type: currentSlide.type || "content",
              title: currentSlide.title,
              content: currentSlide.content || [],
              duration: "2分钟",
            } as Slide);
          }
          currentSlide = {
            title: titleMatch[2] || titleMatch[3] || titleMatch[4] || line.replace(/^[\d#*]+[:：.、\s]+/, ""),
            content: [],
          };
        } else if (currentSlide) {
          // 添加内容
          const content = line.replace(/^[-•*·]\s*/, "").trim();
          if (content && content.length > 2) {
            currentSlide.content = currentSlide.content || [];
            currentSlide.content.push(content);
          }
        }
      }

      // 添加最后一个页面
      if (currentSlide && currentSlide.title) {
        slides.push({
          id: slides.length + 1,
          type: "content",
          title: currentSlide.title,
          content: currentSlide.content || [],
          duration: "2分钟",
        } as Slide);
      }

      if (slides.length > 0) {
        return {
          title: "智能课件",
          theme: {
            visual: {
              primaryColor: "#8B5CF6",
              secondaryColor: "#EC4899",
            },
          },
          slides,
          targetAudience,
        };
      }

      return null;
    } catch (e) {
      console.error("解析错误:", e);
      return null;
    }
  };

  // ========== 生成推荐 ==========
  const generateRecommendations = async (storyboard: Storyboard) => {
    try {
      const hasInteractive = storyboard.slides.some((s) => s.type === "interactive");
      const hasSummary = storyboard.slides.some((s) => s.type === "summary" || s.type === "ending");

      // 调用扣子智能体获取推荐
      const result = await callCozeAgent("generate_recommendations", {
        totalSlides: storyboard.slides.length,
        hasInteractive,
        hasSummary,
        estimatedDuration: storyboard.slides.length * 2,
        targetAudience,
        courseType,
      });

      // 解析推荐结果
      const recs = parseRecommendations(result.content);
      setRecommendations(recs);
    } catch (error) {
      console.error("推荐生成错误:", error);
      // 使用默认推荐
      setRecommendations(getDefaultRecommendations(storyboard));
    }
  };

  // ========== 解析推荐结果 ==========
  const parseRecommendations = (result: string): Recommendation[] => {
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    
    // 从文本解析
    const recs: Recommendation[] = [];
    const lines = result.split("\n");
    
    for (const line of lines) {
      const match = line.match(/^(\d+)[.、:：]\s*(.+)/);
      if (match) {
        recs.push({
          id: `rec_${match[1]}`,
          type: "optimization",
          title: match[2].trim(),
          description: "",
          priority: "medium",
          actionType: "quickaction",
          actionData: { buttonText: "执行" },
        });
      }
    }

    return recs.length > 0 ? recs : [];
  };

  // ========== 默认推荐 ==========
  const getDefaultRecommendations = (storyboard: Storyboard): Recommendation[] => {
    const recs: Recommendation[] = [];
    const hasInteractive = storyboard.slides.some((s) => s.type === "interactive");
    const hasSummary = storyboard.slides.some((s) => s.type === "summary");

    if (!hasInteractive && targetAudience.includes("幼儿")) {
      recs.push({
        id: "rec_interactive",
        type: "optimization",
        title: "添加互动游戏",
        description: "3-5岁幼儿注意力有限，建议增加互动环节",
        priority: "high",
        actionType: "quickaction",
        actionData: { buttonText: "查看游戏库" },
      });
    }

    if (!hasSummary) {
      recs.push({
        id: "rec_summary",
        type: "optimization",
        title: "添加课程总结",
        description: "建议在末尾添加知识回顾",
        priority: "low",
        actionType: "quickaction",
        actionData: { buttonText: "添加总结页" },
      });
    }

    recs.push({
      id: "rec_lesson",
      type: "followup",
      title: "生成配套教案",
      description: "PPT已生成，是否生成配套教案？",
      priority: "high",
      actionType: "quickaction",
      actionData: { buttonText: "一键生成" },
    });

    return recs;
  };

  // ========== 执行推荐动作 ==========
  const handleRecommendationAction = async (rec: Recommendation) => {
    setIsProcessingRec(true);

    try {
      if (rec.id === "rec_lesson" || rec.actionData.buttonText?.includes("教案")) {
        await generateLessonPlan();
      } else if (rec.id === "rec_summary" || rec.actionData.buttonText?.includes("总结")) {
        if (storyboard) {
          const newSlide: Slide = {
            id: Date.now(),
            type: "summary",
            title: "课程回顾",
            content: ["今天我们学习了...", "下次课预告..."],
            duration: "2分钟",
          };
          setStoryboard({
            ...storyboard,
            slides: [...storyboard.slides, newSlide],
          });
          toast.success("已添加课程总结页");
        }
      } else {
        toast.info(`正在执行：${rec.title}`);
      }

      setRecommendations((prev) =>
        prev.map((r) => (r.id === rec.id ? { ...r, applied: true } : r))
      );
    } catch (error) {
      toast.error("操作失败");
    } finally {
      setIsProcessingRec(false);
    }
  };

  // ========== 生成教案 ==========
  const generateLessonPlan = async () => {
    if (!storyboard?.slides?.length) {
      toast.error("请先生成PPT");
      return;
    }

    setIsGeneratingLesson(true);
    setStreamingText("");

    try {
      const result = await callCozeAgent("generate_lesson_plan", {
        courseType,
        targetAudience,
        slides: storyboard.slides,
      });

      // 解析教案
      const lessonPlan = parseLessonPlan(result.content);
      setLessonPlan(lessonPlan);
      
      setRecommendations((prev) =>
        prev.map((r) => (r.id === "rec_lesson" ? { ...r, applied: true } : r))
      );

      toast.success("教案已生成");
    } catch (error) {
      toast.error("教案生成失败");
    } finally {
      setIsGeneratingLesson(false);
      setStreamingText("");
    }
  };

  // ========== 解析教案 ==========
  const parseLessonPlan = (result: string) => {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    // 简单解析
    const sections = result.split(/\n(?=\d+[.、])/).filter(Boolean);
    return {
      title: "教学教案",
      totalDuration: `${storyboard?.slides?.length ? storyboard.slides.length * 2 : 10}分钟`,
      sections: sections.map((s, i) => ({
        id: `section_${i + 1}`,
        title: s.split("\n")[0].replace(/^\d+[.、]\s*/, ""),
        objectives: s,
        duration: "5分钟",
      })),
    };
  };

  // ========== 导出PPT ==========
  const downloadPPTX = async () => {
    // 如果有智能体生成的真实PPT，优先下载
    if (pptDownloadUrl) {
      try {
        toast.info("正在下载智能体生成的PPT...");
        // 使用fetch下载，避免跨域问题
        const response = await fetch(pptDownloadUrl);
        if (!response.ok) throw new Error("下载失败");
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${storyboard?.title || "课件"}.pptx`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast.success("PPT已下载！");
        return;
      } catch (error) {
        console.error("Download error:", error);
        toast.error("下载失败，尝试备用方案...");
      }
    }

    // 备用：本地生成PPT
    if (!storyboard) return;

    try {
      const response = await fetch("/api/course/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboard }),
      });

      if (!response.ok) throw new Error("生成失败");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${storyboard.title}.pptx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PPT已下载");
    } catch (error) {
      toast.error("下载失败");
    }
  };

  // ========== 重置 ==========
  const resetAll = () => {
    setUploadedFiles([]);
    setStoryboard(null);
    setLessonPlan(null);
    setRecommendations([]);
    setCurrentSlideIndex(0);
    globalSessionId = `session_${Date.now()}`;
  };

  const currentSlide = storyboard?.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* 顶部导航 */}
      <header className="h-14 bg-slate-800/80 backdrop-blur-md border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-sm">PPT智能创作</h1>
              <p className="text-xs text-slate-400">上传文档 → AI生成 → 智能优化</p>
            </div>
          </div>
        </div>

        {storyboard && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTeacherNote(!showTeacherNote)} className="gap-1 border-slate-600 text-slate-300">
              <MessageCircle className="w-4 h-4" />
              讲稿
            </Button>
            <Button 
              size="sm" 
              onClick={downloadPPTX} 
              className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Download className="w-4 h-4" />
              {pptDownloadUrl ? "下载真实PPT" : "下载PPT"}
            </Button>
            {pptDownloadUrl && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                AI已生成
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={resetAll} className="border-slate-600 text-slate-300">
              重新创作
            </Button>
          </div>
        )}
      </header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：主操作区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!storyboard ? (
            /* 上传阶段 */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-2xl">
                <Card className="border-slate-700 bg-slate-800 shadow-xl mb-6">
                  <CardContent className="p-8">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/50 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-500/10 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".doc,.docx,.pdf"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {isUploading ? (
                        <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center mx-auto mb-4">
                          <FileUp className="w-10 h-10 text-purple-400" />
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {isUploading ? "正在解析文档..." : "上传课程文档"}
                      </h3>
                      <p className="text-slate-400">支持 Word、PDF 格式</p>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>已上传 {uploadedFiles.length} 个文件</span>
                          <Button variant="ghost" size="sm" onClick={() => setUploadedFiles([])} className="text-red-400 hover:text-red-300">
                            <Trash2 className="w-4 h-4 mr-1" />清空
                          </Button>
                        </div>
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <span className="flex-1 text-sm truncate text-slate-200">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="h-6 w-6 p-0 text-slate-400 hover:text-white">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 课程设置 */}
                <Card className="border-slate-700 bg-slate-800 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      课程设置
                    </h3>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">课程类型</label>
                        <div className="flex flex-wrap gap-1">
                          {COURSE_TYPES.map((type) => (
                            <Badge
                              key={type.id}
                              variant={courseType === type.id ? "default" : "outline"}
                              className={`cursor-pointer ${courseType === type.id ? "bg-purple-500" : "border-slate-600 text-slate-300"}`}
                              onClick={() => setCourseType(type.id)}
                            >
                              {type.emoji} {type.label}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">目标学员</label>
                        <select
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full border border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-700 text-white"
                        >
                          {TARGET_AUDIENCES.map((a) => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500 mb-2 block">设计风格</label>
                        <div className="flex gap-1">
                          {DESIGN_STYLES.map((style) => (
                            <Badge
                              key={style.id}
                              variant={designStyle === style.id ? "default" : "outline"}
                              className={`cursor-pointer ${designStyle === style.id ? "bg-pink-500" : ""}`}
                              onClick={() => setDesignStyle(style.id)}
                            >
                              {style.emoji}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <Button
                        size="lg"
                        onClick={generatePPT}
                        disabled={isGenerating || uploadedFiles.length === 0}
                        className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-12"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {progressText}
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            开始生成课件
                          </>
                        )}
                      </Button>
                    </div>

                    {isGenerating && (
                      <div className="mt-4">
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {streamingText && (
                          <div className="mt-3 p-3 bg-slate-700/50 rounded-lg text-sm text-slate-300 max-h-32 overflow-y-auto">
                            {streamingText.slice(0, 500)}...
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* 预览阶段 */
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="flex gap-2 mb-3">
                <Button variant={previewTab === "ppt" ? "default" : "outline"} size="sm" onClick={() => setPreviewTab("ppt")} className={previewTab !== "ppt" ? "border-slate-600 text-slate-300" : ""}>
                  <Play className="w-4 h-4 mr-1" />PPT预览
                </Button>
                <Button variant={previewTab === "lesson" ? "default" : "outline"} size="sm" onClick={() => setPreviewTab("lesson")} className={previewTab !== "lesson" ? "border-slate-600 text-slate-300" : ""}>
                  <FileText className="w-4 h-4 mr-1" />教案
                  {lessonPlan && <Badge variant="secondary" className="ml-1 text-xs">{lessonPlan.sections?.length}</Badge>}
                </Button>
              </div>

              {previewTab === "ppt" ? (
                <>
                  <div className="flex-1 flex gap-4 overflow-hidden">
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 bg-slate-800 rounded-xl shadow-lg overflow-hidden relative border border-slate-700">
                        {currentSlide?.imageUrl && (
                          <img src={currentSlide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(135deg, ${storyboard?.theme?.visual?.primaryColor || "#8B5CF6"}ee, ${storyboard?.theme?.visual?.secondaryColor || "#EC4899"}ee)`,
                          }}
                        />
                        <div className="absolute inset-0 flex flex-col justify-center items-center p-8 text-white text-center">
                          <h2 className="text-3xl font-bold mb-4 drop-shadow-lg">{currentSlide?.title}</h2>
                          {currentSlide?.subtitle && <p className="text-xl opacity-90 mb-4">{currentSlide.subtitle}</p>}
                          <div className="space-y-2">
                            {currentSlide?.content?.slice(0, 5).map((text, i) => (
                              <p key={i} className="text-lg opacity-80">{text}</p>
                            ))}
                          </div>
                        </div>
                        <div className="absolute bottom-3 right-4 text-white/70 text-sm">
                          {currentSlideIndex + 1} / {storyboard?.slides?.length}
                        </div>
                      </div>

                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} className="border-slate-600 text-slate-300">
                          <ChevronLeft className="w-4 h-4 mr-1" />上一页
                        </Button>
                        <span className="text-sm text-slate-400">第 {currentSlideIndex + 1} 页</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentSlideIndex(Math.min(storyboard.slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === storyboard.slides.length - 1} className="border-slate-600 text-slate-300">
                          下一页<ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>

                    {showTeacherNote && currentSlide && (
                      <div className="w-72 shrink-0">
                        <Card className="h-full bg-slate-800 border-slate-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-white">
                              <Volume2 className="w-4 h-4 text-purple-400" />
                              教师讲稿
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-slate-300 leading-relaxed overflow-y-auto max-h-[calc(100vh-340px)]">
                            {currentSlide.teacherNote || (
                              <div className="text-center py-8 text-slate-500">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                暂无讲稿
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                    {storyboard.slides.map((slide, index) => (
                      <div
                        key={slide.id}
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`shrink-0 w-24 aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          currentSlideIndex === index ? "border-purple-500 shadow-lg" : "border-slate-600 hover:border-slate-500"
                        }`}
                      >
                        <div
                          className="w-full h-full flex items-center justify-center text-white text-xs p-1 text-center"
                          style={{
                            background: `linear-gradient(135deg, ${storyboard.theme?.visual?.primaryColor || "#8B5CF6"}, ${storyboard.theme?.visual?.secondaryColor || "#EC4899"})`,
                          }}
                        >
                          <span className="truncate">{slide.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {lessonPlan ? (
                    <div className="space-y-3">
                      <Card className="bg-slate-800 border-slate-700">
                        <CardContent className="p-4">
                          <h2 className="font-bold text-lg mb-2 text-white">{lessonPlan.title}</h2>
                          <div className="flex gap-4 text-sm text-slate-400">
                            <span>🎯 {targetAudience}</span>
                            <span>⏱️ {lessonPlan.totalDuration}</span>
                            <span>📚 {lessonPlan.sections?.length}个环节</span>
                          </div>
                        </CardContent>
                      </Card>
                      {lessonPlan.sections?.map((section: any, index: number) => (
                        <Card key={section.id} className="bg-slate-800 border-slate-700">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-slate-600">#{index + 1}</Badge>
                              <span className="font-medium text-white">{section.title}</span>
                              <span className="text-xs text-slate-500 ml-auto">{section.duration}</span>
                            </div>
                            <p className="text-sm text-slate-400">{section.objectives}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 mb-4">教案尚未生成</p>
                        <Button onClick={generateLessonPlan} disabled={isGeneratingLesson}>
                          {isGeneratingLesson ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          生成教案
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：AI推荐栏 */}
        <div className="w-80 border-l border-slate-700 bg-slate-800/50 p-4 overflow-y-auto shrink-0">
          <Card className="border-slate-700 bg-slate-800 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                AI智能推荐
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">生成课件后，AI将自动推荐优化策略</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-lg border ${
                      rec.applied
                        ? "bg-green-900/30 border-green-700"
                        : rec.priority === "high"
                        ? "bg-red-900/30 border-red-700"
                        : rec.priority === "medium"
                        ? "bg-amber-900/30 border-amber-700"
                        : "bg-blue-900/30 border-blue-700"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {rec.applied ? (
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      ) : rec.priority === "high" ? (
                        <span className="text-red-400">⚠️</span>
                      ) : (
                        <span>💡</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${rec.applied ? "text-green-400 line-through" : "text-white"}`}>
                          {rec.title}
                        </div>
                        {rec.description && (
                          <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                        )}
                        {!rec.applied && (
                          <Button
                            size="sm"
                            variant={rec.priority === "high" ? "default" : "outline"}
                            className={`mt-2 h-7 text-xs ${rec.priority === "high" ? "bg-gradient-to-r from-purple-500 to-pink-500" : "border-slate-600 text-slate-300"}`}
                            onClick={() => handleRecommendationAction(rec)}
                            disabled={isProcessingRec}
                          >
                            {rec.actionData.buttonText || "执行"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {storyboard && (
            <Card className="border-slate-700 bg-slate-800 shadow-lg mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-white">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300" onClick={generateLessonPlan} disabled={isGeneratingLesson || !!lessonPlan}>
                  {lessonPlan ? <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> : isGeneratingLesson ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  {lessonPlan ? "教案已生成" : "生成教案"}
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start border-slate-600 text-slate-300" onClick={downloadPPTX}>
                  <Download className="w-4 h-4 mr-2" />
                  下载PPT
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
