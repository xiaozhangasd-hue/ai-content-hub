"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MagicBento from "@/components/MagicBento";
import {
  Building2,
  Users,
  Clock3,
  DollarSign,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  LineChart,
} from "lucide-react";

export default function AdminHomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    totalTeachers: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [workbench, setWorkbench] = useState({
    todo: { pendingOrders: 0, expiringSubs: 0 },
    today: { newMerchants: 0, revenue: 0 },
    recentMerchants: [] as Array<{ id: string; name: string; category: string; createdAt: string; status: string }>,
  });

  const bentoCards = [
    {
      color: "#060010",
      title: "待处理订单",
      description: `${workbench.todo.pendingOrders} 单待跟进`,
      label: "待办",
      href: "/admin/finance?status=pending",
    },
    {
      color: "#060010",
      title: "7天内到期会员",
      description: `${workbench.todo.expiringSubs} 家待续费`,
      label: "预警",
      href: "/admin/merchants",
    },
    {
      color: "#060010",
      title: "今日实收",
      description: `¥${workbench.today.revenue.toLocaleString()}`,
      label: "财务",
      href: "/admin/finance",
    },
    {
      color: "#060010",
      title: "今日新增商家",
      description: `${workbench.today.newMerchants} 家`,
      label: "增长",
      href: "/admin/merchants",
    },
    {
      color: "#060010",
      title: "商家总数",
      description: `${stats.totalMerchants} 家（活跃 ${stats.activeMerchants}）`,
      label: "规模",
      href: "/admin/merchants",
    },
    {
      color: "#060010",
      title: "月度营收",
      description: `¥${stats.monthlyRevenue.toLocaleString()}（+${stats.monthlyGrowth}%）`,
      label: "趋势",
      href: "/admin/reports",
    },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      const [statsRes, wbRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/workbench", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const statsData = await statsRes.json();
      const wbData = await wbRes.json();
      if (statsRes.ok) {
        setStats(statsData);
      }
      if (wbRes.ok) {
        setWorkbench(wbData);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (target?: string) => {
    if (!target) return;
    window.location.href = target;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/40 border-white/10 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-white text-base">运营工作台</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MagicBento
            textAutoHide={true}
            enableStars
            enableSpotlight
            enableBorderGlow={true}
            enableTilt={false}
            enableMagnetism={false}
            clickEffect
            spotlightRadius={400}
            particleCount={12}
            glowColor="132, 0, 255"
            disableAnimations={false}
            cards={bentoCards}
            onCardClick={(card: { href?: string }) => {
              navigateTo(card.href);
            }}
          />
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">商家总数</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.totalMerchants}
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  活跃 {stats.activeMerchants} 家
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">老师总数</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.totalTeachers}
                </p>
                <p className="text-xs text-green-400 mt-1">全平台老师</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">学员总数</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.totalStudents}
                </p>
                <p className="text-xs text-purple-400 mt-1">全平台学员</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">月度营收</p>
                <p className="text-2xl font-bold text-white mt-2">
                  ¥{stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  较上月 +{stats.monthlyGrowth}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/20">
                <DollarSign className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近入驻商家 */}
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4" />
              最近入驻商家
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workbench.recentMerchants.length === 0 ? (
                <div className="text-sm text-slate-400 py-8 text-center">
                  暂无入驻商家数据
                </div>
              ) : workbench.recentMerchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {merchant.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{merchant.name}</p>
                      <p className="text-xs text-slate-400">{merchant.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs ${
                        merchant.status === "已开通"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {merchant.status}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(merchant.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base">快捷操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin/merchants"
                className="block p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors text-left"
              >
                <Building2 className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-white font-medium">新增商家</p>
                <p className="text-xs text-slate-400 mt-1">手动开通商家账号</p>
              </Link>
              <Link
                href="/admin/merchants"
                className="block p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors text-left"
              >
                <Users className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-white font-medium">会员开通</p>
                <p className="text-xs text-slate-400 mt-1">在商家管理中开通会员</p>
              </Link>
              <Link
                href="/admin/reports"
                className="block p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors text-left"
              >
                <LineChart className="w-5 h-5 text-purple-400 mb-2" />
                <p className="text-white font-medium">数据报表</p>
                <p className="text-xs text-slate-400 mt-1">导出运营数据</p>
              </Link>
              <Link
                href="/admin/finance"
                className="block p-4 rounded-lg bg-slate-800/50 border border-white/5 hover:bg-slate-800 transition-colors text-left"
              >
                <DollarSign className="w-5 h-5 text-orange-400 mb-2" />
                <p className="text-white font-medium">财务管理</p>
                <p className="text-xs text-slate-400 mt-1">查看账单明细</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
