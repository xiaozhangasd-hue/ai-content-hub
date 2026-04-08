"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Phone,
  Clock,
  Download,
  PieChart,
  UserPlus,
} from "lucide-react";
import {
  FunnelChart as RechartsFunnel,
  Funnel,
  LabelList,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface Lead {
  id: string;
  name: string;
  phone: string;
  childName: string | null;
  childAge: number | null;
  source: string | null;
  status: string;
  level: string;
  intentCourse: string | null;
  lastContact: string | null;
  nextFollowUp: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "新咨询",
  contacted: "已联系",
  invited: "已邀约",
  trial: "已试听",
  signed: "已报名",
  lost: "已流失",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  invited: "bg-purple-100 text-purple-700",
  trial: "bg-orange-100 text-orange-700",
  signed: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-700",
};

const SOURCE_LABELS: Record<string, string> = {
  douyin: "抖音",
  referral: "转介绍",
  ground: "地推",
  call: "电话",
  other: "其他",
};

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [funnelData, setFunnelData] = useState<Array<{ name: string; value: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    childName: "",
    childAge: "",
    source: "",
    intentCourse: "",
    note: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchLeads();
    fetchFunnel();
  }, [router, search, statusFilter, sourceFilter]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (sourceFilter) params.append("source", sourceFilter);

      const response = await fetch(`/api/principal/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("获取线索列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFunnel = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/leads/funnel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFunnelData(data.data.funnel);
      }
    } catch (error) {
      console.error("获取漏斗数据失败:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/leads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        fetchLeads();
        setFormData({
          name: "",
          phone: "",
          childName: "",
          childAge: "",
          source: "",
          intentCourse: "",
          note: "",
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("创建线索失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">招生线索</h1>
          <p className="text-muted-foreground">管理所有招生线索</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加线索
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名或手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] text-gray-900">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[120px] text-gray-900">
                <SelectValue placeholder="来源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部来源</SelectItem>
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 转化漏斗 */}
      {funnelData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsFunnel>
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    {funnelData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Funnel>
                </RechartsFunnel>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 线索列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-4">姓名</th>
                  <th className="text-left p-4">手机号</th>
                  <th className="text-left p-4">孩子</th>
                  <th className="text-left p-4">来源</th>
                  <th className="text-left p-4">状态</th>
                  <th className="text-left p-4">意向课程</th>
                  <th className="text-left p-4">创建时间</th>
                  <th className="text-left p-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{lead.name}</td>
                    <td className="p-4">{lead.phone}</td>
                    <td className="p-4">
                      {lead.childName}
                      {lead.childAge && ` (${lead.childAge}岁)`}
                    </td>
                    <td className="p-4">
                      {lead.source ? SOURCE_LABELS[lead.source] || lead.source : "-"}
                    </td>
                    <td className="p-4">
                      <Badge className={STATUS_COLORS[lead.status] || ""}>
                        {STATUS_LABELS[lead.status] || lead.status}
                      </Badge>
                    </td>
                    <td className="p-4">{lead.intentCourse || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 添加线索对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加线索</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">家长姓名 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入家长姓名"
                />
              </div>
              <div>
                <label className="text-sm font-medium">手机号 *</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">孩子姓名</label>
                <Input
                  value={formData.childName}
                  onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                  placeholder="请输入孩子姓名"
                />
              </div>
              <div>
                <label className="text-sm font-medium">孩子年龄</label>
                <Input
                  type="number"
                  value={formData.childAge}
                  onChange={(e) => setFormData({ ...formData, childAge: e.target.value })}
                  placeholder="请输入年龄"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">来源</label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue placeholder="选择来源" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">意向课程</label>
                <Input
                  value={formData.intentCourse}
                  onChange={(e) => setFormData({ ...formData, intentCourse: e.target.value })}
                  placeholder="请输入意向课程"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
