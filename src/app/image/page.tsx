"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Store,
  Settings,
  Megaphone,
  Palette,
  Award,
  PartyPopper,
  Layout,
  Wand2,
  ExternalLink,
  Type,
  AlignCenter,
  AlignLeft,
  AlignRight,
} from "lucide-react";
import { generateImagePrompt, type MerchantInfo, SUBJECT_CATEGORIES, IMAGE_ART_STYLES } from "@/lib/prompt-generator";

interface ImageTask {
  taskId: string;
  status: "pending" | "processing" | "succeed" | "failed";
  imageUrl?: string;
  prompt?: string; // 保存生成提示词
  error?: string;
  createdAt: number;
}

// 海报文案配置
interface PosterText {
  title: string;           // 主标题
  subtitle: string;        // 副标题
  body: string;            // 正文/优惠信息
  phone: string;           // 联系电话
  address: string;         // 地址
  position: "top" | "center" | "bottom"; // 文字位置
  textColor: string;       // 文字颜色
  fontSize: "small" | "medium" | "large"; // 字体大小
}

// 图片场景
const IMAGE_SCENES = [
  { id: "poster", name: "招生海报", description: "适合朋友圈、微信群推广", icon: Megaphone },
  { id: "banner", name: "横幅广告", description: "适合公众号、网站头图", icon: Layout },
  { id: "card", name: "课程卡片", description: "适合课程介绍、价目表", icon: Palette },
  { id: "certificate", name: "荣誉证书", description: "展示机构资质、学员成果", icon: Award },
  { id: "activity", name: "活动宣传", description: "节日活动、促销优惠", icon: PartyPopper },
];

// 文字颜色选项
const TEXT_COLORS = [
  { id: "white", name: "白色", value: "#ffffff" },
  { id: "black", name: "黑色", value: "#000000" },
  { id: "red", name: "红色", value: "#dc2626" },
  { id: "blue", name: "蓝色", value: "#2563eb" },
  { id: "orange", name: "橙色", value: "#ea580c" },
  { id: "green", name: "绿色", value: "#16a34a" },
  { id: "purple", name: "紫色", value: "#9333ea" },
  { id: "yellow", name: "黄色", value: "#eab308" },
];

export default function ImagePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 机构信息
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  
  // 场景选择
  const [scene, setScene] = useState("");
  const [subject, setSubject] = useState("");
  const [customText, setCustomText] = useState("");
  const [artStyle, setArtStyle] = useState("cartoon");
  
  // 图片尺寸
  const [imageSize, setImageSize] = useState<"1024x1024" | "1280x720" | "720x1280">("1024x1024");
  
  // 海报文案配置
  const [posterText, setPosterText] = useState<PosterText>({
    title: "",
    subtitle: "",
    body: "",
    phone: "",
    address: "",
    position: "bottom",
    textColor: "#ffffff",
    fontSize: "medium",
  });
  
  // 是否叠加文字
  const [enableTextOverlay, setEnableTextOverlay] = useState(true);
  
  // 任务状态
  const [currentTask, setCurrentTask] = useState<ImageTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<ImageTask[]>([]);
  
  // 合成后的图片URL
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // 加载机构信息
    const savedMerchant = localStorage.getItem("merchantInfo");
    if (savedMerchant) {
      const merchant = JSON.parse(savedMerchant);
      setMerchantInfo(merchant);
      // 默认选择第一个科目
      if (merchant.subjects?.length > 0) {
        setSubject(merchant.subjects[0]);
      }
      // 预填海报文案
      setPosterText(prev => ({
        ...prev,
        title: merchant.name || "",
        phone: merchant.phone || "",
        address: `${merchant.city || ""}${merchant.address || ""}`,
      }));
    }
    
    // 加载历史任务
    const savedHistory = localStorage.getItem("imageTaskHistory");
    if (savedHistory) {
      setTaskHistory(JSON.parse(savedHistory));
    }

    // 检查是否有从AI聊天传递过来的预设提示词
    const pendingPrompt = localStorage.getItem("pendingImagePrompt");
    if (pendingPrompt) {
      setCustomText(pendingPrompt);
      localStorage.removeItem("pendingImagePrompt");
      toast.success("已加载AI生成的提示词");
    }
  }, [router]);

  // 保存历史任务
  useEffect(() => {
    if (taskHistory.length > 0) {
      localStorage.setItem("imageTaskHistory", JSON.stringify(taskHistory.slice(0, 10)));
    }
  }, [taskHistory]);

  // 获取可用科目列表
  const availableSubjects = merchantInfo?.category 
    ? SUBJECT_CATEGORIES[merchantInfo.category as keyof typeof SUBJECT_CATEGORIES] || []
    : [];

  // 生成提示词（提示AI不要生成文字，留出空间）
  const getGeneratedPrompt = () => {
    if (!merchantInfo || !scene) return "";
    
    // 如果启用文字叠加，提示AI不要生成文字
    const noTextInstruction = enableTextOverlay 
      ? "\n【重要】：图片中不要包含任何文字内容，文字区域请留白，后续会添加文字。只生成纯视觉元素的背景图片。"
      : "";
    
    return generateImagePrompt(merchantInfo, {
      sceneId: scene,
      subject: subject || undefined,
      customText: customText || undefined,
      artStyle: artStyle,
    }) + noTextInstruction;
  };

  // 在Canvas上叠加文字
  const overlayTextOnImage = useCallback(async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject(new Error("Canvas未初始化"));
          return;
        }
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("无法获取Canvas上下文"));
          return;
        }
        
        // 设置Canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 字体大小映射
        const fontSizeMap = {
          small: { title: 32, subtitle: 20, body: 16, info: 14 },
          medium: { title: 48, subtitle: 28, body: 20, info: 16 },
          large: { title: 64, subtitle: 36, body: 24, info: 18 },
        };
        const fonts = fontSizeMap[posterText.fontSize];
        
        // 文字位置计算
        const padding = 40;
        let startY = padding;
        
        if (posterText.position === "bottom") {
          // 计算文字总高度
          const lines: { text: string; fontSize: number; isBold?: boolean }[] = [];
          
          if (posterText.title) {
            lines.push({ text: posterText.title, fontSize: fonts.title, isBold: true });
          }
          if (posterText.subtitle) {
            lines.push({ text: posterText.subtitle, fontSize: fonts.subtitle });
          }
          if (posterText.body) {
            // 正文可能需要换行
            const bodyLines = posterText.body.split('\n');
            bodyLines.forEach(line => {
              lines.push({ text: line, fontSize: fonts.body });
            });
          }
          if (posterText.phone) {
            lines.push({ text: `📞 ${posterText.phone}`, fontSize: fonts.info });
          }
          if (posterText.address) {
            lines.push({ text: `📍 ${posterText.address}`, fontSize: fonts.info });
          }
          
          const totalHeight = lines.reduce((sum, line) => sum + line.fontSize * 1.5, padding * 2);
          startY = canvas.height - totalHeight;
        } else if (posterText.position === "center") {
          startY = canvas.height / 2 - 100;
        }
        
        // 设置文字样式
        ctx.textAlign = "center";
        ctx.fillStyle = posterText.textColor;
        
        // 添加文字阴影效果（提高可读性）
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const centerX = canvas.width / 2;
        let currentY = startY;
        
        // 绘制标题
        if (posterText.title) {
          ctx.font = `bold ${fonts.title}px "Microsoft YaHei", "PingFang SC", sans-serif`;
          ctx.fillText(posterText.title, centerX, currentY);
          currentY += fonts.title * 1.3;
        }
        
        // 绘制副标题
        if (posterText.subtitle) {
          ctx.font = `${fonts.subtitle}px "Microsoft YaHei", "PingFang SC", sans-serif`;
          ctx.fillText(posterText.subtitle, centerX, currentY);
          currentY += fonts.subtitle * 1.4;
        }
        
        // 绘制正文
        if (posterText.body) {
          ctx.font = `${fonts.body}px "Microsoft YaHei", "PingFang SC", sans-serif`;
          const bodyLines = posterText.body.split('\n');
          bodyLines.forEach(line => {
            ctx.fillText(line, centerX, currentY);
            currentY += fonts.body * 1.5;
          });
        }
        
        // 绘制联系信息
        if (posterText.phone || posterText.address) {
          currentY += 10;
          
          if (posterText.phone) {
            ctx.font = `${fonts.info}px "Microsoft YaHei", "PingFang SC", sans-serif`;
            ctx.fillText(`📞 ${posterText.phone}`, centerX, currentY);
            currentY += fonts.info * 1.5;
          }
          
          if (posterText.address) {
            ctx.font = `${fonts.info}px "Microsoft YaHei", "PingFang SC", sans-serif`;
            // 地址如果太长，需要换行
            const maxWidth = canvas.width - padding * 2;
            if (ctx.measureText(`📍 ${posterText.address}`).width > maxWidth) {
              ctx.fillText(`📍 ${posterText.address.slice(0, 20)}...`, centerX, currentY);
            } else {
              ctx.fillText(`📍 ${posterText.address}`, centerX, currentY);
            }
          }
        }
        
        // 转换为Blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error("转换图片失败"));
          }
        }, "image/png");
      };
      
      img.onerror = () => {
        reject(new Error("图片加载失败"));
      };
      
      img.src = imageUrl;
    });
  }, [posterText]);

  // 生成图片
  const handleGenerate = async () => {
    if (!merchantInfo) {
      toast.error("请先配置机构信息", {
        action: {
          label: "去配置",
          onClick: () => router.push("/settings"),
        },
      });
      return;
    }

    if (!scene) {
      toast.error("请选择图片类型");
      return;
    }

    // 如果启用文字叠加，检查是否填写了必要信息
    if (enableTextOverlay && scene === "poster" && !posterText.title) {
      toast.error("请填写海报标题");
      return;
    }

    const prompt = getGeneratedPrompt();
    if (!prompt) {
      toast.error("生成提示词失败");
      return;
    }

    setIsLoading(true);
    setComposedImageUrl(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          size: imageSize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失败");
      }

      // 兼容多种返回格式
      const imageUrl = data.imageUrls?.[0] || data.imageUrl || data.result?.images?.[0]?.url || data.result?.url;
      
      if (!imageUrl) {
        throw new Error("未获取到图片地址");
      }

      const newTask: ImageTask = {
        taskId: data.taskId || Date.now().toString(),
        status: "succeed",
        imageUrl: imageUrl,
        prompt: prompt, // 保存提示词
        createdAt: Date.now(),
      };

      setCurrentTask(newTask);
      setTaskHistory(prev => [newTask, ...prev].slice(0, 10));
      
      // 如果启用文字叠加，进行合成
      if (enableTextOverlay && posterText.title) {
        toast.info("正在合成文字...");
        try {
          const composedUrl = await overlayTextOnImage(imageUrl);
          setComposedImageUrl(composedUrl);
          toast.success("海报生成成功！文字已叠加");
        } catch (overlayError) {
          console.error("文字叠加失败:", overlayError);
          toast.warning("文字叠加失败，已保存原图");
        }
      } else {
        toast.success("图片生成成功！");
      }
      
      // 滚动到结果区域
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 下载图片
  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("正在下载...");
      
      // 使用 fetch 获取图片并转为 blob
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error('下载失败');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 创建下载链接
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("下载成功！请查看下载文件夹");
    } catch (error) {
      console.error("下载错误:", error);
      // 如果跨域失败，尝试直接打开链接
      try {
        window.open(url, '_blank');
        toast.info("已在新窗口打开，请右键保存图片");
      } catch {
        toast.error("下载失败，请稍后重试");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]">
      {/* 隐藏的Canvas用于文字合成 */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0d1425]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white">AI图片生成</h1>
              <p className="text-xs text-gray-500">一键生成营销海报</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/poster-editor")}
              className="gap-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/20"
            >
              <Layout className="w-4 h-4" />
              高级编辑器
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings")}
              className="gap-1 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-6">
        {/* 高级编辑器推广卡片 */}
        <Card className="mb-6 bg-white/[0.03] backdrop-blur-sm border-white/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Layout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">海报高级编辑器</p>
                  <p className="text-sm text-gray-400">多模板选择 · 文字自由排版 · 像稿定设计一样编辑</p>
                </div>
              </div>
              <Button 
                onClick={() => router.push("/poster-editor")} 
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/20"
              >
                立即使用
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 机构信息提示 */}
        {!merchantInfo && (
          <Card className="mb-6 bg-amber-500/10 border-amber-500/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Store className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-amber-300">请先配置机构信息</p>
                    <p className="text-sm text-amber-400/70">AI将根据您的机构信息智能生成图片内容</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/settings")} variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  去配置
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：生成设置 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 场景选择 */}
            <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Wand2 className="w-5 h-5 text-pink-400" />
                  选择图片类型
                </CardTitle>
                <CardDescription className="text-gray-500">选择您想要生成的图片用途</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {IMAGE_SCENES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScene(s.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        scene === s.id
                          ? "border-pink-500/50 bg-pink-500/10 shadow-md"
                          : "border-white/5 hover:border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        scene === s.id ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30" : "bg-white/5 text-gray-400"
                      }`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div className="font-medium text-sm text-white">{s.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 科目选择 */}
            {merchantInfo && availableSubjects.length > 0 && (
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-base">选择课程科目</CardTitle>
                  <CardDescription>选择要推广的具体课程</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {availableSubjects.map((s) => (
                      <Badge
                        key={s}
                        variant={subject === s ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-2 transition-all ${
                          subject === s
                            ? "bg-pink-600 text-white hover:bg-pink-700"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setSubject(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 海报文案配置 - 重点功能 */}
            {scene && (
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Type className="w-5 h-5 text-blue-500" />
                        海报文案配置
                      </CardTitle>
                      <CardDescription>填写海报上需要展示的文字内容</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="enableText"
                        checked={enableTextOverlay}
                        onChange={(e) => setEnableTextOverlay(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="enableText" className="text-sm text-gray-600 cursor-pointer">
                        叠加文字
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enableTextOverlay ? (
                    <>
                      {/* 主标题 */}
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          主标题 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          placeholder="例如：春季招生开始啦！"
                          value={posterText.title}
                          onChange={(e) => setPosterText(prev => ({ ...prev, title: e.target.value }))}
                          className="bg-gray-50"
                        />
                      </div>
                      
                      {/* 副标题 */}
                      <div className="space-y-2">
                        <Label htmlFor="subtitle" className="text-sm font-medium">副标题</Label>
                        <Input
                          id="subtitle"
                          placeholder="例如：报名立享8折优惠"
                          value={posterText.subtitle}
                          onChange={(e) => setPosterText(prev => ({ ...prev, subtitle: e.target.value }))}
                          className="bg-gray-50"
                        />
                      </div>
                      
                      {/* 正文 */}
                      <div className="space-y-2">
                        <Label htmlFor="body" className="text-sm font-medium">正文/优惠信息</Label>
                        <textarea
                          id="body"
                          placeholder="例如：前50名报名赠送精美礼品&#10;小班教学，名师指导"
                          value={posterText.body}
                          onChange={(e) => setPosterText(prev => ({ ...prev, body: e.target.value }))}
                          className="w-full min-h-[80px] p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 text-sm"
                        />
                      </div>
                      
                      {/* 联系电话 */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">联系电话</Label>
                        <Input
                          id="phone"
                          placeholder="报名咨询电话"
                          value={posterText.phone}
                          onChange={(e) => setPosterText(prev => ({ ...prev, phone: e.target.value }))}
                          className="bg-gray-50"
                        />
                      </div>
                      
                      {/* 地址 */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">地址</Label>
                        <Input
                          id="address"
                          placeholder="机构地址"
                          value={posterText.address}
                          onChange={(e) => setPosterText(prev => ({ ...prev, address: e.target.value }))}
                          className="bg-gray-50"
                        />
                      </div>
                      
                      {/* 文字样式设置 */}
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        {/* 文字位置 */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">文字位置</Label>
                          <Select
                            value={posterText.position}
                            onValueChange={(v) => setPosterText(prev => ({ ...prev, position: v as any }))}
                          >
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">顶部</SelectItem>
                              <SelectItem value="center">居中</SelectItem>
                              <SelectItem value="bottom">底部</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* 文字颜色 */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">文字颜色</Label>
                          <Select
                            value={posterText.textColor}
                            onValueChange={(v) => setPosterText(prev => ({ ...prev, textColor: v }))}
                          >
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEXT_COLORS.map((color) => (
                                <SelectItem key={color.id} value={color.value}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border border-gray-200" 
                                      style={{ backgroundColor: color.value }}
                                    />
                                    {color.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* 字体大小 */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">字体大小</Label>
                          <Select
                            value={posterText.fontSize}
                            onValueChange={(v) => setPosterText(prev => ({ ...prev, fontSize: v as any }))}
                          >
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">小</SelectItem>
                              <SelectItem value="medium">中</SelectItem>
                              <SelectItem value="large">大</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      勾选"叠加文字"后，可以在图片上添加自定义文字
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 艺术风格选择 */}
            <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <Palette className="w-5 h-5 text-purple-400" />
                  选择艺术风格
                </CardTitle>
                <CardDescription className="text-gray-500">推荐使用卡通或动漫风格，更适合教培机构</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {IMAGE_ART_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setArtStyle(style.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        artStyle === style.id
                          ? "border-purple-500/50 bg-purple-500/10 shadow-md"
                          : "border-white/5 hover:border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <div className="font-medium text-sm text-white">{style.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 补充说明 */}
            <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-base text-white">补充说明（可选）</CardTitle>
                <CardDescription className="text-gray-500">添加特殊要求，如具体活动内容等</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  placeholder="例如：需要彩虹背景、添加气球元素"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full min-h-[80px] p-3 bg-white/5 rounded-lg border border-white/10 focus:ring-2 focus:ring-pink-500/50 text-sm text-white placeholder:text-gray-500"
                />
              </CardContent>
            </Card>

            {/* 生成的提示词预览 */}
            {scene && merchantInfo && (
              <Card className="bg-pink-500/10 border-pink-500/20">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-pink-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-pink-300 mb-2">AI智能生成的提示词：</p>
                      <p className="text-sm text-pink-200/80 whitespace-pre-wrap">{getGeneratedPrompt()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 图片尺寸选择 */}
            <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">图片尺寸：</span>
                    <div className="flex gap-2">
                      {[
                        { value: "1024x1024", label: "方形" },
                        { value: "1280x720", label: "横屏" },
                        { value: "720x1280", label: "竖屏" },
                      ].map((size) => (
                        <Button
                          key={size.value}
                          variant={imageSize === size.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setImageSize(size.value as any)}
                          className={imageSize === size.value ? "bg-pink-600 hover:bg-pink-700" : "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"}
                        >
                          {size.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 生成按钮 */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full h-14 text-base font-medium gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-500/30"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  开始生成图片
                </>
              )}
            </Button>
          </div>

          {/* 右侧：任务状态和历史 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 当前任务 */}
            {currentTask && (
              <Card ref={resultRef} className="bg-white/[0.03] backdrop-blur-sm border-white/5 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">生成结果</CardTitle>
                    {currentTask.status === "succeed" ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-0">已完成</Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0">生成中</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentTask.status === "succeed" && currentTask.imageUrl && (
                    <div className="space-y-4">
                      {/* 成功提示 */}
                      <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3 border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          {composedImageUrl ? "海报生成成功！文字已叠加" : "图片生成成功！"}
                        </span>
                      </div>
                      
                      {/* 图片预览 - 优先显示合成后的图片 */}
                      <div className="relative rounded-xl overflow-hidden bg-white/5 shadow-inner">
                        <img
                          src={composedImageUrl || currentTask.imageUrl}
                          alt="生成的图片"
                          className="w-full aspect-square object-contain"
                        />
                      </div>
                      
                      {/* 下载按钮 */}
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleDownload(
                            composedImageUrl || currentTask.imageUrl!, 
                            `poster-${currentTask.taskId}.png`
                          )}
                          className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-base font-medium shadow-lg shadow-emerald-500/30"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          下载海报
                        </Button>
                        
                        {/* 如果有合成图片，提供原图下载选项 */}
                        {composedImageUrl && (
                          <Button
                            variant="outline"
                            onClick={() => handleDownload(currentTask.imageUrl!, `original-${currentTask.taskId}.png`)}
                            className="w-full bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            下载无文字原图
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(currentTask.imageUrl!, '_blank')}
                          className="w-full text-gray-400 hover:text-white hover:bg-white/5"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          在新窗口查看原图
                        </Button>
                      </div>
                      
                      {/* 提示 */}
                      <p className="text-xs text-gray-500 text-center">
                        💡 下载后可分享到朋友圈、微信群等平台
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 历史任务 */}
            {taskHistory.length > 0 && (
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-base text-white">历史记录</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {taskHistory.slice(0, 5).map((task) => (
                      <div key={task.taskId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                          {task.imageUrl ? (
                            <img src={task.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-300 truncate">
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              task.status === "succeed" 
                                ? "border-emerald-500/30 text-emerald-400" 
                                : "border-amber-500/30 text-amber-400"
                            }`}
                          >
                            {task.status === "succeed" ? "已完成" : "处理中"}
                          </Badge>
                        </div>
                        {task.imageUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(task.imageUrl!, '_blank')}
                            className="text-gray-400 hover:text-white hover:bg-white/5"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
