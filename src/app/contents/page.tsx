"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Bot,
  MessageSquare,
  Download,
  Trash2,
  Calendar,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  Play,
  Pause,
  X,
  ZoomIn,
  FileText,
} from "lucide-react";

// 内容类型
interface ContentItem {
  id: string;
  type: "image" | "video" | "avatar" | "chat";
  title: string;
  prompt?: string; // 生成提示词
  url?: string;
  thumbnail?: string;
  content?: string;
  createdAt: number;
  status: "succeed" | "failed" | "pending";
}

export default function ContentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    loadContents();
  }, [router]);

  // 加载所有内容
  const loadContents = () => {
    const items: ContentItem[] = [];

    // 加载图片历史
    const imageHistory = localStorage.getItem("imageTaskHistory");
    if (imageHistory) {
      const images = JSON.parse(imageHistory);
      images.forEach((task: any) => {
        // 从提示词中提取主题作为标题
        const promptPreview = task.prompt?.slice(0, 30) || "海报";
        items.push({
          id: task.taskId,
          type: "image",
          title: promptPreview,
          prompt: task.prompt,
          url: task.imageUrl,
          thumbnail: task.imageUrl,
          createdAt: task.createdAt,
          status: task.status === "succeed" ? "succeed" : "failed",
        });
      });
    }

    // 加载视频历史
    const videoHistory = localStorage.getItem("videoTaskHistory");
    if (videoHistory) {
      const videos = JSON.parse(videoHistory);
      videos.forEach((task: any) => {
        const promptPreview = task.prompt?.slice(0, 30) || "视频";
        items.push({
          id: task.taskId,
          type: "video",
          title: promptPreview,
          prompt: task.prompt,
          url: task.videoUrl,
          createdAt: task.createdAt,
          status: task.status === "succeed" ? "succeed" : task.status === "failed" ? "failed" : "pending",
        });
      });
    }

    // 加载数字人/对口型历史
    const avatarHistory = localStorage.getItem("avatarTaskHistory");
    if (avatarHistory) {
      const avatars = JSON.parse(avatarHistory);
      avatars.forEach((task: any) => {
        const promptPreview = task.prompt?.slice(0, 30) || "数字人";
        items.push({
          id: task.taskId,
          type: "avatar",
          title: promptPreview,
          prompt: task.prompt,
          url: task.videoUrl,
          createdAt: task.createdAt,
          status: task.status === "succeed" ? "succeed" : task.status === "failed" ? "failed" : "pending",
        });
      });
    }

    // 加载对口型历史
    const lipsyncHistory = localStorage.getItem("lipsyncTaskHistory");
    if (lipsyncHistory) {
      const lipsyncs = JSON.parse(lipsyncHistory);
      lipsyncs.forEach((task: any) => {
        const promptPreview = task.prompt?.slice(0, 30) || "对口型";
        items.push({
          id: task.taskId,
          type: "avatar",
          title: promptPreview,
          prompt: task.prompt,
          url: task.videoUrl,
          createdAt: task.createdAt,
          status: task.status === "succeed" ? "succeed" : task.status === "failed" ? "failed" : "pending",
        });
      });
    }

    // 加载聊天历史
    const chatHistory = localStorage.getItem("chatHistory");
    if (chatHistory) {
      const chats = JSON.parse(chatHistory);
      chats.forEach((chat: any, index: number) => {
        // 使用第一条用户消息作为标题
        const firstUserMsg = chat.messages?.find((m: any) => m.role === "user");
        const title = firstUserMsg?.content?.slice(0, 20) || `对话 - ${new Date(chat.createdAt).toLocaleDateString()}`;
        items.push({
          id: `chat-${index}`,
          type: "chat",
          title: title,
          content: chat.messages?.map((m: any) => m.content).join("\n\n"),
          createdAt: chat.createdAt || Date.now(),
          status: "succeed",
        });
      });
    }

    // 按时间排序（最新的在前）
    items.sort((a, b) => b.createdAt - a.createdAt);

    setContents(items);
  };

  // 过滤内容
  const filteredContents = activeTab === "all" 
    ? contents 
    : contents.filter(item => item.type === activeTab);

  // 下载文件
  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("正在下载...");
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(blobUrl);
      toast.success("下载成功！");
    } catch (error) {
      toast.error("下载失败，请在新窗口打开");
      window.open(url, '_blank');
    }
  };

  // 复制内容
  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 删除内容
  const handleDelete = (id: string, type: string) => {
    if (!confirm("确定要删除这条内容吗？")) return;

    // 从对应的存储中删除
    const storageKeys = {
      image: ["imageTaskHistory"],
      video: ["videoTaskHistory"],
      avatar: ["avatarTaskHistory", "lipsyncTaskHistory"], // 数字人和对口型都归为avatar
      chat: ["chatHistory"],
    }[type] || [];

    storageKeys.forEach(storageKey => {
      const history = localStorage.getItem(storageKey);
      if (history) {
        const items = JSON.parse(history);
        const filtered = items.filter((item: any) => item.taskId !== id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    });

    // 更新列表
    setContents(prev => prev.filter(item => item.id !== id));
    toast.success("已删除");
  };

  // 清空所有历史
  const handleClearAll = () => {
    if (!confirm("确定要清空所有历史记录吗？此操作不可恢复！")) return;

    localStorage.removeItem("imageTaskHistory");
    localStorage.removeItem("videoTaskHistory");
    localStorage.removeItem("avatarTaskHistory");
    localStorage.removeItem("lipsyncTaskHistory");
    localStorage.removeItem("chatHistory");
    
    setContents([]);
    toast.success("已清空所有历史记录");
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return ImageIcon;
      case "video": return Video;
      case "avatar": return Bot;
      case "chat": return MessageSquare;
      default: return FolderOpen;
    }
  };

  // 获取类型名称
  const getTypeName = (type: string) => {
    switch (type) {
      case "image": return "图片";
      case "video": return "视频";
      case "avatar": return "数字人";
      case "chat": return "对话";
      default: return "内容";
    }
  };

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case "image": return "bg-pink-100 text-pink-700";
      case "video": return "bg-cyan-100 text-cyan-700";
      case "avatar": return "bg-teal-100 text-teal-700";
      case "chat": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // 统计
  const stats = {
    total: contents.length,
    images: contents.filter(c => c.type === "image").length,
    videos: contents.filter(c => c.type === "video").length,
    avatars: contents.filter(c => c.type === "avatar").length,
    chats: contents.filter(c => c.type === "chat").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]">
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0d1425]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">我的内容</h1>
              <p className="text-xs text-gray-500">查看所有生成记录</p>
            </div>
          </div>
          <div className="ml-auto">
            {contents.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-1" />
                清空历史
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500 mt-1">全部内容</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.images}</div>
              <div className="text-xs text-gray-500 mt-1">图片</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-cyan-600">{stats.videos}</div>
              <div className="text-xs text-gray-500 mt-1">视频</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-teal-600">{stats.avatars}</div>
              <div className="text-xs text-gray-500 mt-1">数字人</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.chats}</div>
              <div className="text-xs text-gray-500 mt-1">对话</div>
            </CardContent>
          </Card>
        </div>

        {/* 标签筛选 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 max-w-md">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="image">图片</TabsTrigger>
            <TabsTrigger value="video">视频</TabsTrigger>
            <TabsTrigger value="avatar">数字人</TabsTrigger>
            <TabsTrigger value="chat">对话</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 内容列表 */}
        {filteredContents.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <FolderOpen className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">暂无内容</h3>
              <p className="text-sm text-gray-500 mb-4">
                {activeTab === "all" 
                  ? "您还没有生成任何内容" 
                  : `您还没有生成${getTypeName(activeTab)}内容`}
              </p>
              <Button onClick={() => router.push("/chat")}>
                去AI顾问聊聊
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContents.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              
              return (
                <Card key={item.id} className="bg-white border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* 预览区域 - 可点击放大 */}
                  {item.type === "image" && item.thumbnail && (
                    <div 
                      className="aspect-square bg-gray-100 relative cursor-pointer group"
                      onClick={() => {
                        setPreviewItem(item);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}
                  
                  {item.type === "image" && !item.thumbnail && (
                    <div className="aspect-square bg-gradient-to-br from-pink-100 to-pink-200 relative flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-pink-400" />
                    </div>
                  )}
                  
                  {item.type === "video" && (
                    <div 
                      className="aspect-video bg-gray-900 relative cursor-pointer group"
                      onMouseEnter={() => {
                        const video = videoRefs.current[item.id];
                        if (video && item.url) {
                          video.play().catch(() => {});
                        }
                      }}
                      onMouseLeave={() => {
                        const video = videoRefs.current[item.id];
                        if (video) {
                          video.pause();
                          video.currentTime = 0;
                        }
                      }}
                      onClick={() => {
                        setPreviewItem(item);
                        setIsPreviewOpen(true);
                      }}
                    >
                      {item.url ? (
                        <>
                          <video 
                            ref={(el) => { videoRefs.current[item.id] = el; }}
                            src={item.url} 
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            poster={item.thumbnail}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {item.type === "avatar" && item.url ? (
                    <div 
                      className="aspect-video bg-gray-900 relative cursor-pointer group"
                      onMouseEnter={() => {
                        const video = videoRefs.current[item.id];
                        if (video) {
                          video.play().catch(() => {});
                        }
                      }}
                      onMouseLeave={() => {
                        const video = videoRefs.current[item.id];
                        if (video) {
                          video.pause();
                          video.currentTime = 0;
                        }
                      }}
                      onClick={() => {
                        setPreviewItem(item);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <video 
                        ref={(el) => { videoRefs.current[item.id] = el; }}
                        src={item.url} 
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Play className="w-12 h-12 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ) : item.type === "avatar" && (
                    <div className="aspect-video bg-gradient-to-br from-teal-500 to-cyan-500 relative flex items-center justify-center">
                      <Bot className="w-12 h-12 text-white" />
                    </div>
                  )}

                  {item.type === "chat" && (
                    <div 
                      className="aspect-video bg-gradient-to-br from-purple-50 to-pink-50 relative cursor-pointer group p-4 overflow-hidden border-b"
                      onClick={() => {
                        setPreviewItem(item);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <div className="text-gray-700 text-sm line-clamp-4 whitespace-pre-wrap">
                        {item.content?.slice(0, 200)}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  )}

                  {/* 信息区域 */}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(item.type)}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {getTypeName(item.type)}
                        </Badge>
                        {item.status === "succeed" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : item.status === "failed" ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.type)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString()}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {item.url && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(item.url!, `${item.type}-${item.id}.mp4`)}
                            className="flex-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            下载
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(item.url!, '_blank')}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                      
                      {item.content && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(item.content!, item.id)}
                          className="flex-1"
                        >
                          {copiedId === item.id ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              复制
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* 预览弹窗 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewItem && (
                <>
                  {previewItem.type === "image" && <ImageIcon className="w-5 h-5" />}
                  {previewItem.type === "video" && <Video className="w-5 h-5" />}
                  {previewItem.type === "avatar" && <Bot className="w-5 h-5" />}
                  {previewItem.type === "chat" && <MessageSquare className="w-5 h-5" />}
                  {getTypeName(previewItem.type)}预览
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {previewItem && (
            <div className="space-y-4">
              {/* 预览内容 */}
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {previewItem.type === "image" && previewItem.url && (
                  <img 
                    src={previewItem.url} 
                    alt={previewItem.title}
                    className="w-full max-h-[60vh] object-contain"
                  />
                )}
                
                {previewItem.type === "video" && previewItem.url && (
                  <video 
                    src={previewItem.url} 
                    controls
                    className="w-full max-h-[60vh]"
                  />
                )}
                
                {previewItem.type === "avatar" && previewItem.url && (
                  <video 
                    src={previewItem.url} 
                    controls
                    className="w-full max-h-[60vh]"
                  />
                )}
                
                {previewItem.type === "chat" && previewItem.content && (
                  <div className="p-4 max-h-[60vh] overflow-auto">
                    <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                      {previewItem.content}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 详细信息 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>创建时间：{new Date(previewItem.createdAt).toLocaleString()}</span>
                </div>
                
                {previewItem.prompt && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">提示词：</span>
                      <p className="mt-1 text-gray-500">{previewItem.prompt}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2">
                {previewItem.url && (
                  <>
                    <Button
                      onClick={() => handleDownload(previewItem.url!, `${previewItem.type}-${previewItem.id}.${previewItem.type === 'image' ? 'png' : 'mp4'}`)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(previewItem.url!, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      新窗口打开
                    </Button>
                  </>
                )}
                
                {previewItem.content && (
                  <Button
                    onClick={() => handleCopy(previewItem.content!, previewItem.id)}
                    className="flex-1"
                  >
                    {copiedId === previewItem.id ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制全部
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
