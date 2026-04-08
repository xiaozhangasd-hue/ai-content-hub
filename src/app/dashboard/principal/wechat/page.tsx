"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  templateId: string;
  description: string;
  content: string;
  status: string;
}

interface MessageLog {
  id: string;
  templateId: string;
  recipient: { id: string; name: string; phone: string };
  content: Record<string, string>;
  status: string;
  sentAt: string;
  errorMessage?: string;
}

export default function WechatMessagesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "logs">("templates");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const [sendData, setSendData] = useState({
    recipientId: "",
    data: {} as Record<string, string>,
    sendTime: "",
  });

  const [recipients, setRecipients] = useState<Array<{ id: string; name: string; phone: string }>>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTemplates();
    fetchLogs();
    fetchRecipients();
  }, [router, page]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/wechat/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("获取模板失败:", error);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());

      const response = await fetch(`/api/principal/wechat/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("获取消息记录失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/crm/leads?pageSize=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRecipients(data.data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          phone: c.phone as string,
        })));
      }
    } catch (error) {
      console.error("获取接收者列表失败:", error);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/wechat/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: selectedTemplate.templateId,
          recipientId: sendData.recipientId,
          data: sendData.data,
          sendTime: sendData.sendTime || undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsSendDialogOpen(false);
        setSelectedTemplate(null);
        setSendData({
          recipientId: "",
          data: {},
          sendTime: "",
        });
        fetchLogs();
      }
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  const openSendDialog = (template: Template) => {
    setSelectedTemplate(template);
    // 解析模板变量
    const variables = template.content.match(/{{(\w+)}}/g)?.map((v) => v.replace(/{{|}}/g, "")) || [];
    const initialData: Record<string, string> = {};
    variables.forEach((v) => {
      initialData[v] = "";
    });
    setSendData({
      recipientId: "",
      data: initialData,
      sendTime: "",
    });
    setIsSendDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">微信订阅消息</h1>
          <p className="text-muted-foreground">管理微信订阅消息模板与发送记录</p>
        </div>
        <Button variant="outline" onClick={() => { fetchTemplates(); fetchLogs(); }}>
          <RefreshCw className="w-4 h-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>总发送数</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>发送成功</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-green-600">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <XCircle className="w-4 h-4" />
              <span>发送失败</span>
            </div>
            <div className="text-2xl font-bold mt-2 text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 font-medium ${
            activeTab === "templates"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          消息模板
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 font-medium ${
            activeTab === "logs"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          发送记录
        </button>
      </div>

      {/* 模板列表 */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge className="bg-green-100 text-green-700">已启用</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </div>
                <div className="p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap mb-3">
                  {template.content}
                </div>
                <Button onClick={() => openSendDialog(template)} className="w-full">
                  <Send className="w-4 h-4 mr-1" />
                  发送消息
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 发送记录 */}
      {activeTab === "logs" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>模板</TableHead>
                  <TableHead>接收人</TableHead>
                  <TableHead className="hidden md:table-cell">内容</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发送时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无发送记录
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.templateId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.recipient.name}</div>
                          <div className="text-xs text-muted-foreground">{log.recipient.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-[200px] truncate text-sm">
                          {Object.entries(log.content).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.status === "sent"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {log.status === "sent" ? "已发送" : "失败"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.sentAt).toLocaleString("zh-CN")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 分页 */}
      {activeTab === "logs" && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 发送消息对话框 */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>发送消息 - {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>接收人</Label>
              <Select
                value={sendData.recipientId}
                onValueChange={(v) => setSendData({ ...sendData, recipientId: v })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue placeholder="选择接收人" />
                </SelectTrigger>
                <SelectContent>
                  {recipients.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {Object.keys(sendData.data).length > 0 && (
              <div className="space-y-2">
                <Label>消息内容</Label>
                {Object.entries(sendData.data).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="w-20 text-sm text-muted-foreground">{key}</span>
                    <Input
                      value={value}
                      onChange={(e) =>
                        setSendData({
                          ...sendData,
                          data: { ...sendData.data, [key]: e.target.value },
                        })
                      }
                      placeholder={`请输入${key}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>定时发送（可选）</Label>
              <Input
                type="datetime-local"
                value={sendData.sendTime}
                onChange={(e) => setSendData({ ...sendData, sendTime: e.target.value })}
              />
            </div>

            <Button onClick={handleSend} className="w-full" disabled={!sendData.recipientId}>
              <Send className="w-4 h-4 mr-1" />
              {sendData.sendTime ? "定时发送" : "立即发送"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
