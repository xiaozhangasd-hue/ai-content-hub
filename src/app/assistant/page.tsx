"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bot,
  Send,
  ArrowLeft,
  Loader2,
  User,
  Image,
  FileText,
  Presentation,
  Lightbulb,
  Copy,
  Check,
  Download,
  Sparkles,
  MessageSquare,
  Zap,
  Target,
  Users,
  TrendingUp,
  RefreshCw,
  Mic,
  MicOff,
  Video,
  Volume2,
  History,
  Trash2,
  ChevronDown,
  Play,
  Pause,
  Upload,
  File,
  X,
  FileSpreadsheet,
} from "lucide-react";

// 上传文件类型
interface UploadedFile {
  name: string;
  type: string;
  category: "image" | "pdf" | "document" | "text" | "spreadsheet" | "presentation";
  previewUrl: string;
  extractedContent: string;
  needsVision: boolean;
}

// 消息类型
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  displayContent?: string; // 打字机效果显示的内容
  toolResults?: ToolResult[];
  attachments?: UploadedFile[];
}

// 工具调用结果
interface ToolResult {
  tool: "image" | "ppt" | "copywriting" | "tts" | "avatar" | "video" | "image-batch";
  success: boolean;
  data?: any;
  error?: string;
}

// 对话历史
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 快捷指令
const QUICK_COMMANDS = [
  {
    icon: Image,
    label: "生成招生海报",
    prompt: "帮我设计一张招生海报",
    color: "bg-pink-500",
  },
  {
    icon: Presentation,
    label: "制作课程PPT",
    prompt: "帮我制作一个课程介绍的PPT",
    color: "bg-blue-500",
  },
  {
    icon: FileText,
    label: "写朋友圈文案",
    prompt: "帮我写一条朋友圈招生文案",
    color: "bg-green-500",
  },
  {
    icon: Video,
    label: "生成数字人",
    prompt: "帮我生成一个数字人介绍视频",
    color: "bg-purple-500",
  },
  {
    icon: Volume2,
    label: "语音合成",
    prompt: "帮我把这段文案转成语音",
    color: "bg-orange-500",
  },
  {
    icon: Target,
    label: "提升转化率",
    prompt: "我的体验课转化率不高，怎么提升？",
    color: "bg-cyan-500",
  },
];

// 空状态建议
const SUGGESTIONS = [
  {
    icon: Sparkles,
    title: "智能文案生成",
    desc: "招生海报、朋友圈、活动宣传",
    examples: ["写一条暑期班招生文案", "帮我设计课程宣传语"],
  },
  {
    icon: Image,
    title: "一键图片生成",
    desc: "AI生成招生海报、课程卡片",
    examples: ["生成一张卡通风格的宣传图", "做一张课程海报"],
  },
  {
    icon: Presentation,
    title: "PPT智能生成",
    desc: "课程介绍、机构展示、招生方案",
    examples: ["制作一份课程PPT", "生成机构介绍PPT"],
  },
  {
    icon: Video,
    title: "数字人与视频",
    desc: "AI数字人、语音合成、视频生成",
    examples: ["生成一个数字人介绍视频", "把文案转成语音"],
  },
];

// 打字机速度控制（毫秒/字符）
const TYPEWRITER_SPEED = 15;
const TYPEWRITER_BATCH_SIZE = 3; // 每次显示的字符数

export default function AssistantPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 文件上传相关状态
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 语音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 检查浏览器支持
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported(
        "MediaRecorder" in window ||
          "webkitSpeechRecognition" in window ||
          "SpeechRecognition" in window
      );
    }
  }, []);

  // 检查登录并加载对话历史 - 自动加载最近对话
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 加载对话历史
    const savedConversations = localStorage.getItem("assistant_conversations");
    let loadedConversations: Conversation[] = [];
    
    if (savedConversations) {
      loadedConversations = JSON.parse(savedConversations);
      setConversations(loadedConversations);
    }

    // 尝试加载上次对话
    const savedCurrentId = localStorage.getItem("assistant_current_id");
    if (savedCurrentId) {
      const savedMessages = localStorage.getItem(`assistant_messages_${savedCurrentId}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        setCurrentConversationId(savedCurrentId);
      }
    } else if (loadedConversations.length > 0) {
      // 如果没有当前对话ID，自动加载最近的对话
      const latestConversation = loadedConversations[0];
      const savedMessages = localStorage.getItem(`assistant_messages_${latestConversation.id}`);
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        setCurrentConversationId(latestConversation.id);
        localStorage.setItem("assistant_current_id", latestConversation.id);
      }
    }

    setIsInitialized(true);
  }, [router]);

  // 清理打字机定时器
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
      }
    };
  }, []);

  // 保存对话
  const saveConversation = useCallback(
    (msgs: Message[]) => {
      if (msgs.length === 0) return;

      const conversationId = currentConversationId || Date.now().toString();
      const title =
        msgs[0].content.slice(0, 30) + (msgs[0].content.length > 30 ? "..." : "");

      const updatedConversations = conversations.filter((c) => c.id !== conversationId);
      const newConversation: Conversation = {
        id: conversationId,
        title,
        messages: msgs,
        createdAt:
          conversations.find((c) => c.id === conversationId)?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      updatedConversations.unshift(newConversation);

      // 只保留最近30个对话
      const trimmedConversations = updatedConversations.slice(0, 30);

      setConversations(trimmedConversations);
      setCurrentConversationId(conversationId);

      localStorage.setItem("assistant_conversations", JSON.stringify(trimmedConversations));
      localStorage.setItem(`assistant_messages_${conversationId}`, JSON.stringify(msgs));
      localStorage.setItem("assistant_current_id", conversationId);
    },
    [conversations, currentConversationId]
  );

  // 开始新对话
  const startNewConversation = () => {
    // 清理打字机
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem("assistant_current_id");
    toast.success("已开始新对话");
    inputRef.current?.focus();
  };

  // 加载历史对话
  const loadConversation = (id: string) => {
    // 清理打字机
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    
    const savedMessages = localStorage.getItem(`assistant_messages_${id}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
      setCurrentConversationId(id);
      localStorage.setItem("assistant_current_id", id);
    }
    setShowHistory(false);
  };

  // 删除对话
  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    localStorage.setItem("assistant_conversations", JSON.stringify(updated));
    localStorage.removeItem(`assistant_messages_${id}`);

    if (currentConversationId === id) {
      setMessages([]);
      setCurrentConversationId(null);
      localStorage.removeItem("assistant_current_id");
    }
    toast.success("已删除对话");
  };

  // 语音录制
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("录音失败:", error);
      toast.error("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 语音转文字
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      toast.info("正在识别语音...");

      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      const response = await fetch("/api/audio/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("语音识别失败");
      }

      const data = await response.json();
      if (data.text) {
        setInput(data.text);
        toast.success("语音识别完成");
      }
    } catch (error) {
      console.error("语音识别错误:", error);
      toast.error("语音识别失败，请重试");
    }
  };

  // 文件上传处理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const token = localStorage.getItem("token");

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/assistant/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "上传失败");
        }

        const data = await response.json();
        if (data.success) {
          setUploadedFiles((prev) => [...prev, data.file]);
          toast.success(`${file.name} 上传成功`);
        }
      }
    } catch (error) {
      console.error("文件上传错误:", error);
      toast.error(error instanceof Error ? error.message : "文件上传失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 移除已上传的文件
  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 打字机效果
  const startTypewriter = useCallback((messageId: string, fullContent: string) => {
    // 清理之前的定时器
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
    }

    let currentIndex = 0;
    
    typewriterRef.current = setInterval(() => {
      currentIndex += TYPEWRITER_BATCH_SIZE;
      const displayText = fullContent.slice(0, currentIndex);
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, displayContent: displayText }
            : m
        )
      );

      // 滚动到底部
      scrollToBottom();

      // 完成打字
      if (currentIndex >= fullContent.length) {
        if (typewriterRef.current) {
          clearInterval(typewriterRef.current);
          typewriterRef.current = null;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isStreaming: false, displayContent: fullContent }
              : m
          )
        );
      }
    }, TYPEWRITER_SPEED);
  }, [scrollToBottom]);

  // 发送消息
  const sendMessage = async (content: string, attachments?: UploadedFile[]) => {
    if ((!content.trim() && (!attachments || attachments.length === 0)) || isLoading) return;

    // 构建用户消息内容
    let messageContent = content;
    if (attachments && attachments.length > 0) {
      const fileDescriptions = attachments.map((f) => {
        if (f.category === "image") {
          return `[图片: ${f.name}]`;
        } else if (f.category === "pdf") {
          return `[PDF: ${f.name}]\n${f.extractedContent?.slice(0, 1000)}`;
        } else if (f.category === "spreadsheet") {
          return `[表格: ${f.name}]\n${f.extractedContent?.slice(0, 1000)}`;
        } else {
          return `[文件: ${f.name}]\n${f.extractedContent?.slice(0, 1000)}`;
        }
      });
      messageContent = fileDescriptions.join("\n\n") + "\n\n" + content;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      attachments: attachments,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    // 添加助手消息占位
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        displayContent: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    // 获取机构信息
    let merchantInfo = null;
    try {
      const savedInfo = localStorage.getItem("merchantInfo");
      if (savedInfo) {
        merchantInfo = JSON.parse(savedInfo);
      }
    } catch (e) {
      console.error("获取机构信息失败:", e);
    }

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...newMessages.slice(0, -1).map((m) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user",
              content: messageContent,
            },
          ],
          conversationId: currentConversationId,
          merchantInfo,
          attachments: attachments?.map((f) => ({
            name: f.name,
            type: f.type,
            category: f.category,
            previewUrl: f.previewUrl,
            extractedContent: f.extractedContent,
            needsVision: f.needsVision,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取响应");

      const decoder = new TextDecoder();
      let fullContent = "";
      let toolResults: ToolResult[] = [];
      let finalMessages: Message[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "text":
                  fullContent += data.content;
                  // 直接更新显示内容，不使用打字机（实时流式）
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent, displayContent: fullContent, isStreaming: true }
                        : m
                    )
                  );
                  scrollToBottom();
                  break;

                case "tool_start":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: fullContent + `\n\n⏳ 正在${getToolName(data.tool)}...`,
                            displayContent: fullContent + `\n\n⏳ 正在${getToolName(data.tool)}...`,
                          }
                        : m
                    )
                  );
                  break;

                case "tool_result":
                  toolResults.push({
                    tool: data.tool,
                    success: true,
                    data: data.result,
                  });
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            content: fullContent,
                            displayContent: fullContent,
                            toolResults,
                          }
                        : m
                    )
                  );
                  break;

                case "tool_error":
                  toolResults.push({
                    tool: data.tool,
                    success: false,
                    error: data.error,
                  });
                  break;

                case "done":
                  finalMessages = newMessages.concat([
                    {
                      id: assistantId,
                      role: "assistant",
                      content: fullContent,
                      displayContent: fullContent,
                      timestamp: new Date(),
                      toolResults,
                      isStreaming: false,
                    },
                  ]);
                  setMessages(finalMessages);
                  // 保存对话
                  saveConversation(finalMessages);
                  break;

                case "error":
                  throw new Error(data.error);
              }
            } catch (e) {
              if (e instanceof Error && e.message !== "请求失败") {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "抱歉，出现了错误，请稍后重试。",
                displayContent: "抱歉，出现了错误，请稍后重试。",
                isStreaming: false,
              }
            : m
        )
      );
      toast.error("发送失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 获取工具名称
  const getToolName = (tool: string) => {
    const names: Record<string, string> = {
      image: "生成图片",
      "image-batch": "批量生成图片",
      ppt: "生成PPT",
      copywriting: "生成文案",
      tts: "合成语音",
      avatar: "生成数字人",
      video: "生成视频",
      lipsync: "对口型处理",
    };
    return names[tool] || tool;
  };

  // 复制文本
  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("已复制");
  };

  // 下载PPT
  const downloadPPT = (base64Url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = base64Url;
    link.download = `${filename}.pptx`;
    link.click();
  };

  // 获取文件图标
  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return Image;
      case "pdf":
        return FileText;
      case "spreadsheet":
        return FileSpreadsheet;
      case "presentation":
        return Presentation;
      default:
        return File;
    }
  };

  // 渲染工具结果
  const renderToolResult = (result: ToolResult, index: number) => {
    if (!result.success) {
      return (
        <div
          key={index}
          className={`mt-3 p-3 rounded-lg text-sm border ${
            isDark
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-red-50 text-red-600 border-red-200"
          }`}
        >
          ❌ {result.error || "生成失败"}
        </div>
      );
    }

    switch (result.tool) {
      case "image":
        return (
          <div key={index} className="mt-3">
            <img
              src={result.data.imageUrl}
              alt="生成的图片"
              className="rounded-lg max-w-full shadow-lg max-h-96 object-contain"
            />
            {result.data.count > 1 && result.data.imageUrls && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {result.data.imageUrls.slice(1).map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    alt={`图片${i + 2}`}
                    className="rounded-lg shadow-md"
                  />
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
                className={`${
                  isDark
                    ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    : "border-gray-200"
                }`}
              >
                <a href={result.data.imageUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-1" />
                  下载图片
                </a>
              </Button>
            </div>
          </div>
        );

      case "image-batch":
        return (
          <div key={index} className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {result.data.imageUrls?.map((url: string, i: number) => (
                <img key={i} src={url} alt={`风格${i + 1}`} className="rounded-lg shadow-md" />
              ))}
            </div>
          </div>
        );

      case "ppt":
        return (
          <div
            key={index}
            className={`mt-3 p-4 rounded-lg border ${
              isDark
                ? "bg-blue-500/10 border-blue-500/20"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className={`flex items-center gap-2 mb-2 ${isDark ? "text-blue-400" : "text-blue-600"}`}>
              <Presentation className="w-5 h-5" />
              <span className="font-medium">PPT已生成</span>
              <Badge
                variant="secondary"
                className={isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}
              >
                {result.data.slideCount} 页
              </Badge>
            </div>
            <Button
              size="sm"
              onClick={() => downloadPPT(result.data.downloadUrl, "演示文稿")}
              className="bg-blue-600 hover:bg-blue-500"
            >
              <Download className="w-4 h-4 mr-1" />
              下载PPT
            </Button>
          </div>
        );

      case "copywriting":
        return (
          <div
            key={index}
            className={`mt-3 p-4 rounded-lg border ${
              isDark
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-emerald-50 border-emerald-200"
            }`}
          >
            <div className={`flex items-center gap-2 mb-2 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
              <FileText className="w-5 h-5" />
              <span className="font-medium">文案已生成</span>
            </div>
            <div className={`whitespace-pre-wrap text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {result.data.content}
            </div>
            <Button
              size="sm"
              variant="outline"
              className={`mt-2 ${
                isDark
                  ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                  : "border-gray-200"
              }`}
              onClick={() => copyText(result.data.content, `copy-${index}`)}
            >
              {copiedId === `copy-${index}` ? (
                <Check className="w-4 h-4 mr-1" />
              ) : (
                <Copy className="w-4 h-4 mr-1" />
              )}
              复制文案
            </Button>
          </div>
        );

      case "tts":
        return (
          <div
            key={index}
            className={`mt-3 p-4 rounded-lg border ${
              isDark
                ? "bg-purple-500/10 border-purple-500/20"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <div className={`flex items-center gap-2 mb-2 ${isDark ? "text-purple-400" : "text-purple-600"}`}>
              <Volume2 className="w-5 h-5" />
              <span className="font-medium">语音已生成</span>
            </div>
            {result.data.audioUrl ? (
              <audio controls className="w-full" src={result.data.audioUrl}>
                您的浏览器不支持音频播放
              </audio>
            ) : result.data.audioData ? (
              <audio
                controls
                className="w-full"
                src={URL.createObjectURL(new Blob([result.data.audioData]))}
              >
                您的浏览器不支持音频播放
              </audio>
            ) : null}
          </div>
        );

      case "avatar":
      case "video":
        return (
          <div
            key={index}
            className={`mt-3 p-4 rounded-lg border ${
              isDark
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className={`flex items-center gap-2 mb-2 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
              <Video className="w-5 h-5" />
              <span className="font-medium">
                {result.tool === "avatar" ? "数字人" : "视频"}任务已提交
              </span>
            </div>
            <p className={`text-sm mb-2 ${isDark ? "text-amber-300/80" : "text-amber-700"}`}>
              {result.data.message || "生成中，请稍后在「我的内容」中查看结果"}
            </p>
            <Badge
              variant="outline"
              className={
                isDark
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              }
            >
              任务ID: {result.data.taskId?.slice(0, 8)}
            </Badge>
          </div>
        );

      default:
        return null;
    }
  };

  // 未初始化时显示加载
  if (!isInitialized) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0e1a]' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-gradient-to-br from-[#0a0e1a] via-[#0d1425] to-[#0a1628]"
          : "bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
      }`}
    >
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 ${
            isDark ? "bg-blue-500/20" : "bg-blue-400/15"
          } rounded-full blur-3xl`}
        />
        <div
          className={`absolute top-1/2 -left-20 w-60 h-60 ${
            isDark ? "bg-purple-500/15" : "bg-purple-400/10"
          } rounded-full blur-3xl`}
        />
        <div
          className={`absolute bottom-20 right-1/4 w-40 h-40 ${
            isDark ? "bg-cyan-500/10" : "bg-cyan-400/10"
          } rounded-full blur-2xl`}
        />
      </div>

      {/* 顶部导航 */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b ${
          isDark ? "bg-[#0d1425]/80 border-white/5" : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className={`${
                isDark
                  ? "text-gray-400 hover:text-white hover:bg-white/5"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  南都AI 智能助手
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startNewConversation}
              className={`${
                isDark
                  ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                  : "border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              新对话
            </Button>
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${
                    isDark
                      ? "text-gray-400 hover:text-white hover:bg-white/5"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <History className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`max-w-md ${
                  isDark ? "bg-[#0d1425] border-white/10" : "bg-white border-gray-200"
                }`}
              >
                <DialogHeader>
                  <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
                    对话历史
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-80">
                  {conversations.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                      暂无历史对话
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                            currentConversationId === conv.id
                              ? isDark
                                ? "bg-blue-500/10 border border-blue-500/20"
                                : "bg-blue-50 border border-blue-200"
                              : isDark
                              ? "bg-white/[0.02] hover:bg-white/5"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isDark ? "text-gray-200" : "text-gray-900"}`}>
                              {conv.title}
                            </div>
                            <div className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                              {new Date(conv.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`text-gray-500 hover:text-red-400 hover:bg-white/5`}
                            onClick={(e) => deleteConversation(conv.id, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          </div>
        </div>
      </header>

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* 空状态 */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              你好，我是南都AI
            </h2>
            <p className={`mb-8 text-center max-w-md ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              我是专门为教培机构打造的智能助手，可以帮你写文案、做海报、制作PPT、生成数字人，还能提供招生建议。
            </p>

            {/* 功能卡片 */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl mb-8">
              {SUGGESTIONS.map((item, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer backdrop-blur-sm transition-all hover:-translate-y-1 group ${
                    isDark
                      ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                      : "bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
                  onClick={() => sendMessage(item.examples[0])}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          isDark
                            ? "bg-blue-500/20 group-hover:bg-blue-500/30"
                            : "bg-blue-100 group-hover:bg-blue-200"
                        }`}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                        />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm mt-0.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 快捷指令 */}
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_COMMANDS.map((cmd, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className={`gap-2 ${
                    isDark
                      ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                      : "border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => sendMessage(cmd.prompt)}
                >
                  <cmd.icon className="w-4 h-4" />
                  {cmd.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 消息列表 */}
        {messages.length > 0 && (
          <div className="space-y-4 mb-32">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {/* 头像 */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500"
                        : "bg-gradient-to-br from-purple-500 to-pink-500"
                    } shadow-lg`}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                        : isDark
                        ? "bg-white/[0.05] backdrop-blur-sm border border-white/5 text-gray-200"
                        : "bg-white border border-gray-200 text-gray-900 shadow-sm"
                    }`}
                  >
                    {/* 用户附件 */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {message.attachments.map((file, i) => {
                          const FileIcon = getFileIcon(file.category);
                          return (
                            <div
                              key={i}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                                message.role === "user"
                                  ? "bg-white/20"
                                  : isDark
                                  ? "bg-white/5"
                                  : "bg-gray-100"
                              }`}
                            >
                              <FileIcon className="w-3.5 h-3.5" />
                              {file.name}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 消息文本 */}
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.displayContent || message.content}
                      {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />
                      )}
                    </div>

                    {/* 工具结果 */}
                    {message.toolResults &&
                      message.toolResults.map((result, i) => renderToolResult(result, i))}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 输入区域 */}
        <div
          className={`fixed bottom-0 left-0 right-0 backdrop-blur-md border-t p-4 ${
            isDark ? "bg-[#0d1425]/90 border-white/5" : "bg-white/90 border-gray-200"
          }`}
        >
          <div className="max-w-4xl mx-auto">
            {/* 已上传文件显示 */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uploadedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.category);
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                        isDark
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                    >
                      <FileIcon className="w-4 h-4" />
                      <span className="max-w-[150px] truncate">{file.name}</span>
                      <button
                        onClick={() => removeUploadedFile(index)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 快捷指令（有消息时） */}
            {messages.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {QUICK_COMMANDS.slice(0, 4).map((cmd, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 flex-shrink-0 ${
                      isDark
                        ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                        : "border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => sendMessage(cmd.prompt)}
                  >
                    <cmd.icon className="w-3.5 h-3.5" />
                    {cmd.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {/* 文件上传按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.json,.csv"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isLoading}
                className={`flex-shrink-0 ${
                  isDark
                    ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
                title="上传文件（支持图片、PDF、Word、Excel、PPT、文本文件）"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>

              {/* 语音按钮 */}
              {isSupported && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex-shrink-0 ${
                    isRecording
                      ? ""
                      : isDark
                      ? "bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
                      : "border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input, uploadedFiles.length > 0 ? uploadedFiles : undefined);
                  }
                }}
                placeholder={
                  isRecording
                    ? "正在录音..."
                    : uploadedFiles.length > 0
                    ? "输入指令（如：帮我生成PPT）..."
                    : "输入你的需求，或上传文件..."
                }
                className={`flex-1 ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    : "border-gray-200"
                } focus:border-blue-500/50`}
                disabled={isLoading || isRecording}
              />
              <Button
                onClick={() =>
                  sendMessage(
                    input,
                    uploadedFiles.length > 0 ? uploadedFiles : undefined
                  )
                }
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
