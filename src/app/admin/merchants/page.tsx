"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Search,
  Plus,
  Eye,
  Edit,
  Phone,
  MapPin,
  Calendar,
  Users,
} from "lucide-react";

interface Merchant {
  id: string;
  name: string;
  institution: string;
  phone: string;
  membershipType: string;
  category: string;
  province: string;
  city: string;
  createdAt: string;
  status: "active" | "inactive" | "trial";
  teacherCount: number;
  studentCount: number;
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  yearlyPrice?: number | null;
}

const MONTHLY_PRICE_BY_PLAN_NAME: Record<string, number> = {
  基础版: 199,
  专业版: 699,
  企业版: 1299,
};
const YEARLY_PRICE_BY_PLAN_NAME: Record<string, number> = {
  基础版: 1980,
  专业版: 6800,
  企业版: 12800,
};

export default function AdminMerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberForm, setMemberForm] = useState({
    mode: "manual" as "manual" | "online",
    planId: "",
    billingCycle: "monthly" as "monthly" | "yearly",
    provider: "wechat" as "wechat" | "alipay",
  });
  const [form, setForm] = useState({
    phone: "",
    password: "123456",
    name: "",
    institution: "",
    category: "",
    city: "",
  });

  useEffect(() => {
    fetchMerchants();
    fetchPlans();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/merchants", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const mapped = (data.merchants || []).map((m: any) => ({
          id: m.id,
          name: m.name || "",
          institution: m.institution || m.name || "未命名机构",
          phone: m.phone || "",
          membershipType: m.subscription || "免费版",
          category: m.category || "未分类",
          province: "",
          city: m.city || "",
          createdAt: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
          status: "active",
          teacherCount: 0,
          studentCount: 0,
        }));
        setMerchants(mapped);
      }
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
      setMerchants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/plans", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) return;
      const list = (data.plans || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        yearlyPrice: typeof p.yearlyPrice === "number" ? p.yearlyPrice : null,
      }));
      setPlans(list);
      const defaultPlan =
        list.find((p) => p.name === "基础版" || p.name.includes("基础版")) || list[0];
      if (defaultPlan?.id) {
        setMemberForm((prev) => ({ ...prev, planId: defaultPlan.id }));
      }
    } catch {}
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      active: { label: "已开通", className: "bg-green-500/20 text-green-400" },
      trial: { label: "试用中", className: "bg-blue-500/20 text-blue-400" },
      inactive: { label: "已停用", className: "bg-red-500/20 text-red-400" },
    };
    const item = config[status] || config.inactive;
    return <Badge className={item.className}>{item.label}</Badge>;
  };

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      !search ||
      m.institution.includes(search) ||
      m.phone.includes(search) ||
      m.name.includes(search);
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetail = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setDetailOpen(true);
  };

  const handleCreateMerchant = async () => {
    if (!form.phone || !form.password) {
      toast.error("请填写手机号和密码");
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/merchants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "新增失败");
      toast.success("商家创建成功");
      setCreateOpen(false);
      setForm({
        phone: "",
        password: "123456",
        name: "",
        institution: "",
        category: "",
        city: "",
      });
      fetchMerchants();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "新增失败");
    } finally {
      setCreating(false);
    }
  };

  const currentPlan =
    plans.find((p) => p.id === memberForm.planId) || plans[0];
  const currentAmount =
    memberForm.billingCycle === "monthly"
      ? MONTHLY_PRICE_BY_PLAN_NAME[currentPlan?.name || ""] ??
        Number(((currentPlan?.price || 0) / 12).toFixed(2))
      : YEARLY_PRICE_BY_PLAN_NAME[currentPlan?.name || ""] ?? (currentPlan?.yearlyPrice || currentPlan?.price || 0);

  const openMemberDialog = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setMemberOpen(true);
  };

  const handleSubmitMemberAction = async () => {
    if (!selectedMerchant) return;
    const resolvedPlanId =
      memberForm.planId ||
      plans[0]?.id ||
      "";
    setMemberLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (memberForm.mode === "manual") {
        const months = memberForm.billingCycle === "monthly" ? 1 : 12;
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone: selectedMerchant.phone,
            planId: resolvedPlanId || undefined,
            planName: currentPlan?.name || "基础版",
            months,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "手动开通失败");
        toast.success("会员已手动开通");
      } else {
        const response = await fetch("/api/admin/finance/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            merchantId: selectedMerchant.id,
            planId: resolvedPlanId,
            provider: memberForm.provider,
            channel: "page",
            billingCycle: memberForm.billingCycle,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "创建支付订单失败");
        toast.success(`支付订单创建成功：${data.orderNo}`);
      }

      setMemberOpen(false);
      fetchMerchants();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setMemberLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 搜索和筛选 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索商家名称、手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-800 border-white/10 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已开通</SelectItem>
                <SelectItem value="trial">试用中</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新增商家
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 商家列表 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-base">
            商家列表 ({filteredMerchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">机构名称</TableHead>
                  <TableHead className="text-slate-400">联系人</TableHead>
                  <TableHead className="text-slate-400">手机号</TableHead>
                  <TableHead className="text-slate-400">会员类型</TableHead>
                  <TableHead className="text-slate-400">类别</TableHead>
                  <TableHead className="text-slate-400">地区</TableHead>
                  <TableHead className="text-slate-400">老师/学员</TableHead>
                  <TableHead className="text-slate-400">状态</TableHead>
                  <TableHead className="text-slate-400">入驻时间</TableHead>
                  <TableHead className="text-slate-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMerchants.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={10} className="text-center text-slate-400 py-8">
                      暂无商家数据
                    </TableCell>
                  </TableRow>
                ) : filteredMerchants.map((merchant) => (
                  <TableRow
                    key={merchant.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <p className="text-white font-medium">{merchant.institution}</p>
                    </TableCell>
                    <TableCell className="text-slate-300">{merchant.name}</TableCell>
                    <TableCell className="text-slate-300">{merchant.phone}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          merchant.membershipType === "企业版"
                            ? "bg-purple-500/20 text-purple-300"
                            : merchant.membershipType === "专业版"
                              ? "bg-blue-500/20 text-blue-300"
                              : merchant.membershipType === "基础版"
                                ? "bg-green-500/20 text-green-300"
                                : "bg-slate-500/20 text-slate-300"
                        }
                      >
                        {merchant.membershipType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {merchant.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {merchant.city}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {merchant.teacherCount}/{merchant.studentCount}
                    </TableCell>
                    <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {merchant.createdAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(merchant)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => openMemberDialog(merchant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">新增商家</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="手机号 *"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Input
              placeholder="密码 *"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Input
              placeholder="联系人"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Input
              placeholder="机构名称"
              value={form.institution}
              onChange={(e) => setForm((prev) => ({ ...prev, institution: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Input
              placeholder="机构分类"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Input
              placeholder="城市"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              className="bg-slate-800 border-white/10 text-white"
            />
            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleCreateMerchant} disabled={creating}>
              {creating ? "创建中..." : "确认创建"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">商家详情</DialogTitle>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedMerchant.institution[0]}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {selectedMerchant.institution}
                  </p>
                  <p className="text-sm text-slate-400">
                    {selectedMerchant.category}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{selectedMerchant.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    {selectedMerchant.province} {selectedMerchant.city}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    入驻时间: {selectedMerchant.createdAt}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    老师 {selectedMerchant.teacherCount} 人 · 学员 {selectedMerchant.studentCount} 人
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  onClick={() => toast.info("编辑功能即将上线")}
                >
                  编辑信息
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => {
                    setDetailOpen(false);
                    router.push("/login");
                  }}
                >
                  登录后台
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 会员操作弹窗（融合会员管理） */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">会员开通 - {selectedMerchant?.institution || "-"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select
              value={memberForm.mode}
              onValueChange={(value: "manual" | "online") => setMemberForm((prev) => ({ ...prev, mode: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder="选择开通方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">后台手动开通</SelectItem>
                <SelectItem value="online">线上支付开通</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <p className="text-sm text-slate-400">选择套餐</p>
              <Select value={memberForm.planId} onValueChange={(value) => setMemberForm((prev) => ({ ...prev, planId: value }))}>
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue placeholder="请选择套餐" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-slate-400">选择周期</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={
                    memberForm.billingCycle === "monthly"
                      ? "border-orange-500 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                      : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }
                  onClick={() => setMemberForm((prev) => ({ ...prev, billingCycle: "monthly" }))}
                >
                  月度
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    memberForm.billingCycle === "yearly"
                      ? "border-orange-500 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30"
                      : "border-white/10 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }
                  onClick={() => setMemberForm((prev) => ({ ...prev, billingCycle: "yearly" }))}
                >
                  年度
                </Button>
              </div>
            </div>

            {memberForm.mode === "online" && (
              <Select
                value={memberForm.provider}
                onValueChange={(value: "wechat" | "alipay") => setMemberForm((prev) => ({ ...prev, provider: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue placeholder="选择支付通道" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wechat">微信支付</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="text-sm text-slate-300 rounded-md border border-white/10 bg-slate-800 p-3">
              当前金额：<span className="text-white font-medium">¥{currentAmount.toLocaleString()}</span>
              <span className="text-slate-400 ml-2">({memberForm.billingCycle === "monthly" ? "月度" : "年度"})</span>
            </div>

            <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleSubmitMemberAction} disabled={memberLoading}>
              {memberLoading ? "处理中..." : memberForm.mode === "manual" ? "确认手动开通" : "创建线上支付订单"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
