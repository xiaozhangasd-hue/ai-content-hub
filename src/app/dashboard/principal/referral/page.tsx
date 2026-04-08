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
  Gift,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Link2,
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  CheckCircle,
  Clock,
  QrCode,
  Share2,
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
} from "recharts";

interface ReferralCode {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  description?: string;
  status: string;
  usageCount: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

interface Reward {
  id: string;
  amount: number;
  status: string;
  description?: string;
  customer?: { id: string; name: string; phone: string };
  createdAt: string;
  paidAt?: string;
}

interface ReferralStats {
  overview: {
    totalReferrals: number;
    totalRewards: number;
    pendingRewards: number;
    activeCodes: number;
    totalCodes: number;
  };
  referrerStats: Array<{
    referrer: { id: string; name: string };
    referralCount: number;
    rewardAmount: number;
  }>;
  dailyStats: Array<{ date: string; count: number }>;
  recentUsages: Array<{
    id: string;
    code: string;
    usedAt: string;
    customer?: { id: string; name: string };
  }>;
  period: string;
}

export default function ReferralPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"codes" | "rewards">("codes");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateCodeDialogOpen, setIsCreateCodeDialogOpen] = useState(false);
  const [isRewardDialogOpen, setIsRewardDialogOpen] = useState(false);
  const [selectedRewardIds, setSelectedRewardIds] = useState<string[]>([]);

  const [codeFormData, setCodeFormData] = useState({
    description: "",
    discountType: "fixed",
    discountValue: 100,
    validDays: 365,
    count: 1,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchCodes();
    fetchRewards();
    fetchStats();
  }, [router, page, search, period]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (search) params.append("search", search);

      const response = await fetch(`/api/principal/referral/codes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCodes(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取推荐码失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", "1");
      params.append("pageSize", "50");

      const response = await fetch(`/api/principal/referral/rewards?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setRewards(data.data);
      }
    } catch (error) {
      console.error("获取奖励记录失败:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/referral/stats?period=${period}`, {
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

  const handleCreateCodes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/referral/codes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(codeFormData),
      });
      const data = await response.json();
      if (data.success) {
        setIsCreateCodeDialogOpen(false);
        setCodeFormData({
          description: "",
          discountType: "fixed",
          discountValue: 100,
          validDays: 365,
          count: 1,
        });
        fetchCodes();
        fetchStats();
      }
    } catch (error) {
      console.error("创建推荐码失败:", error);
    }
  };

  const handleUpdateCodeStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/referral/codes", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (data.success) {
        fetchCodes();
      }
    } catch (error) {
      console.error("更新推荐码状态失败:", error);
    }
  };

  const handlePayRewards = async () => {
    if (selectedRewardIds.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/referral/rewards", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rewardIds: selectedRewardIds }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedRewardIds([]);
        setIsRewardDialogOpen(false);
        fetchRewards();
        fetchStats();
      }
    } catch (error) {
      console.error("发放奖励失败:", error);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("推荐码已复制");
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">转介绍激励</h1>
          <p className="text-muted-foreground">管理推荐码，发放转介绍奖励</p>
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
          <Button variant="outline" onClick={() => { fetchCodes(); fetchRewards(); fetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                <span>总转介绍</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.totalReferrals}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="w-4 h-4" />
                <span>总奖励</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">
                ¥{stats.overview.totalRewards.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>待发放</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-orange-600">
                ¥{stats.overview.pendingRewards.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Link2 className="w-4 h-4" />
                <span>活跃推荐码</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.activeCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>总推荐码</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.overview.totalCodes}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 图表 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">转介绍趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="转介绍数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">推荐人排名</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] overflow-y-auto">
                {stats.referrerStats.length > 0 ? (
                  <div className="space-y-2">
                    {stats.referrerStats.map((stat, index) => (
                      <div
                        key={stat.referrer.id}
                        className="flex items-center justify-between p-3 bg-muted rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? "bg-yellow-400 text-white" :
                            index === 1 ? "bg-gray-400 text-white" :
                            index === 2 ? "bg-orange-400 text-white" :
                            "bg-muted-foreground/20"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{stat.referrer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {stat.referralCount} 次转介绍
                            </div>
                          </div>
                        </div>
                        <div className="text-green-600 font-medium">
                          ¥{stat.rewardAmount}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无推荐人数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 标签页 */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("codes")}
          className={`px-4 py-2 font-medium ${
            activeTab === "codes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          推荐码管理
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`px-4 py-2 font-medium ${
            activeTab === "rewards"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          奖励发放
        </button>
      </div>

      {/* 推荐码管理 */}
      {activeTab === "codes" && (
        <>
          <div className="flex items-center justify-between">
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索推荐码..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsCreateCodeDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              生成推荐码
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>推荐码</TableHead>
                    <TableHead className="hidden md:table-cell">优惠</TableHead>
                    <TableHead className="hidden md:table-cell">描述</TableHead>
                    <TableHead className="text-center">使用次数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden md:table-cell">有效期</TableHead>
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
                  ) : codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无推荐码
                      </TableCell>
                    </TableRow>
                  ) : (
                    codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono font-bold">{code.code}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {code.discountType === "fixed"
                            ? `¥${code.discountValue}`
                            : `${code.discountValue}%`}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {code.description || "-"}
                        </TableCell>
                        <TableCell className="text-center">{code.usageCount}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              code.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {code.status === "active" ? "有效" : "已停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(code.validFrom).toLocaleDateString()} - {new Date(code.validTo).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCode(code.code)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            {code.status === "active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateCodeStatus(code.id, "inactive")}
                              >
                                停用
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateCodeStatus(code.id, "active")}
                              >
                                启用
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* 奖励发放 */}
      {activeTab === "rewards" && (
        <>
          <div className="flex items-center justify-between">
            <Input type="month" className="w-[150px]" />
            <Button onClick={() => setIsRewardDialogOpen(true)}>
              <Gift className="w-4 h-4 mr-1" />
              发放奖励
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>推荐人</TableHead>
                    <TableHead className="text-center">奖励金额</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="hidden md:table-cell">创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无奖励记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{reward.customer?.name || "未知"}</div>
                            <div className="text-xs text-muted-foreground">
                              {reward.customer?.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-green-600">
                          ¥{reward.amount}
                        </TableCell>
                        <TableCell>{reward.description || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              reward.status === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }
                          >
                            {reward.status === "paid" ? "已发放" : "待发放"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(reward.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* 创建推荐码对话框 */}
      <Dialog open={isCreateCodeDialogOpen} onOpenChange={setIsCreateCodeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>生成推荐码</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={codeFormData.description}
                onChange={(e) => setCodeFormData({ ...codeFormData, description: e.target.value })}
                placeholder="如：老带新活动"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>优惠类型</Label>
                <Select
                  value={codeFormData.discountType}
                  onValueChange={(v) => setCodeFormData({ ...codeFormData, discountType: v })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">固定金额</SelectItem>
                    <SelectItem value="percent">百分比</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>优惠金额</Label>
                <Input
                  type="number"
                  value={codeFormData.discountValue}
                  onChange={(e) => setCodeFormData({ ...codeFormData, discountValue: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>有效期(天)</Label>
                <Input
                  type="number"
                  value={codeFormData.validDays}
                  onChange={(e) => setCodeFormData({ ...codeFormData, validDays: parseInt(e.target.value) || 365 })}
                />
              </div>
              <div className="space-y-2">
                <Label>生成数量</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={codeFormData.count}
                  onChange={(e) => setCodeFormData({ ...codeFormData, count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <Button onClick={handleCreateCodes} className="w-full">
              生成推荐码
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 发放奖励对话框 */}
      <Dialog open={isRewardDialogOpen} onOpenChange={setIsRewardDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发放奖励</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto">
              {rewards
                .filter((r) => r.status !== "paid")
                .map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-3 rounded border mb-2 cursor-pointer ${
                      selectedRewardIds.includes(reward.id) ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedRewardIds((prev) =>
                        prev.includes(reward.id)
                          ? prev.filter((id) => id !== reward.id)
                          : [...prev, reward.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{reward.customer?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {reward.description}
                        </div>
                      </div>
                      <div className="font-bold text-green-600">¥{reward.amount}</div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span>已选择 {selectedRewardIds.length} 条</span>
              <span className="font-bold">
                ¥{rewards
                  .filter((r) => selectedRewardIds.includes(r.id))
                  .reduce((sum, r) => sum + r.amount, 0)}
              </span>
            </div>
            <Button
              onClick={handlePayRewards}
              className="w-full"
              disabled={selectedRewardIds.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              标记为已发放
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
