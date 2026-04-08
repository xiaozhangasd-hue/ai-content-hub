"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  RefreshCw,
  Gift,
  Calendar,
  FileText,
  Heart,
  History,
  Copy,
  Share2,
  Star,
  Loader2,
  Trash2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Scene {
  id: string;
  name: string;
  icon: string;
  description: string;
  templates: Array<{ id: string; name: string; type: string }>;
}

interface HistoryRecord {
  id: string;
  sceneId: string;
  sceneName: string;
  templateId: string;
  templateName: string;
  prompt: string;
  content: string;
  isFavorite: boolean;
  createdAt: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="w-6 h-6" />,
  RefreshCw: <RefreshCw className="w-6 h-6" />,
  Gift: <Gift className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  FileText: <FileText className="w-6 h-6" />,
};

export default function AIAssistantPage() {
  const router = useRouter();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("zh");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [favorites, setFavorites] = useState<HistoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchScenes();
    fetchHistory();
    fetchFavorites();
  }, [router]);

  const fetchScenes = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/ai-assistant/scenes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      setScenes(data.data);
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/ai-assistant/history?page=${historyPage}&pageSize=20`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      setHistory(data.data);
    }
  };

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/ai-assistant/history?favorite=true&pageSize=50", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (data.success) {
      setFavorites(data.data);
    }
  };

  const handleGenerate = async () => {
    if (!selectedScene || !selectedTemplate || !prompt.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai-assistant/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sceneId: selectedScene.id,
          templateId: selectedTemplate,
          prompt,
          options: { language },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(data.data.content);
        fetchHistory();
      }
    } catch (error) {
      console.error("生成失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    alert("已复制到剪贴板");
  };

  const handleFavorite = async (id: string, isFavorite: boolean) => {
    const token = localStorage.getItem("token");
    await fetch("/api/ai-assistant/favorite", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, isFavorite: !isFavorite }),
    });
    fetchHistory();
    fetchFavorites();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    const token = localStorage.getItem("token");
    await fetch(`/api/ai-assistant/favorite?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchHistory();
    fetchFavorites();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">智能助手</h1>
          <p className="text-muted-foreground">AI辅助内容创作，提升工作效率</p>
        </div>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[100px] text-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh">中文</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-2" />
            内容生成
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            历史记录
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Heart className="w-4 h-4 mr-2" />
            我的收藏
          </TabsTrigger>
        </TabsList>

        {/* 内容生成 */}
        <TabsContent value="generate" className="space-y-6">
          {/* 场景选择 */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-900">选择场景</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {scenes.map((scene) => (
                <Card
                  key={scene.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedScene?.id === scene.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => {
                    setSelectedScene(scene);
                    setSelectedTemplate("");
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-2 text-primary">
                      {iconMap[scene.icon]}
                    </div>
                    <div className="font-medium text-gray-900">{scene.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {scene.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 模板选择和输入 */}
          {selectedScene && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedScene.name} - 选择模板
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {selectedScene.templates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">输入内容描述</label>
                  <Textarea
                    placeholder="请输入要生成的内容描述，如：课程名称、学员姓名、活动主题等..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={isLoading || !selectedTemplate}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成内容
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 生成结果 */}
          {generatedContent && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">生成结果</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleCopy(generatedContent)}>
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    分享
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {generatedContent}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 历史记录 */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                暂无历史记录
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{record.sceneName}</Badge>
                        <Badge variant="outline">{record.templateName}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      输入：{record.prompt}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg mb-2 max-h-[200px] overflow-y-auto">
                      {record.content}
                    </pre>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(record.content)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        复制
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFavorite(record.id, record.isFavorite)}
                      >
                        <Star
                          className={`w-4 h-4 mr-1 ${
                            record.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                          }`}
                        />
                        {record.isFavorite ? "取消收藏" : "收藏"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 我的收藏 */}
        <TabsContent value="favorites" className="space-y-4">
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                暂无收藏内容
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{record.sceneName}</Badge>
                      <Badge variant="outline">{record.templateName}</Badge>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded-lg mb-2 max-h-[150px] overflow-y-auto">
                      {record.content}
                    </pre>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(record.content)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFavorite(record.id, true)}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
