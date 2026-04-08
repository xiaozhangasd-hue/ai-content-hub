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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TrialClass {
  id: string;
  name: string;
  phone: string;
  childName?: string;
  intentCourse?: string;
  status: string;
  lastContact?: string;
  note?: string;
  createdAt: string;
}

interface TrialStats {
  summary: {
    invited: number;
    trialed: number;
    signed: number;
    lost: number;
    total: number;
    trialRate: number;
    signRate: number;
    overallRate: number;
  };
  courseStats: Array<{ course: string; count: number }>;
  dailyStats: Array<{ date: string; trials: number; signed: number }>;
  period: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  invited: { label: "已邀约", color: "bg-purple-100 text-purple-700" },
  trial: { label: "已试听", color: "bg-cyan-100 text-cyan-700" },
  signed: { label: "已签约", color: "bg-green-100 text-green-700" },
  lost: { label: "未签约", color: "bg-red-100 text-red-700" },
};

const COLORS = ["#8b5cf6", "#22c55e", "#ef4444", "#3b82f6"];

export default function TrialClassesPage() {
  const router = useRouter();
  const [trials, setTrials] = useState<TrialClass[]>([]);
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<TrialClass | null>(null);
  const [feedbacks, setFeedbacks] = useState<Array<unknown>>([]);

  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    feedback: "",
    interested: true,
    status: "trial",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
    fetchStats();
  }, [router, page, statusFilter, search, period]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "10");
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/principal/trial-classes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTrials(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取试听列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/trial-classes/stats?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    }
  };

  const handleViewDetail = async (trial: TrialClass) => {
    setSelectedTrial(trial);
    setIsDetailDialogOpen(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/trial-classes/${trial.id}/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
      }
    } catch (error) {
      console.error("获取反馈失败:", error);
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedTrial) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/trial-classes/${selectedTrial.id}/feedback`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackData),
      });
      const data = await response.json();
      if (data.success) {
        setIsFeedbackDialogOpen(false);
        setFeedbackData({
          rating: 5,
          feedback: "",
          interested: true,
          status: "trial",
        });
        fetchData();
        fetchStats();
      }
    } catch (error) {
      console.error("添加反馈失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">试听管理</h1>
          <p className="text-muted-foreground">管理试听学员，提升转化率</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { fetchData(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>已邀约</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.summary.invited}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                <span>已试听</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.summary.trialed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>已签约</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">{stats.summary.signed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>试听率</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.summary.trialRate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Star className="w-4 h-4" />
                <span>签约率</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">{stats.summary.signRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 图表 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">试听趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="trials" stroke="#8b5cf6" name="试听" />
                    <Line type="monotone" dataKey="signed" stroke="#22c55e" name="签约" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">课程分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.courseStats.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="course" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="数量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
          </div>
        </CardContent>
      </Card>

      {/* 试听列表 */}
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
                <TableHead className="hidden md:table-cell">创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : trials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无试听数据
                  </TableCell>
                </TableRow>
              ) : (
                trials.map((trial) => (
                  <TableRow key={trial.id}>
                    <TableCell className="font-medium">{trial.name}</TableCell>
                    <TableCell>{trial.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {trial.childName || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {trial.intentCourse || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[trial.status]?.color}>
                        {STATUS_MAP[trial.status]?.label || trial.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(trial.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(trial)}>
                            <Eye className="w-4 h-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTrial(trial);
                              setFeedbackData({ ...feedbackData, status: "trial", interested: true });
                              setIsFeedbackDialogOpen(true);
                            }}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            添加反馈
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTrial(trial);
                              setFeedbackData({ ...feedbackData, status: "signed", interested: true });
                              setIsFeedbackDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            标记签约
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTrial(trial);
                              setFeedbackData({ ...feedbackData, status: "lost", interested: false });
                              setIsFeedbackDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            标记未签约
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

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>试听详情</DialogTitle>
          </DialogHeader>
          {selectedTrial && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">家长姓名</div>
                  <div className="font-medium text-gray-900">{selectedTrial.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">联系电话</div>
                  <div className="font-medium text-gray-900">{selectedTrial.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">孩子姓名</div>
                  <div className="font-medium text-gray-900">{selectedTrial.childName || "-"}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">状态</div>
                  <Badge className={STATUS_MAP[selectedTrial.status]?.color}>
                    {STATUS_MAP[selectedTrial.status]?.label || selectedTrial.status}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">备注</div>
                <div className="p-3 bg-muted rounded text-sm">
                  {selectedTrial.note || "无备注"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">反馈记录</div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((fb, index) => {
                      const f = fb as { content?: string; createdAt?: string };
                      return (
                        <div key={index} className="p-3 bg-muted rounded">
                          <div className="text-sm">{f.content || ""}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      暂无反馈记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 反馈对话框 */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>试听反馈</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>评分</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= feedbackData.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>是否有意向</Label>
              <Select
                value={feedbackData.interested ? "yes" : "no"}
                onValueChange={(v) => setFeedbackData({ ...feedbackData, interested: v === "yes" })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">有意向</SelectItem>
                  <SelectItem value="no">无意向</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>反馈内容</Label>
              <Textarea
                value={feedbackData.feedback}
                onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                placeholder="请输入试听反馈"
                rows={3}
              />
            </div>
            <Button onClick={handleAddFeedback} className="w-full">
              保存反馈
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
