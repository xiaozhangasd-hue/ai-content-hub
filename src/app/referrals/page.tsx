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
  Download,
  Users,
  Gift,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface Referral {
  id: string;
  name: string;
  phone: string;
  childName: string | null;
  status: string;
  tags: string | null;
  createdAt: string;
}

interface ReferralStats {
  total: number;
  thisMonth: number;
  converted: number;
  conversionRate: number;
}

const STATUS_LABELS: Record<string, string> = {
  new: "新咨询",
  contacted: "已联系",
  trial: "已试听",
  signed: "已报名",
  lost: "已流失",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  trial: "bg-orange-100 text-orange-700",
  signed: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-700",
};

const REWARD_TYPES = [
  { value: "hours", label: "赠送课时" },
  { value: "gift", label: "礼品奖励" },
  { value: "cash", label: "现金奖励" },
];

export default function ReferralsPage() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    childName: "",
    childAge: "",
    referrerId: "",
    rewardType: "hours",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchReferrals();
  }, [router, search]);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/principal/referrals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setReferrals(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("获取转介绍列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/referrals", {
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
        fetchReferrals();
        setFormData({
          name: "",
          phone: "",
          childName: "",
          childAge: "",
          referrerId: "",
          rewardType: "hours",
        });
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("创建转介绍失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">转介绍激励</h1>
          <p className="text-muted-foreground">管理转介绍记录和奖励发放</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加转介绍
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                <span>总转介绍</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>本月新增</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.thisMonth}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Gift className="w-4 h-4" />
                <span>已转化</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-green-600">{stats.converted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>转化率</span>
              </div>
              <div className="text-2xl font-bold mt-2">{stats.conversionRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索推荐人或被推荐人..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 转介绍列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-4">被推荐人</th>
                  <th className="text-left p-4">手机号</th>
                  <th className="text-left p-4">孩子</th>
                  <th className="text-left p-4">状态</th>
                  <th className="text-left p-4">奖励</th>
                  <th className="text-left p-4">时间</th>
                  <th className="text-left p-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr key={referral.id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-medium">{referral.name}</td>
                    <td className="p-4">{referral.phone}</td>
                    <td className="p-4">{referral.childName || "-"}</td>
                    <td className="p-4">
                      <Badge className={STATUS_COLORS[referral.status] || ""}>
                        {STATUS_LABELS[referral.status] || referral.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {referral.tags?.includes("课时") ? (
                        <Badge variant="outline">赠送课时</Badge>
                      ) : referral.tags?.includes("礼品") ? (
                        <Badge variant="outline">礼品奖励</Badge>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm">
                        查看
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 添加转介绍对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加转介绍</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">被推荐人姓名 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
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
            <div>
              <label className="text-sm font-medium">奖励类型</label>
              <Select
                value={formData.rewardType}
                onValueChange={(value) => setFormData({ ...formData, rewardType: value })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue placeholder="选择奖励类型" />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
