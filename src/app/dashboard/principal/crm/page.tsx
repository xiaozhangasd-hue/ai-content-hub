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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Calendar,
  UserPlus,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Clock,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";

interface Lead {
  id: string;
  name: string;
  phone: string;
  childName?: string;
  childAge?: number;
  intentCourse?: string;
  source?: string;
  status: string;
  lastContact?: string;
  nextFollowUp?: string;
  note?: string;
  createdAt: string;
}

interface FunnelData {
  funnel: Array<{ name: string; value: number }>;
  rates: Array<{ name: string; rate: number }>;
  overall: {
    total: number;
    converted: number;
    conversionRate: number;
  };
  needFollowUp: Array<{
    id: string;
    name: string;
    phone: string;
    lastContact?: string;
  }>;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: "新线索", color: "bg-blue-100 text-blue-700" },
  contacted: { label: "已联系", color: "bg-yellow-100 text-yellow-700" },
  invited: { label: "已邀约", color: "bg-purple-100 text-purple-700" },
  trial: { label: "已试听", color: "bg-cyan-100 text-cyan-700" },
  signed: { label: "已签约", color: "bg-green-100 text-green-700" },
  lost: { label: "已流失", color: "bg-red-100 text-red-700" },
};

const SOURCE_MAP: Record<string, string> = {
  online: "线上推广",
  referral: "转介绍",
  offline: "地推活动",
  other: "其他",
};

const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#22c55e", "#ef4444"];

export default function CRMLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpRecords, setFollowUpRecords] = useState<Array<unknown>>([]);

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    childName: "",
    childAge: "",
    intentCourse: "",
    source: "online",
    note: "",
  });

  const [followUpData, setFollowUpData] = useState({
    type: "phone",
    content: "",
    result: "",
    nextAction: "",
    nextTime: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
    fetchFunnelData();
  }, [router, page, statusFilter, sourceFilter, search]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "10");
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (sourceFilter) params.append("source", sourceFilter);

      const response = await fetch(`/api/principal/crm/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setLeads(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取线索失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFunnelData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/crm/leads/funnel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFunnelData(data.data);
      }
    } catch (error) {
      console.error("获取漏斗数据失败:", error);
    }
  };

  const handleAddLead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/crm/leads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          childAge: formData.childAge ? parseInt(formData.childAge) : undefined,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAddDialogOpen(false);
        setFormData({
          name: "",
          phone: "",
          childName: "",
          childAge: "",
          intentCourse: "",
          source: "online",
          note: "",
        });
        fetchData();
        fetchFunnelData();
      }
    } catch (error) {
      console.error("添加线索失败:", error);
    }
  };

  const handleViewDetail = async (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
    // 获取跟进记录
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/crm/leads/${lead.id}/followup`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFollowUpRecords(data.data);
      }
    } catch (error) {
      console.error("获取跟进记录失败:", error);
    }
  };

  const handleAddFollowUp = async () => {
    if (!selectedLead) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/crm/leads/${selectedLead.id}/followup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(followUpData),
      });
      const data = await response.json();
      if (data.success) {
        setIsFollowUpDialogOpen(false);
        setFollowUpData({
          type: "phone",
          content: "",
          result: "",
          nextAction: "",
          nextTime: "",
        });
        handleViewDetail(selectedLead);
        fetchData();
      }
    } catch (error) {
      console.error("添加跟进记录失败:", error);
    }
  };

  const handleUpdateStatus = async (leadId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/crm/leads", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: leadId, status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
        fetchFunnelData();
      }
    } catch (error) {
      console.error("更新状态失败:", error);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm("确定要删除该线索吗？")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/crm/leads?id=${leadId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchData();
        fetchFunnelData();
      }
    } catch (error) {
      console.error("删除线索失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">招生CRM</h1>
          <p className="text-muted-foreground">管理招生线索，提升转化效率</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加线索
          </Button>
          <Button variant="outline" onClick={() => { fetchData(); fetchFunnelData(); }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 转化漏斗 */}
      {funnelData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">转化漏斗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel dataKey="value" data={funnelData.funnel} isAnimationActive>
                      <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                      {funnelData.funnel.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="text-muted-foreground">总线索</div>
                  <div className="font-bold text-lg">{funnelData.overall.total}</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-muted-foreground">总转化率</div>
                  <div className="font-bold text-lg">{funnelData.overall.conversionRate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">待跟进提醒</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.needFollowUp.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {funnelData.needFollowUp.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 bg-muted rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => handleViewDetail(lead as Lead)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.phone}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lead.lastContact
                          ? `上次: ${new Date(lead.lastContact).toLocaleDateString()}`
                          : "未联系"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  暂无待跟进线索
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、电话..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] text-gray-900">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                {Object.entries(STATUS_MAP).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px] text-gray-900">
                <SelectValue placeholder="全部来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部来源</SelectItem>
                {Object.entries(SOURCE_MAP).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 线索列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>电话</TableHead>
                <TableHead className="hidden md:table-cell">孩子信息</TableHead>
                <TableHead className="hidden md:table-cell">意向课程</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="hidden md:table-cell">来源</TableHead>
                <TableHead className="hidden md:table-cell">上次跟进</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无线索数据
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.childName && (
                        <div>
                          {lead.childName}
                          {lead.childAge && ` (${lead.childAge}岁)`}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.intentCourse || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[lead.status]?.color}>
                        {STATUS_MAP[lead.status]?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.source ? SOURCE_MAP[lead.source] || lead.source : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {lead.lastContact
                        ? new Date(lead.lastContact).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(lead)}>
                            <Eye className="w-4 h-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsFollowUpDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            添加跟进
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, "signed")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            标记签约
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, "lost")}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            标记流失
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
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

      {/* 添加线索对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加线索</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>家长姓名 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入家长姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>联系电话 *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>孩子姓名</Label>
                <Input
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="请输入孩子姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>孩子年龄</Label>
                <Input
                  type="number"
                  value={formData.childAge}
                  onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                  placeholder="年龄"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>意向课程</Label>
              <Input
                value={formData.intentCourse}
                onChange={(e) => setFormData({ ...formData, intentCourse: e.target.value })}
                placeholder="请输入意向课程"
              />
            </div>
            <div className="space-y-2">
              <Label>来源</Label>
              <Select
                value={formData.source}
                onValueChange={(v) => setFormData({ ...formData, source: v })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_MAP).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="请输入备注信息"
                rows={3}
              />
            </div>
            <Button onClick={handleAddLead} className="w-full">
              添加线索
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 线索详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>线索详情</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">家长姓名</div>
                  <div className="font-medium text-gray-900">{selectedLead.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">联系电话</div>
                  <div className="font-medium text-gray-900">{selectedLead.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">孩子姓名</div>
                  <div className="font-medium text-gray-900">{selectedLead.childName || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">状态</div>
                  <Badge className={STATUS_MAP[selectedLead.status]?.color}>
                    {STATUS_MAP[selectedLead.status]?.label || selectedLead.status}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">备注</div>
                <div className="p-3 bg-muted rounded text-sm">
                  {selectedLead.note || "无备注"}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">跟进记录</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      setIsFollowUpDialogOpen(true);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加跟进
                  </Button>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {followUpRecords.length > 0 ? (
                    followUpRecords.map((record, index) => {
                      const r = record as { type?: string; createdAt?: string; content?: string; result?: string };
                      return (
                        <div key={index} className="p-3 bg-muted rounded">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {r.type === "phone" ? "电话跟进" : 
                               r.type === "visit" ? "到访跟进" :
                               r.type === "trial" ? "试听跟进" : "其他"}
                            </span>
                            <span className="text-muted-foreground">
                              {r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}
                            </span>
                          </div>
                          <div className="mt-1">{r.content || ""}</div>
                          {r.result && (
                            <div className="mt-1 text-sm text-muted-foreground">
                              结果: {r.result}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      暂无跟进记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 添加跟进对话框 */}
      <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加跟进记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>跟进方式</Label>
              <Select
                value={followUpData.type}
                onValueChange={(v) => setFollowUpData({ ...followUpData, type: v })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">电话跟进</SelectItem>
                  <SelectItem value="wechat">微信跟进</SelectItem>
                  <SelectItem value="visit">到访跟进</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>跟进内容 *</Label>
              <Textarea
                value={followUpData.content}
                onChange={(e) => setFollowUpData({ ...followUpData, content: e.target.value })}
                placeholder="请输入跟进内容"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>跟进结果</Label>
              <Input
                value={followUpData.result}
                onChange={(e) => setFollowUpData({ ...followUpData, result: e.target.value })}
                placeholder="如：有意向、暂不考虑"
              />
            </div>
            <div className="space-y-2">
              <Label>下次跟进动作</Label>
              <Input
                value={followUpData.nextAction}
                onChange={(e) => setFollowUpData({ ...followUpData, nextAction: e.target.value })}
                placeholder="如：安排试听、发送资料"
              />
            </div>
            <div className="space-y-2">
              <Label>下次跟进时间</Label>
              <Input
                type="datetime-local"
                value={followUpData.nextTime}
                onChange={(e) => setFollowUpData({ ...followUpData, nextTime: e.target.value })}
              />
            </div>
            <Button onClick={handleAddFollowUp} className="w-full">
              保存跟进记录
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
