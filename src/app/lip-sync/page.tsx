"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Mic,
  Sparkles,
  Upload,
  Download,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Volume2,
  Image as ImageIcon,
  Video,
  Settings,
  Play,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Check,
  ChevronDown,
} from "lucide-react";

interface LipSyncTask {
  taskId: string;
  status: "submitted" | "processing" | "succeed" | "failed";
  videoUrl?: string;
  prompt?: string; // 保存音频文本
  error?: string;
  createdAt: number;
}

// 音色选项 - 高质量自然语音
const VOICE_OPTIONS = [
  // 女声
  { id: "female-tianmei", name: "甜美女声", desc: "温柔甜美，适合教育场景", gender: "female", category: "推荐" },
  { id: "female-shaonv", name: "活泼少女", desc: "亲切活泼，适合儿童教育", gender: "female", category: "推荐" },
  { id: "female-chengshu", name: "成熟女声", desc: "稳重专业，适合商务介绍", gender: "female", category: "女声" },
  { id: "genshin_vindi2", name: "温柔女声", desc: "柔美自然，通用性强", gender: "female", category: "女声" },
  { id: "zhinen_xuesheng", name: "知性女声", desc: "知性优雅，适合知识分享", gender: "female", category: "女声" },
  // 男声
  { id: "male-qn-qingxu", name: "情感男声", desc: "富有感染力，适合品牌故事", gender: "male", category: "推荐" },
  { id: "male-chengshu", name: "沉稳男声", desc: "专业可靠，适合正式场合", gender: "male", category: "男声" },
  { id: "presenter_male", name: "主持人", desc: "播音腔，适合宣传活动", gender: "male", category: "男声" },
  { id: "AOT", name: "磁性男声", desc: "声音浑厚，富有磁性", gender: "male", category: "男声" },
  // 特殊
  { id: "PeppaPig_platform", name: "可爱童声", desc: "活泼可爱，适合儿童内容", gender: "child", category: "童声" },
];

// 步骤配置
const STEPS = [
  { id: 1, title: "上传素材", desc: "图片或视频" },
  { id: 2, title: "编辑文案", desc: "确认文案和音色" },
  { id: 3, title: "生成视频", desc: "调用AI生成" },
];

// 示例文案
const SAMPLE_SCRIPTS = [
  "大家好，欢迎来到我们的机构！我们专注于为每一位学员提供个性化的教学服务。",
  "课程火热报名中！现在报名，立享早鸟优惠，名额有限，先到先得！",
  "端午节快乐！祝愿大家阖家幸福，身体健康，万事如意！",
];

export default function LipSyncPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // 第一步：素材
  const [materialType, setMaterialType] = useState<"image" | "video">("image");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialName, setMaterialName] = useState("");

  // 第二步：文案和音色
  const [script, setScript] = useState("");
  const [voiceId, setVoiceId] = useState("zhinen_xuesheng");

  // 第三步：生成状态
  const [currentTask, setCurrentTask] = useState<LipSyncTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<LipSyncTask[]>([]);

  // 使用次数
  const [usageCount, setUsageCount] = useState({ used: 1, total: 10 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 加载历史任务
    const savedHistory = localStorage.getItem("lipsyncTaskHistory");
    if (savedHistory) {
      setTaskHistory(JSON.parse(savedHistory));
    }

    // 加载使用次数
    const savedUsage = localStorage.getItem("lipsyncUsage");
    if (savedUsage) {
      setUsageCount(JSON.parse(savedUsage));
    }

    // 检查是否有从AI聊天传递过来的预设文案
    const pendingScript = localStorage.getItem("pendingLipsyncScript");
    if (pendingScript) {
      setScript(pendingScript);
      localStorage.removeItem("pendingLipsyncScript");
      toast.success("已加载AI生成的文案，请上传素材");
    }
  }, [router]);

  // 素材上传
  const handleMaterialUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("文件大小不能超过20MB");
        return;
      }

      const isVideo = file.type.startsWith("video/");
      setMaterialType(isVideo ? "video" : "image");

      const reader = new FileReader();
      reader.onloadend = () => {
        setMaterialUrl(reader.result as string);
        setMaterialName(file.name);
        toast.success("素材上传成功");
      };
      reader.readAsDataURL(file);
    }
  };

  // 下一步
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!materialUrl) {
        toast.error("请上传图片或视频素材");
        return;
      }
      // 默认填充示例文案
      if (!script) {
        setScript(SAMPLE_SCRIPTS[0]);
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!script.trim()) {
        toast.error("请编辑文案");
        return;
      }
      if (script.length > 120) {
        toast.error("文案不能超过120个字符");
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
    if (!materialUrl || !script) {
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

      const response = await fetch("/api/kling/lip-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: materialUrl,
          text: script,
          voiceId: voiceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      // 更新使用次数
      const newUsage = { ...usageCount, used: usageCount.used + 1 };
      setUsageCount(newUsage);
      localStorage.setItem("lipsyncUsage", JSON.stringify(newUsage));

      const newTask: LipSyncTask = {
        taskId: data.taskId,
        status: "submitted",
        prompt: script, // 保存脚本内容
        createdAt: Date.now(),
      };

      setCurrentTask(newTask);
      toast.success("对口型视频已提交生成，预计2-5分钟");

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
        const response = await fetch(`/api/kling/task/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (data.status === "succeed") {
          setCurrentTask((prev) =>
            prev ? { ...prev, status: "succeed", videoUrl: data.videoUrl } : null
          );

          setTaskHistory((prev) => {
            const existingTask = prev.find(t => t.taskId === taskId);
            const updated = [
              { 
                taskId, 
                status: "succeed" as const, 
                videoUrl: data.videoUrl, 
                prompt: existingTask?.prompt || script,
                createdAt: Date.now() 
              },
              ...prev.filter(t => t.taskId !== taskId),
            ];
            localStorage.setItem("lipsyncTaskHistory", JSON.stringify(updated));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]">
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0d1425]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">AI对口型</h1>
              <p className="text-xs text-gray-500">让图片/视频开口说话</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Clock className="w-3 h-3" />
              剩余 {usageCount.total - usageCount.used}/{usageCount.total} 次
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} className="gap-1 text-gray-600">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all ${
                    currentStep === step.id
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                      : currentStep > step.id
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
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
                      currentStep > step.id ? "bg-green-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 第一步：上传素材 */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {materialType === "image" ? (
                    <ImageIcon className="w-5 h-5 text-pink-500" />
                  ) : (
                    <Video className="w-5 h-5 text-pink-500" />
                  )}
                  上传图片或视频
                </CardTitle>
                <CardDescription>上传正面清晰的人物照片或视频，AI将让ta开口说话</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <label className="cursor-pointer block shrink-0">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMaterialUpload}
                    />
                    <div
                      className={`w-36 h-36 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                        materialUrl ? "border-pink-500" : "border-gray-300 hover:border-pink-400 bg-gray-50"
                      }`}
                    >
                      {materialUrl ? (
                        materialType === "image" ? (
                          <img src={materialUrl} alt="素材" className="w-full h-full object-cover" />
                        ) : (
                          <video src={materialUrl} className="w-full h-full object-cover" muted />
                        )
                      ) : (
                        <div className="text-center p-4">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-500">点击上传</span>
                        </div>
                      )}
                    </div>
                  </label>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm font-medium text-gray-700">上传要求</p>
                    <ul className="text-sm text-gray-500 space-y-1.5">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        支持图片和视频素材
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        人物正面清晰，五官可见
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        图片建议 800x800 以上
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        视频时长建议 5-30 秒
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 示例文案提示 */}
            <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
              <CardContent className="py-4">
                <p className="text-sm text-pink-800">
                  💡 提示：上传素材后，下一步可以编辑让ta说什么。你也可以从AI顾问那里获取推荐文案！
                </p>
              </CardContent>
            </Card>

            <Button
              onClick={handleNextStep}
              disabled={!materialUrl}
              className="w-full h-12 text-base font-medium gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              下一步：编辑文案
            </Button>
          </div>
        )}

        {/* 第二步：编辑文案和选择音色 */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* 文案编辑 */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-blue-500" />
                      讲解文案
                    </CardTitle>
                    <CardDescription>可以编辑修改，限制120字以内</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="输入你想让ta说的话..."
                  className="min-h-[120px] bg-gray-50 border-gray-200 focus:border-pink-300"
                  maxLength={150}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">示例：</span>
                    {SAMPLE_SCRIPTS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setScript(s)}
                        className="text-xs text-pink-600 hover:text-pink-700"
                      >
                        示例{i + 1}
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs ${script.length > 120 ? "text-red-500" : "text-gray-500"}`}>
                    {script.length}/120
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 音色选择 */}
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-pink-500" />
                  选择音色
                </CardTitle>
                <CardDescription>选择说话的声音风格，建议使用"推荐"音色</CardDescription>
              </CardHeader>
              <CardContent>
                {/* 推荐音色 */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-pink-600 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    推荐音色
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {VOICE_OPTIONS.filter(v => v.category === "推荐").map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setVoiceId(voice.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          voiceId === voice.id
                            ? "border-pink-500 bg-pink-50 shadow-md"
                            : "border-gray-100 hover:border-pink-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              voiceId === voice.id ? "bg-pink-500 text-white" : "bg-gradient-to-br from-pink-100 to-rose-100"
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{voice.name}</div>
                            <div className="text-xs text-gray-500 truncate">{voice.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 更多音色 */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                    查看更多音色
                  </summary>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {VOICE_OPTIONS.filter(v => v.category !== "推荐").map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => setVoiceId(voice.id)}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          voiceId === voice.id
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                              voiceId === voice.id ? "bg-pink-500 text-white" : "bg-gray-100"
                            }`}
                          >
                            {voice.gender === "female" ? "♀" : voice.gender === "male" ? "♂" : "👧"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{voice.name}</div>
                            <div className="text-xs text-gray-500 truncate">{voice.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 h-12">
                上一步
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!script.trim() || script.length > 120}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500"
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
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">确认生成对口型视频</h3>
                <p className="text-white/80 text-sm">请仔细核对以下信息，确认后将消耗1次生成机会</p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 素材预览 */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {materialType === "image" ? (
                        <img src={materialUrl} alt="素材" className="w-full h-full object-cover" />
                      ) : (
                        <video src={materialUrl} className="w-full h-full object-cover" muted />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">素材</p>
                      <p className="text-sm text-gray-500">{materialType === "image" ? "图片" : "视频"}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* 文案 */}
                  <div>
                    <p className="font-medium text-gray-900 mb-2">说话内容</p>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{script}</div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* 音色 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">音色选择</p>
                      <p className="text-sm text-gray-500">{VOICE_OPTIONS.find((v) => v.id === voiceId)?.name}</p>
                    </div>
                    <Badge variant="outline">{VOICE_OPTIONS.find((v) => v.id === voiceId)?.desc}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 警告提示 */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">确认后将消耗使用次数</p>
                    <p className="text-sm text-amber-700">
                      生成后本月剩余 {usageCount.total - usageCount.used - 1} 次，请确认信息无误
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrevStep} className="flex-1 h-12">
                返回修改
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isLoading || usageCount.used >= usageCount.total}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500"
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
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="py-6">
                {currentTask.status === "submitted" || currentTask.status === "processing" ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">正在生成对口型视频</h3>
                    <p className="text-sm text-gray-500">预计需要2-5分钟，请耐心等待...</p>
                  </div>
                ) : currentTask.status === "succeed" && currentTask.videoUrl ? (
                  <div className="space-y-4">
                    {/* 成功提示 */}
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-lg px-4 py-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">视频生成成功！点击下方按钮下载</span>
                    </div>
                    
                    {/* 视频预览 */}
                    <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                      <video src={currentTask.videoUrl} controls className="w-full h-full object-contain" />
                    </div>
                    
                    {/* 下载按钮 */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDownload(currentTask.videoUrl!, `lipsync-${currentTask.taskId}.mp4`)}
                        className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-base font-medium shadow-lg shadow-green-500/30"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        下载视频
                      </Button>
                      <Button variant="outline" onClick={handleReset} className="h-12">
                        再做一个
                      </Button>
                    </div>
                    
                    {/* 提示 */}
                    <p className="text-xs text-gray-500 text-center">
                      💡 下载后可在本地播放，支持分享到微信、抖音等平台
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">生成失败</h3>
                    <p className="text-sm text-gray-500 mb-4">{currentTask.error || "请重试"}</p>
                    <Button onClick={handleReset}>重新开始</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 历史记录 */}
        {taskHistory.length > 0 && !currentTask && (
          <Card className="bg-white border-0 shadow-sm mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                生成历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {taskHistory.slice(0, 5).map((task) => (
                  <div key={task.taskId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {task.status === "succeed" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    {task.videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(task.videoUrl!, `lipsync-${task.taskId}.mp4`)}
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
