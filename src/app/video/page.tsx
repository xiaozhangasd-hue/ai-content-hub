"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Video,
  Sparkles,
  Upload,
  Download,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Film,
  Wand2,
  Megaphone,
  PartyPopper,
  GraduationCap,
  Heart,
  Trophy,
  Users,
  Store,
  Settings,
  Edit3,
  AlertTriangle,
  Check,
  Play,
  Volume2,
} from "lucide-react";
import { generateVideoPrompt, type MerchantInfo, VIDEO_SCENES, VIDEO_STYLES } from "@/lib/prompt-generator";

interface VideoTask {
  taskId: string;
  status: "submitted" | "processing" | "succeed" | "failed";
  videoUrl?: string;
  prompt?: string; // 保存生成提示词
  error?: string;
  createdAt: number;
}

// 步骤配置
const STEPS = [
  { id: 1, title: "选择场景", desc: "选择视频应用场景" },
  { id: 2, title: "编辑提示词", desc: "确认生成内容" },
  { id: 3, title: "生成视频", desc: "调用AI生成" },
];

export default function VideoPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 机构信息
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);

  // 第一步：场景和风格
  const [scene, setScene] = useState("");
  const [style, setStyle] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // 第二步：提示词编辑
  const [prompt, setPrompt] = useState("");
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // 高级设置
  const [mode, setMode] = useState<"std" | "pro">("std");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");

  // 第三步：任务状态
  const [currentTask, setCurrentTask] = useState<VideoTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<VideoTask[]>([]);

  // 使用次数
  const [usageCount, setUsageCount] = useState({ used: 3, total: 20 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 加载机构信息
    const savedMerchant = localStorage.getItem("merchantInfo");
    if (savedMerchant) {
      setMerchantInfo(JSON.parse(savedMerchant));
    }

    // 加载历史任务
    const savedHistory = localStorage.getItem("videoTaskHistory");
    if (savedHistory) {
      setTaskHistory(JSON.parse(savedHistory));
    }

    // 加载使用次数
    const savedUsage = localStorage.getItem("videoUsage");
    if (savedUsage) {
      setUsageCount(JSON.parse(savedUsage));
    }

    // 检查是否有从AI聊天传递过来的预设提示词
    const pendingPrompt = localStorage.getItem("pendingVideoPrompt");
    if (pendingPrompt) {
      setPrompt(pendingPrompt);
      localStorage.removeItem("pendingVideoPrompt"); // 用完即删
      // 如果没有选择场景，自动选择默认场景
      if (!scene) {
        setScene("course_promo");
      }
      // 直接跳到第二步
      setCurrentStep(2);
      toast.success("已加载AI生成的脚本，可以直接生成或编辑修改");
    }
  }, [router]);

  // 生成提示词
  const generatePrompt = () => {
    if (!merchantInfo || !scene) {
      toast.error("请先选择场景");
      return;
    }
    const generated = generateVideoPrompt(merchantInfo, scene, style || undefined, customPrompt || undefined, duration);
    setPrompt(generated);
    toast.success("提示词已生成，可以编辑修改");
  };

  // 下一步
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!scene) {
        toast.error("请选择应用场景");
        return;
      }
      // 自动生成提示词
      generatePrompt();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!prompt.trim()) {
        toast.error("请生成或编辑提示词");
        return;
      }
      setCurrentStep(3);
    }
  };

  // 上一步
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 确认生成
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("信息不完整");
      return;
    }

    // 检查使用次数
    if (usageCount.used >= usageCount.total) {
      toast.error("本月使用次数已用完");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          model: "v2-5",
          mode,
          duration,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      // 更新使用次数
      const newUsage = { ...usageCount, used: usageCount.used + 1 };
      setUsageCount(newUsage);
      localStorage.setItem("videoUsage", JSON.stringify(newUsage));

      const newTask: VideoTask = {
        taskId: data.taskId,
        status: "submitted",
        prompt: prompt, // 保存提示词
        createdAt: Date.now(),
      };

      setCurrentTask(newTask);
      toast.success("视频已提交生成，预计2-5分钟");

      // 开始轮询
      pollTaskStatus(data.taskId, token || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string, token: string) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/kling/task/${taskId}?model=v2-5&type=text2video`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.status === "succeed") {
          setCurrentTask((prev) =>
            prev ? { ...prev, status: "succeed", videoUrl: data.result?.videoUrl } : null
          );

          setTaskHistory((prev) => {
            const existingTask = prev.find(t => t.taskId === taskId);
            const updated = [
              { 
                taskId, 
                status: "succeed" as const, 
                videoUrl: data.result?.videoUrl, 
                prompt: existingTask?.prompt || prompt,
                createdAt: Date.now() 
              },
              ...prev.filter(t => t.taskId !== taskId),
            ];
            localStorage.setItem("videoTaskHistory", JSON.stringify(updated));
            return updated;
          });

          toast.success("视频生成成功！");
          return;
        }

        if (data.status === "failed") {
          setCurrentTask((prev) =>
            prev ? { ...prev, status: "failed", error: data.error || "生成失败" } : null
          );
          toast.error(data.error || "视频生成失败");
          return;
        }

        if (data.status === "processing") {
          setCurrentTask((prev) => (prev ? { ...prev, status: "processing" } : null));
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  // 下载视频
  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("正在下载视频...");
      
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error('下载失败');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("视频下载成功！请查看下载文件夹");
    } catch (error) {
      console.error("下载错误:", error);
      try {
        window.open(url, '_blank');
        toast.info("已在新窗口打开，请右键保存视频");
      } catch {
        toast.error("下载失败，请稍后重试");
      }
    }
  };

  // 重新开始
  const handleReset = () => {
    setCurrentStep(1);
    setCurrentTask(null);
  };

  // 场景图标映射
  const getSceneIcon = (sceneId: string) => {
    const icons: Record<string, any> = {
      course_promo: GraduationCap,
      activity_show: PartyPopper,
      brand_story: Store,
      teaching_scene: Users,
      student_work: Trophy,
      environment: Heart,
    };
    const Icon = icons[sceneId] || Video;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]">
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0d1425]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">AI视频生成</h1>
              <p className="text-xs text-gray-400">一键生成专业视频</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 border-white/20 text-gray-300">
              <Clock className="w-3 h-3" />
              剩余 {usageCount.total - usageCount.used}/{usageCount.total} 次
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="gap-1 text-gray-400 hover:text-white hover:bg-white/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 机构信息提示 */}
        {!merchantInfo && (
          <Card className="mb-6 bg-amber-500/10 border-amber-500/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-300">请先配置机构信息</p>
                    <p className="text-sm text-amber-400/80">AI将根据您的机构信息智能生成视频内容</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/settings")} variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  去配置
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all ${
                    currentStep === step.id
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                      : currentStep > step.id
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-white/5 text-gray-500 border border-white/10"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep > step.id ? "bg-green-500 text-white" : ""
                    }`}
                  >
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <div className="text-sm font-medium">{step.title}</div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      currentStep > step.id ? "bg-green-400" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 第一步：选择场景和风格 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* 场景选择 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardHeader>
                <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                  <Megaphone className="w-5 h-5 text-cyan-500" />
                  选择应用场景
                </CardTitle>
                <CardDescription>选择您想要生成的视频类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VIDEO_SCENES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScene(s.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        scene === s.id
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 shadow-md"
                          : isDark
                          ? "border-white/10 hover:border-white/20 bg-white/5"
                          : "border-gray-100 hover:border-gray-200 bg-white"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                          scene === s.id ? "bg-cyan-500 text-white" : isDark ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {getSceneIcon(s.id)}
                      </div>
                      <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.name}</div>
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 风格选择 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardHeader>
                <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                  <Film className="w-5 h-5 text-purple-500" />
                  视频风格（可选）
                </CardTitle>
                <CardDescription>选择视频的整体风格</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {VIDEO_STYLES.map((s) => (
                    <Badge
                      key={s}
                      variant={style === s ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 transition-all ${
                        style === s
                          ? "bg-cyan-600 text-white hover:bg-cyan-700"
                          : isDark
                          ? "border-white/20 text-gray-300 hover:bg-white/10"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setStyle(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 补充说明 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardHeader>
                <CardTitle className={`text-base ${isDark ? 'text-white' : ''}`}>补充说明（可选）</CardTitle>
                <CardDescription>添加特殊要求，如具体场景描述、时间等</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="例如：展示孩子们在明亮的教室里画画，老师在一旁指导"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className={`min-h-[100px] focus:border-cyan-300 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200'}`}
                />
              </CardContent>
            </Card>

            <Button
              onClick={handleNextStep}
              disabled={!scene}
              className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              下一步：编辑提示词
            </Button>
          </div>
        )}

        {/* 第二步：编辑提示词 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* 提示词编辑 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                      <Edit3 className="w-5 h-5 text-blue-500" />
                      AI生成的提示词
                    </CardTitle>
                    <CardDescription>可以编辑修改，越详细效果越好</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={generatePrompt} className={`gap-1 ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/10' : ''}`}>
                    <Wand2 className="w-3 h-3" />
                    重新生成
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="点击「重新生成」或直接编辑..."
                  className={`min-h-[200px] focus:border-cyan-300 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200'}`}
                />
              </CardContent>
            </Card>

            {/* 高级设置 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardHeader>
                <CardTitle className={`text-base ${isDark ? 'text-white' : ''}`}>高级设置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`text-sm mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>画质</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as "std" | "pro")}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <option value="std">标准</option>
                      <option value="pro">高清</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>时长</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <option value={5}>5秒（推荐）</option>
                      <option value={10}>10秒</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-sm mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>比例</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <option value="16:9">横屏</option>
                      <option value="9:16">竖屏（推荐）</option>
                      <option value="1:1">方形</option>
                    </select>
                  </div>
                </div>
                
                {/* 提示 */}
                <div className={`mt-4 p-3 rounded-lg text-xs ${isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                  <p className="font-medium mb-1">💡 视频时长建议</p>
                  <p>• 5秒：适合朋友圈/短视频，1个核心画面</p>
                  <p>• 10秒：可展示2-3个场景切换</p>
                  <p>• 提示词要精简，避免内容过多导致截断</p>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className={`flex-1 h-12 ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/10' : ''}`}>
                上一步
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!prompt.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                下一步：确认生成
              </Button>
            </div>
          </div>
        )}

        {/* 第三步：确认生成 */}
        {currentStep === 3 && !currentTask && (
          <div className="space-y-6">
            {/* 最终确认 */}
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'} overflow-hidden`}>
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">确认生成视频</h3>
                <p className="text-white/80 text-sm">请仔细核对以下信息，确认后将消耗1次生成机会</p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 场景 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>应用场景</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{VIDEO_SCENES.find((s) => s.id === scene)?.name}</p>
                    </div>
                    <Badge variant="outline" className={isDark ? 'border-white/20 text-gray-300' : ''}>{style || "默认风格"}</Badge>
                  </div>

                  <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`} />

                  {/* 提示词 */}
                  <div>
                    <p className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>生成提示词</p>
                    <div className={`rounded-lg p-3 text-sm max-h-[200px] overflow-y-auto ${isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                      {prompt}
                    </div>
                  </div>

                  <div className={`border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`} />

                  {/* 设置 */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>画质</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{mode === "pro" ? "高清" : "标准"}</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>时长</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{duration}秒</p>
                    </div>
                    <div>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>比例</p>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {aspectRatio === "16:9" ? "横屏" : aspectRatio === "9:16" ? "竖屏" : "方形"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 警告提示 */}
            <Card className={`${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className={`font-medium ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>确认后将消耗使用次数</p>
                    <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      生成后本月剩余 {usageCount.total - usageCount.used - 1} 次，视频生成约需2-5分钟
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className={`flex-1 h-12 ${isDark ? 'border-white/10 text-gray-300 hover:bg-white/10' : ''}`}>
                返回修改
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || usageCount.used >= usageCount.total}
                className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    确认生成视频
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 生成中/结果 */}
        {currentTask && (
          <div className="space-y-6">
            <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'}`}>
              <CardContent className="py-6">
                {currentTask.status === "submitted" || currentTask.status === "processing" ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>正在生成视频</h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预计需要2-5分钟，请耐心等待...</p>
                  </div>
                ) : currentTask.status === "succeed" && currentTask.videoUrl ? (
                  <div className="space-y-4">
                    {/* 成功提示 */}
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${isDark ? 'text-green-300 bg-green-500/10' : 'text-green-600 bg-green-50'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">视频生成成功！</span>
                    </div>
                    
                    {/* 视频预览 */}
                    <div className={`aspect-video rounded-xl overflow-hidden shadow-inner ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <video src={currentTask.videoUrl} controls className="w-full h-full object-contain" />
                    </div>
                    
                    {/* 音频提示 */}
                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                      <Volume2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <div className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                        <p className="font-medium">生成的视频没有声音</p>
                        <p className="text-xs mt-1">可以到「视频剪辑」添加背景音乐和AI配音</p>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => handleDownload(currentTask.videoUrl!, `video-${currentTask.taskId}.mp4`)}
                        className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-base font-medium shadow-lg shadow-green-500/30"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        下载视频
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/video/edit")}
                        className={`h-12 ${isDark ? 'border-purple-500/30 text-purple-300 hover:bg-purple-500/10' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}`}
                      >
                        <Video className="w-5 h-5 mr-2" />
                        去剪辑配音
                      </Button>
                    </div>
                    
                    <Button variant="ghost" onClick={handleReset} className={`w-full ${isDark ? 'text-gray-300 hover:bg-white/10' : ''}`}>
                      再做一个
                    </Button>
                    
                    {/* 提示 */}
                    <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      💡 下载后可在本地播放，支持分享到微信、抖音等平台
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>生成失败</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{currentTask.error || "请重试"}</p>
                    <Button onClick={handleReset}>重新开始</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 历史记录 */}
        {taskHistory.length > 0 && !currentTask && (
          <Card className={`${isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-0 shadow-sm'} mt-6`}>
            <CardHeader>
              <CardTitle className={`text-base flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                <Clock className="w-4 h-4" />
                生成历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taskHistory.slice(0, 5).map((task) => (
                  <div key={task.taskId} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {task.status === "succeed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(task.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {task.videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(task.videoUrl!, `video-${task.taskId}.mp4`)}
                        className={isDark ? 'text-gray-300 hover:bg-white/10' : ''}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
