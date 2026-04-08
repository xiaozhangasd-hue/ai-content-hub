"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bot,
  Send,
  ArrowLeft,
  Loader2,
  User,
  Lightbulb,
  Image,
  Video,
  FileText,
  Sparkles,
  Settings,
  Store,
  Copy,
  Check,
  Mic,
  MessageCircle,
  Zap,
  Target,
  Users,
  TrendingUp,
  ChevronDown,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { type MerchantInfo } from "@/lib/prompt-generator";

// 消息类型
interface MessageAction {
  type: "copy" | "generate_image" | "generate_video" | "generate_avatar" | "generate_lipsync" | "edit";
  label: string;
  prompt?: string;
  content?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  actions?: MessageAction[];
  card?: MessageCard;
}

interface MessageCard {
  type: "copywriting" | "image_preview" | "video_preview" | "tips";
  title?: string;
  content: string;
  tags?: string[];
}

interface User {
  id: string;
  phone: string;
  name?: string;
}

// 功能卡片配置
const featureCards = [
  {
    icon: FileText,
    title: "写招生文案",
    desc: "朋友圈、宣传单、活动海报",
    prompt: "帮我写一条招生文案",
    gradient: "from-blue-500 to-cyan-500",
    examples: ["朋友圈招生文案", "体验课宣传语", "节日活动文案"],
  },
  {
    icon: Image,
    title: "做宣传海报",
    desc: "AI一键生成精美图片",
    prompt: "帮我设计一张招生宣传海报",
    gradient: "from-pink-500 to-rose-500",
    examples: ["课程宣传海报", "活动促销图", "课程表设计"],
  },
  {
    icon: Video,
    title: "制作视频",
    desc: "课程宣传、机构介绍",
    prompt: "帮我制作一个课程宣传视频",
    gradient: "from-purple-500 to-indigo-500",
    examples: ["课程宣传视频", "机构环境展示", "学员风采"],
  },
  {
    icon: Mic,
    title: "数字人/对口型",
    desc: "让图片开口说话",
    prompt: "帮我制作一个数字人介绍视频",
    gradient: "from-orange-500 to-red-500",
    examples: ["机构介绍", "课程推荐", "节日祝福"],
  },
];

// 快捷问题
const quickQuestions = [
  { icon: TrendingUp, text: "招生转化率怎么提升？", prompt: "我的体验课转化率只有20%，怎么提升？" },
  { icon: Users, text: "家长说太贵了怎么回？", prompt: "家长说学费太贵了，我该怎么回应？" },
  { icon: Target, text: "淡季怎么做招生？", prompt: "现在是淡季，招生很困难，有什么好方法？" },
  { icon: Lightbulb, text: "体验课怎么设计？", prompt: "如何设计一个有吸引力的体验课？" },
];

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 用于跟踪已处理的prompt，避免重复发送
  const processedPromptRef = useRef<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));

    // 加载机构信息
    const savedMerchant = localStorage.getItem("merchantInfo");
    if (savedMerchant) {
      setMerchantInfo(JSON.parse(savedMerchant));
    }

    // 检查URL参数，是否有预设问题（使用ref避免重复发送）
    const promptParam = searchParams.get("prompt");
    if (promptParam && processedPromptRef.current !== promptParam) {
      processedPromptRef.current = promptParam;
      setTimeout(() => handleSend(promptParam), 500);
    }
  }, [router, searchParams]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 保存聊天历史到localStorage
  const saveChatHistory = (currentMessages: Message[], newResponse: string) => {
    try {
      // 获取现有历史
      const existingHistory = localStorage.getItem("chatHistory");
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // 只保存最近10条对话
      const lastUserMessage = currentMessages.filter(m => m.role === "user").slice(-1)[0];
      
      if (lastUserMessage) {
        const chatItem = {
          id: Date.now().toString(),
          title: lastUserMessage.content.slice(0, 30) + (lastUserMessage.content.length > 30 ? "..." : ""),
          messages: [
            { role: "user", content: lastUserMessage.content },
            { role: "assistant", content: newResponse },
          ],
          createdAt: Date.now(),
        };
        
        // 添加到历史开头
        history.unshift(chatItem);
        
        // 只保留最近10条
        const trimmedHistory = history.slice(0, 10);
        
        localStorage.setItem("chatHistory", JSON.stringify(trimmedHistory));
      }
    } catch (error) {
      console.error("保存聊天历史失败:", error);
    }
  };

  // 发送消息
  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setShowFeatures(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      const historyMessages = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      historyMessages.push({ role: "user", content: text });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyMessages, merchantInfo }),
      });

      if (!response.ok) throw new Error("请求失败");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch (e) {}
          }
        }
      }

      // 解析操作和卡片
      const { actions, card, cleanContent } = parseMessageContent(fullContent);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: cleanContent, isStreaming: false, actions, card }
            : m
        )
      );

      // 保存聊天历史到localStorage
      saveChatHistory(messages, fullContent);

      if (!fullContent) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "抱歉，我遇到了一些问题，请稍后再试。", isStreaming: false }
              : m
          )
        );
      }
    } catch (error) {
      toast.error("回复失败");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "抱歉，我遇到了一些问题，请稍后再试。", isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 解析消息内容 - 提取AI生成的内容用于后续操作
  const parseMessageContent = (content: string, fullContent?: string) => {
    let cleanContent = content;
    const actions: MessageAction[] = [];
    let card: MessageCard | undefined;

    // 1. 提取【】标记的文案内容
    const copyMatches = content.matchAll(/【([^】]+)】/g);
    let copyContent = "";
    for (const match of copyMatches) {
      copyContent += (copyContent ? "\n" : "") + match[1];
    }
    if (copyContent) {
      actions.push({
        type: "copy",
        label: "复制文案",
        content: copyContent,
      });
    }

    // 2. 提取视频脚本内容（多段匹配）
    // 匹配格式：脚本：xxx 或 【脚本开始】xxx【脚本结束】 或直接多段脚本内容
    let scriptContent = "";
    
    // 尝试匹配【脚本开始】...【脚本结束】格式
    const scriptBlockMatch = content.match(/【脚本开始】([\s\S]*?)【脚本结束】/);
    if (scriptBlockMatch) {
      scriptContent = scriptBlockMatch[1].trim();
    } else {
      // 尝试匹配"脚本："后面的内容（到下一个标题或结尾）
      const scriptLabelMatch = content.match(/(?:视频)?脚本[：:]\s*([\s\S]*?)(?=\n\n|💡|✨|---|$)/);
      if (scriptLabelMatch) {
        scriptContent = scriptLabelMatch[1].trim();
      } else if (copyContent) {
        // 如果没有专门的脚本格式，使用【】中的内容
        scriptContent = copyContent;
      }
    }

    // 3. 提取图片提示词
    let imagePrompt = "";
    const imagePromptMatch = content.match(/\[GENERATE_IMAGE:([^\]]+)\]/);
    if (imagePromptMatch) {
      imagePrompt = imagePromptMatch[1].trim();
    } else if (copyContent && content.includes("海报")) {
      imagePrompt = copyContent;
    }

    // 4. 提取视频提示词
    let videoPrompt = "";
    const videoPromptMatch = content.match(/\[GENERATE_VIDEO:([^\]]+)\]/);
    if (videoPromptMatch) {
      videoPrompt = videoPromptMatch[1].trim();
    } else if (scriptContent) {
      videoPrompt = scriptContent;
    } else if (copyContent && (content.includes("视频") || content.includes("宣传"))) {
      videoPrompt = copyContent;
    }

    // 5. 检测并添加操作按钮
    // 图片生成
    if (content.includes("海报") || content.includes("图片") || content.includes("宣传图") || imagePrompt) {
      actions.push({
        type: "generate_image",
        label: "生成图片",
        prompt: imagePrompt || copyContent || content,
      });
    }

    // 视频生成 - 使用提取的脚本内容
    if (content.includes("视频") || content.includes("宣传视频") || content.includes("课程视频") || content.includes("脚本") || videoPromptMatch) {
      actions.push({
        type: "generate_video",
        label: "生成视频",
        prompt: videoPrompt || scriptContent || copyContent || content,
        content: videoPrompt || scriptContent || copyContent || content,
      });
    }

    // 数字人/对口型
    if (content.includes("数字人") || content.includes("让图片说话") || content.includes("对口型")) {
      actions.push({
        type: "generate_avatar",
        label: "制作数字人",
        prompt: scriptContent || copyContent || content,
        content: scriptContent || copyContent || content,
      });
    }

    return { actions, card, cleanContent };
  };

  // 执行操作 - 跳转时传递AI生成的内容
  const handleAction = async (action: MessageAction) => {
    switch (action.type) {
      case "copy":
        if (action.content) {
          await navigator.clipboard.writeText(action.content);
          toast.success("已复制到剪贴板");
          setCopiedId(action.content);
          setTimeout(() => setCopiedId(null), 2000);
        }
        break;
      case "generate_image":
        // 保存图片提示词到localStorage
        if (action.prompt || action.content) {
          localStorage.setItem("pendingImagePrompt", action.prompt || action.content || "");
        }
        router.push("/image");
        break;
      case "generate_video":
        // 保存视频提示词到localStorage
        if (action.prompt || action.content) {
          localStorage.setItem("pendingVideoPrompt", action.prompt || action.content || "");
        }
        router.push("/video");
        break;
      case "generate_avatar":
        // 保存数字人文案到localStorage
        if (action.content || action.prompt) {
          localStorage.setItem("pendingAvatarScript", action.content || action.prompt || "");
        }
        router.push("/avatar");
        break;
      case "generate_lipsync":
        // 保存对口型文案到localStorage
        if (action.content || action.prompt) {
          localStorage.setItem("pendingLipsyncScript", action.content || action.prompt || "");
        }
        router.push("/lip-sync");
        break;
    }
  };

  // 处理回车
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628] flex flex-col">
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1425]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">AI智能顾问</h1>
              <p className="text-xs text-gray-500">教培运营专家 · 24小时在线</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!merchantInfo?.name && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
                className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <Store className="w-3.5 h-3.5" />
                完善信息
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* 欢迎区域 */}
          {messages.length === 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    你好，{user.name || "朋友"} 👋
                  </h2>
                  <p className="text-sm text-gray-500">我是你的教培运营顾问，有什么能帮你的？</p>
                </div>
              </div>
            </div>
          )}

          {/* 功能卡片 - 首次展示 */}
          {showFeatures && messages.length === 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>我能帮你做什么</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featureCards.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(feature.prompt)}
                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 text-left hover:shadow-lg hover:border-gray-200 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.length > 0 && (
            <div className="space-y-5">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* 头像 */}
                  <div
                    className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}>
                    <div
                      className={`inline-block rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md shadow-md shadow-blue-500/20"
                          : "bg-white border border-gray-100 rounded-tl-md shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-left">
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-1.5 h-4 ml-0.5 bg-purple-500 animate-pulse rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {message.actions && message.actions.length > 0 && !message.isStreaming && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(action)}
                            className={`gap-1.5 rounded-full text-xs ${
                              action.type === "copy" && copiedId === action.content
                                ? "bg-green-50 border-green-200 text-green-600"
                                : action.type.includes("generate")
                                ? "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
                                : ""
                            }`}
                          >
                            {action.type === "copy" && (copiedId === action.content ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />)}
                            {action.type.includes("image") && <Image className="w-3 h-3" />}
                            {action.type.includes("video") && <Video className="w-3 h-3" />}
                            {action.type.includes("avatar") && <Mic className="w-3 h-3" />}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-gray-400 mt-1.5 px-1">
                      {message.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 快捷问题 - 输入框上方 */}
      {messages.length > 0 && messages.length < 3 && (
        <div className="max-w-4xl mx-auto px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-gray-500">继续问</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => handleSend(q.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 hover:border-purple-200 hover:bg-purple-50 text-xs text-gray-600 hover:text-purple-600 transition-colors shadow-sm"
              >
                <q.icon className="w-3 h-3" />
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className="sticky bottom-0 border-t border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="输入你的问题，比如：帮我写一条招生文案..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="w-full bg-gray-50 border-gray-200 focus:border-purple-300 focus:ring-purple-100 focus:bg-white transition-all rounded-xl h-12 px-4 text-[15px]"
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="h-12 px-5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600 rounded-xl shadow-lg shadow-purple-500/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-3">
            💡 直接说你的需求，我会帮你搞定
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageContent />
    </Suspense>
  );
}
