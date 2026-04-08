"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Loader2,
  Sparkles,
  FileUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  FileText,
  Volume2,
  Fullscreen,
  Download,
  Edit3,
  MessageCircle,
  Image as ImageIcon,
  X,
  Maximize2,
  Minimize2,
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

// Gamma幻灯片类型
interface GammaSlide {
  id: number;
  type: "cover" | "content" | "highlight" | "interactive" | "ending";
  title: string;
  subtitle?: string;
  content: string[];
  teacherNote?: string;
  interaction?: string;
  imageUrl?: string;
  imagePrompt?: string;
  animation?: "fade" | "slide" | "zoom" | "flip";
  bgColor?: string;
  accentColor?: string;
}

// 分镜剧本
interface Storyboard {
  title: string;
  subtitle?: string;
  targetAudience: string;
  duration: string;
  slides: GammaSlide[];
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
}

export default function GammaPPTPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传文件
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 课程设置
  const [courseType, setCourseType] = useState("口才课程");
  const [targetAudience, setTargetAudience] = useState("3-5岁幼儿");

  // PPT数据
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);

  // 演示控制
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTeacherNote, setShowTeacherNote] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // 处理文件上传
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

  // 删除文件
  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 清空
  const clearAll = () => {
    setUploadedFiles([]);
    setStoryboard(null);
    setCurrentSlideIndex(0);
  };

  // 生成Gamma PPT
  const generatePPT = async () => {
    if (uploadedFiles.length === 0) {
      toast.error("请先上传文档");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStoryboard(null);

    try {
      const allContent = uploadedFiles.map((f) => `【${f.name}】\n${f.content}`).join("\n\n---\n\n");

      const response = await fetch("/api/course/gamma-ppt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: allContent,
          courseType,
          targetAudience,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "生成失败");
      }

      const data = await response.json();

      if (!data.success || !data.storyboard) {
        throw new Error(data.error || "生成的内容为空");
      }

      setStoryboard(data.storyboard);
      setCurrentSlideIndex(0);
      toast.success(`已生成 ${data.storyboard.slides.length} 页幻灯片！`);
    } catch (error) {
      console.error("生成错误:", error);
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  // 切换幻灯片
  const nextSlide = useCallback(() => {
    if (storyboard && currentSlideIndex < storyboard.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  }, [storyboard, currentSlideIndex]);

  const prevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  }, [currentSlideIndex]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    },
    [nextSlide, prevSlide]
  );

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 当前幻灯片
  const currentSlide = storyboard?.slides[currentSlideIndex];

  // 导出PDF（简化版：打印页面）
  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900 text-sm">Gamma风格PPT</h1>
                <p className="text-xs text-gray-500">AI配图 + 内容扩展</p>
              </div>
            </div>
          </div>

          {storyboard && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTeacherNote(!showTeacherNote)}
                className="gap-1"
              >
                <MessageCircle className="w-4 h-4" />
                讲稿
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="gap-1"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
                全屏
              </Button>
              <Button
                size="sm"
                onClick={exportPDF}
                className="gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                导出
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!storyboard ? (
          /* 生成前：上传和设置 */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：上传 */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Upload className="w-5 h-5 text-purple-500" />
                  上传课程文档
                </div>

                {/* 已上传文件 */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>已上传 {uploadedFiles.length} 个文件</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="text-red-500 h-7"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        清空
                      </Button>
                    </div>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="flex-1 text-sm truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 上传区域 */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-all"
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
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-3" />
                  ) : (
                    <FileUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                  )}
                  <p className="text-gray-600">
                    {isUploading ? "正在解析..." : "点击上传 Word/PDF 文档"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">支持多个文件同时上传</p>
                </div>

                {/* 课程设置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">课程类型</Label>
                    <div className="flex flex-wrap gap-1">
                      {COURSE_TYPES.map((type) => (
                        <Badge
                          key={type.id}
                          variant={courseType === type.id ? "default" : "outline"}
                          className={`cursor-pointer ${
                            courseType === type.id
                              ? "bg-gradient-to-r from-purple-500 to-pink-500"
                              : ""
                          }`}
                          onClick={() => setCourseType(type.id)}
                        >
                          {type.emoji} {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">目标学员</Label>
                    <div className="flex flex-wrap gap-1">
                      {TARGET_AUDIENCES.slice(0, 4).map((audience) => (
                        <Badge
                          key={audience}
                          variant={targetAudience === audience ? "default" : "outline"}
                          className={`cursor-pointer ${
                            targetAudience === audience
                              ? "bg-gradient-to-r from-purple-500 to-pink-500"
                              : ""
                          }`}
                          onClick={() => setTargetAudience(audience)}
                        >
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 生成按钮 */}
                <Button
                  onClick={generatePPT}
                  disabled={uploadedFiles.length === 0 || isGenerating}
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {progressText || "AI正在创作..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      开始创作
                    </>
                  )}
                </Button>

                {isGenerating && progress > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 右侧：说明 */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">AI驱动的PPT创作</h2>
                  <p className="text-gray-600 mt-2">不只是搬运文字，而是真正创作内容</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      icon: Sparkles,
                      title: "AI内容扩展",
                      desc: "自动扩展成完整讲稿，不只是要点罗列",
                    },
                    {
                      icon: ImageIcon,
                      title: "每页AI配图",
                      desc: "根据内容自动生成匹配的可爱插画",
                    },
                    {
                      icon: MessageCircle,
                      title: "互动设计",
                      desc: "设计问答、游戏等互动环节",
                    },
                    {
                      icon: Volume2,
                      title: "教师讲稿",
                      desc: "每页都有详细的讲解话术提示",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white shadow flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* 生成后：演示区域 */
          <div className="flex gap-6">
            {/* 左侧：幻灯片列表 */}
            <div className="w-64 shrink-0 space-y-2 print:hidden">
              <div className="text-sm font-medium text-gray-700 mb-3">幻灯片 ({storyboard.slides.length}页)</div>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {storyboard.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      currentSlideIndex === index
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                        : "bg-white hover:bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono opacity-60">#{index + 1}</span>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {slide.type}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium truncate">{slide.title}</div>
                    {slide.imageUrl && (
                      <div className="mt-2 h-10 rounded bg-gray-100 overflow-hidden">
                        <img
                          src={slide.imageUrl}
                          alt=""
                          className="w-full h-full object-cover opacity-80"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 重新生成按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStoryboard(null)}
                className="w-full mt-4"
              >
                <Edit3 className="w-4 h-4 mr-1" />
                重新创作
              </Button>
            </div>

            {/* 中间：幻灯片演示 */}
            <div className="flex-1">
              <div className="aspect-[16/9] bg-white rounded-2xl shadow-2xl overflow-hidden relative">
                {currentSlide && (
                  <div className="w-full h-full relative">
                    {/* 背景图 */}
                    {currentSlide.imageUrl && (
                      <img
                        src={currentSlide.imageUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* 遮罩层 */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: currentSlide.type === "cover" || currentSlide.type === "ending"
                          ? `linear-gradient(135deg, ${currentSlide.bgColor || "#8B5CF6"}dd, ${(currentSlide.accentColor || "#EC4899")}dd)`
                          : "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5))",
                      }}
                    />

                    {/* 内容 */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white">
                      {currentSlide.type === "cover" && (
                        <div className="text-center">
                          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
                            {currentSlide.title}
                          </h1>
                          {currentSlide.subtitle && (
                            <p className="text-2xl opacity-90">{currentSlide.subtitle}</p>
                          )}
                          {currentSlide.content.map((text, i) => (
                            <p key={i} className="text-lg mt-4 opacity-80">
                              {text}
                            </p>
                          ))}
                        </div>
                      )}

                      {currentSlide.type === "content" && (
                        <div className="w-full max-w-4xl">
                          <h2 className="text-4xl font-bold mb-8 drop-shadow-lg text-center">
                            {currentSlide.title}
                          </h2>
                          <div className="grid gap-4">
                            {currentSlide.content.map((text, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-4 bg-white/20 backdrop-blur-sm rounded-xl p-4"
                              >
                                <span className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center font-bold text-xl">
                                  {i + 1}
                                </span>
                                <span className="text-xl">{text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentSlide.type === "highlight" && (
                        <div className="text-center">
                          <h2 className="text-5xl font-bold mb-6 drop-shadow-lg">
                            {currentSlide.title}
                          </h2>
                          <div className="flex justify-center gap-8">
                            {currentSlide.content.map((text, i) => (
                              <div
                                key={i}
                                className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 w-48"
                              >
                                <div className="text-4xl font-bold mb-2">{i + 1}</div>
                                <div className="text-lg">{text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentSlide.type === "interactive" && (
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎯</div>
                          <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
                            {currentSlide.title}
                          </h2>
                          {currentSlide.interaction && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
                              <p className="text-xl">{currentSlide.interaction}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {currentSlide.type === "ending" && (
                        <div className="text-center">
                          <h1 className="text-6xl font-bold mb-4 drop-shadow-lg">
                            {currentSlide.title}
                          </h1>
                          {currentSlide.content.map((text, i) => (
                            <p key={i} className="text-2xl mt-4 opacity-90">
                              {text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 页码 */}
                    <div className="absolute bottom-4 right-4 text-white/60 text-sm">
                      {currentSlideIndex + 1} / {storyboard.slides.length}
                    </div>
                  </div>
                )}
              </div>

              {/* 导航控制 */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <Button variant="outline" size="lg" onClick={prevSlide} disabled={currentSlideIndex === 0}>
                  <ChevronLeft className="w-5 h-5" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={nextSlide}
                  disabled={currentSlideIndex === storyboard.slides.length - 1}
                >
                  下一页
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* 右侧：教师讲稿 */}
            {showTeacherNote && currentSlide && (
              <div className="w-72 shrink-0 print:hidden">
                <Card className="sticky top-20 border-0 shadow-lg">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-purple-600 font-medium">
                      <Volume2 className="w-4 h-4" />
                      教师讲稿
                    </div>

                    {currentSlide.teacherNote && (
                      <div className="bg-purple-50 rounded-lg p-3 text-sm text-gray-700">
                        {currentSlide.teacherNote}
                      </div>
                    )}

                    {currentSlide.interaction && (
                      <div className="bg-pink-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-pink-600 text-sm font-medium mb-2">
                          <MessageCircle className="w-4 h-4" />
                          互动环节
                        </div>
                        <p className="text-sm text-gray-700">{currentSlide.interaction}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      <div className="font-medium mb-1">配图提示词：</div>
                      <p className="opacity-60">{currentSlide.imagePrompt}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
