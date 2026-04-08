"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Video,
  Music,
  Mic,
  Sparkles,
  Download,
  ArrowLeft,
  Plus,
  X,
  Play,
  Loader2,
  Trash2,
  GripVertical,
  Volume2,
  Settings,
} from "lucide-react";

interface VideoClip {
  id: string;
  url: string;
  duration: number;
  name: string;
  thumbnail?: string;
}

interface BGMOption {
  id: string;
  name: string;
  url: string;
  category: string;
}

// 预设背景音乐
const BGM_OPTIONS: BGMOption[] = [
  { id: "happy", name: "欢乐轻快", url: "/bgm/happy.mp3", category: "欢快" },
  { id: "warm", name: "温馨治愈", url: "/bgm/warm.mp3", category: "温馨" },
  { id: "energetic", name: "活力动感", url: "/bgm/energetic.mp3", category: "动感" },
  { id: "peaceful", name: "宁静优美", url: "/bgm/peaceful.mp3", category: "优美" },
];

// 音色选项
const VOICE_OPTIONS = [
  { id: "zh_female_tianmei", name: "甜美女声", desc: "温柔亲切" },
  { id: "zh_male_chunhou", name: "醇厚男声", desc: "稳重专业" },
  { id: "zh_female_wanwan", name: "婉婉女声", desc: "清新自然" },
  { id: "zh_male_qinglang", name: "清朗男声", desc: "阳光活力" },
  { id: "zh_child_kawaii", name: "童声可爱", desc: "活泼童趣" },
];

export default function VideoEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 视频片段列表
  const [clips, setClips] = useState<VideoClip[]>([]);
  
  // 背景音乐
  const [selectedBGM, setSelectedBGM] = useState<string>("");
  const [bgmVolume, setBgmVolume] = useState(0.3);
  
  // AI配音
  const [enableVoiceover, setEnableVoiceover] = useState(false);
  const [voiceoverText, setVoiceoverText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("zh_female_tianmei");
  
  // 结果
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  
  // 从历史任务加载可用视频
  useEffect(() => {
    const savedHistory = localStorage.getItem("videoTaskHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const succeededVideos = history
        .filter((task: any) => task.status === "succeed" && task.videoUrl)
        .map((task: any) => ({
          id: task.taskId,
          url: task.videoUrl,
          duration: 5, // 默认5秒
          name: `视频 ${new Date(task.createdAt).toLocaleString()}`,
        }));
      
      if (succeededVideos.length > 0) {
        toast.info(`发现 ${succeededVideos.length} 个已生成的视频，可以选择添加`);
      }
    }
  }, []);

  // 添加视频片段
  const handleAddClip = () => {
    // 从历史记录中选择
    const savedHistory = localStorage.getItem("videoTaskHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const available = history.filter((task: any) => task.status === "succeed" && task.videoUrl);
      
      if (available.length === 0) {
        toast.error("没有可用的视频，请先生成视频");
        router.push("/video");
        return;
      }
      
      // 添加第一个未添加的视频
      const addedIds = clips.map(c => c.id);
      const toAdd = available.find((task: any) => !addedIds.includes(task.taskId));
      
      if (toAdd) {
        setClips(prev => [...prev, {
          id: toAdd.taskId,
          url: toAdd.videoUrl,
          duration: 5,
          name: `视频 ${new Date(toAdd.createdAt).toLocaleString()}`,
        }]);
        toast.success("已添加视频片段");
      } else {
        toast.info("所有视频都已添加");
      }
    }
  };

  // 移除视频片段
  const handleRemoveClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  };

  // 合成视频
  const handleCompose = async () => {
    if (clips.length === 0) {
      toast.error("请至少添加一个视频片段");
      return;
    }

    setIsLoading(true);
    setResultVideoUrl(null);

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/video/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clips: clips.map(c => ({ url: c.url, duration: c.duration })),
          bgm: selectedBGM ? { url: BGM_OPTIONS.find(b => b.id === selectedBGM)?.url, volume: bgmVolume } : null,
          voiceover: enableVoiceover && voiceoverText ? { text: voiceoverText, voiceId: selectedVoice } : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "合成失败");
      }

      // 保存任务ID用于下载
      localStorage.setItem("lastComposedVideo", JSON.stringify({
        taskId: data.taskId,
        downloadUrl: data.downloadUrl,
        duration: data.duration,
        createdAt: Date.now(),
      }));
      
      // 构建完整下载URL
      const downloadUrl = data.downloadUrl.startsWith("http") 
        ? data.downloadUrl 
        : `${window.location.origin}${data.downloadUrl}`;
      
      setResultVideoUrl(downloadUrl);
      toast.success("视频合成成功！");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "合成失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 下载视频
  const handleDownload = async () => {
    const saved = localStorage.getItem("lastComposedVideo");
    if (!saved) return;
    
    const { downloadUrl } = JSON.parse(saved);
    const fullUrl = downloadUrl.startsWith("http") 
      ? downloadUrl 
      : `${window.location.origin}${downloadUrl}`;
    
    try {
      toast.info("正在下载...");
      
      // 使用API下载
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("下载失败");
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `composed-video-${Date.now()}.mp4`;
      link.click();
      
      URL.revokeObjectURL(blobUrl);
      toast.success("下载成功！");
    } catch (error) {
      toast.error("下载失败，请在新窗口打开");
      window.open(fullUrl, '_blank');
    }
  };

  // 计算总时长
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]">
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0d1425]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">视频剪辑</h1>
              <p className="text-xs text-gray-400">拼接、配音、加BGM</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：视频片段列表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 视频片段 */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-white">视频片段</CardTitle>
                    <CardDescription className="text-gray-400">添加已生成的视频片段，按顺序播放</CardDescription>
                  </div>
                  <Button onClick={handleAddClip} size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    添加片段
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clips.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>暂无视频片段</p>
                    <p className="text-sm mt-1">点击"添加片段"从已生成的视频中选择</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/video")}
                      className="mt-3 border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      去生成视频
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clips.map((clip, index) => (
                      <div
                        key={clip.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-white/10">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                              片段 {index + 1}
                            </Badge>
                            <span className="text-sm text-gray-400">{clip.duration}秒</span>
                          </div>
                          <p className="text-sm text-white truncate mt-1">{clip.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(clip.url, '_blank')}
                          className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveClip(clip.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-white/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {clips.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      共 <span className="font-medium text-white">{clips.length}</span> 个片段
                    </span>
                    <span className="text-gray-400">
                      总时长 <span className="font-medium text-white">{totalDuration}</span> 秒
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 背景音乐 */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Music className="w-5 h-5 text-purple-500" />
                  背景音乐
                </CardTitle>
                <CardDescription className="text-gray-400">选择背景音乐，提升视频氛围</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BGM_OPTIONS.map((bgm) => (
                    <button
                      key={bgm.id}
                      onClick={() => setSelectedBGM(selectedBGM === bgm.id ? "" : bgm.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedBGM === bgm.id
                          ? "border-purple-500 bg-purple-500/10"
                          : "border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                    >
                      <div className="font-medium text-sm text-white">{bgm.name}</div>
                      <div className="text-xs text-gray-400">{bgm.category}</div>
                    </button>
                  ))}
                </div>
                
                {selectedBGM && (
                  <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                    <Volume2 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">音量</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={bgmVolume}
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-400 w-10">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI配音 */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-white">
                      <Mic className="w-5 h-5 text-blue-500" />
                      AI配音
                    </CardTitle>
                    <CardDescription className="text-gray-400">添加专业配音，提升视频品质</CardDescription>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableVoiceover}
                      onChange={(e) => setEnableVoiceover(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-400">启用配音</span>
                  </label>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {enableVoiceover ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">配音文案</label>
                      <Textarea
                        placeholder="输入配音文案，AI将自动生成语音..."
                        value={voiceoverText}
                        onChange={(e) => setVoiceoverText(e.target.value)}
                        className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-500">
                        建议字数：{totalDuration * 3}字左右（每秒约3字）
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">选择音色</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {VOICE_OPTIONS.map((voice) => (
                          <button
                            key={voice.id}
                            onClick={() => setSelectedVoice(voice.id)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                              selectedVoice === voice.id
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-white/10 hover:border-white/20 bg-white/5"
                            }`}
                          >
                            <div className="font-medium text-sm text-white">{voice.name}</div>
                            <div className="text-xs text-gray-400">{voice.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    勾选"启用配音"后，可以添加AI语音旁白
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 合成按钮 */}
            <Button
              onClick={handleCompose}
              disabled={isLoading || clips.length === 0}
              className="w-full h-14 text-base font-medium gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  合成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  合成视频
                </>
              )}
            </Button>
          </div>

          {/* 右侧：预览和结果 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 合成设置预览 */}
            <Card className="bg-white/[0.03] border-white/5">
              <CardHeader>
                <CardTitle className="text-base text-white">合成预览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">视频片段</span>
                  <span className="font-medium text-white">{clips.length} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">总时长</span>
                  <span className="font-medium text-white">{totalDuration} 秒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">背景音乐</span>
                  <span className="font-medium text-white">
                    {selectedBGM ? BGM_OPTIONS.find(b => b.id === selectedBGM)?.name : "无"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">AI配音</span>
                  <span className="font-medium text-white">
                    {enableVoiceover && voiceoverText ? `${voiceoverText.length}字` : "无"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 合成结果 */}
            {resultVideoUrl && (
              <Card className="bg-white/[0.03] border-white/5 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">合成结果</CardTitle>
                    <Badge className="bg-green-500/20 text-green-400">完成</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={resultVideoUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                  
                  <Button
                    onClick={handleDownload}
                    className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    下载视频
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 使用提示 */}
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="py-4">
                <div className="space-y-2 text-sm text-blue-300">
                  <p className="font-medium">💡 使用提示</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>可添加多个视频片段自动拼接</li>
                    <li>背景音乐可提升视频氛围</li>
                    <li>配音字数建议每秒3字左右</li>
                    <li>合成后视频时长为片段总时长</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
