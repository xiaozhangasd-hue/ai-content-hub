"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampusSelector } from "@/components/campus-selector";
import {
  ChevronLeft,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Share2,
  UserPlus,
  Award,
  Zap,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  childName?: string;
  status: string;
  level: string;
  source?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt: string;
  _count?: { followUps: number };
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  invited: number;
  trial: number;
  signed: number;
  lost: number;
  hot: number;
  warm: number;
  cold: number;
  todayFollowUp: Customer[];
  overdueFollowUp: Customer[];
  weeklyStats: { date: string; count: number }[];
  sourceStats: { source: string; count: number; signed: number; rate: number }[];
  conversionRate: number;
  funnelData: { stage: string; count: number; rate: number; dropOff: number }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    contacted: 0,
    invited: 0,
    trial: 0,
    signed: 0,
    lost: 0,
    hot: 0,
    warm: 0,
    cold: 0,
    todayFollowUp: [],
    overdueFollowUp: [],
    weeklyStats: [],
    sourceStats: [],
    conversionRate: 0,
    funnelData: [],
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("week");
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedCampus]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    try {
      const campusParam = selectedCampus !== "all" ? `&campusId=${selectedCampus}` : "";
      const response = await fetch(`/api/customers?${campusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers);
        calculateStats(data.customers);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (customerList: Customer[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 根据时间范围筛选
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filteredCustomers = customerList.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= startDate;
    });

    // 今日跟进和超期
    const todayFollowUp = customerList.filter((c) => {
      if (!c.nextFollowUp) return false;
      const nextDate = new Date(c.nextFollowUp);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate.getTime() === today.getTime();
    });

    const overdueFollowUp = customerList.filter((c) => {
      if (!c.nextFollowUp) return false;
      const nextDate = new Date(c.nextFollowUp);
      nextDate.setHours(0, 0, 0, 0);
      return nextDate < today && c.status !== "signed" && c.status !== "lost";
    });

    // 周统计
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = customerList.filter((c) => {
        const created = new Date(c.createdAt);
        return created >= date && created < nextDate;
      }).length;

      weeklyStats.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // 来源统计（含转化率）
    const sourceMap: Record<string, { total: number; signed: number }> = {};
    customerList.forEach((c) => {
      const source = c.source || "其他";
      if (!sourceMap[source]) {
        sourceMap[source] = { total: 0, signed: 0 };
      }
      sourceMap[source].total++;
      if (c.status === "signed") {
        sourceMap[source].signed++;
      }
    });
    const sourceStats = Object.entries(sourceMap)
      .map(([source, data]) => ({
        source,
        count: data.total,
        signed: data.signed,
        rate: data.total > 0 ? Math.round((data.signed / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // 转化漏斗
    const stages = [
      { stage: "新咨询", count: filteredCustomers.filter((c) => c.status === "new").length },
      { stage: "已联系", count: filteredCustomers.filter((c) => c.status === "contacted").length },
      { stage: "已邀约", count: filteredCustomers.filter((c) => c.status === "invited").length },
      { stage: "已体验", count: filteredCustomers.filter((c) => c.status === "trial").length },
      { stage: "已签约", count: filteredCustomers.filter((c) => c.status === "signed").length },
    ];

    const funnelData = stages.map((item, index) => {
      const prevCount = index > 0 ? stages[index - 1].count : item.count;
      const rate = filteredCustomers.length > 0 
        ? Math.round((item.count / filteredCustomers.length) * 100) 
        : 0;
      const dropOff = index > 0 && prevCount > 0 
        ? Math.round(((prevCount - item.count) / prevCount) * 100) 
        : 0;

      return {
        stage: item.stage,
        count: item.count,
        rate,
        dropOff,
      };
    });

    setStats({
      total: customerList.length,
      new: filteredCustomers.filter((c) => c.status === "new").length,
      contacted: filteredCustomers.filter((c) => c.status === "contacted").length,
      invited: filteredCustomers.filter((c) => c.status === "invited").length,
      trial: filteredCustomers.filter((c) => c.status === "trial").length,
      signed: filteredCustomers.filter((c) => c.status === "signed").length,
      lost: filteredCustomers.filter((c) => c.status === "lost").length,
      hot: customerList.filter((c) => c.level === "hot").length,
      warm: customerList.filter((c) => c.level === "warm").length,
      cold: customerList.filter((c) => c.level === "cold").length,
      todayFollowUp,
      overdueFollowUp,
      weeklyStats,
      sourceStats,
      conversionRate: filteredCustomers.length > 0
        ? Math.round((filteredCustomers.filter((c) => c.status === "signed").length / filteredCustomers.length) * 100)
        : 0,
      funnelData,
    });
  };

  const maxWeeklyCount = Math.max(...stats.weeklyStats.map((s) => s.count), 1);
  const maxSourceCount = Math.max(...stats.sourceStats.map((s) => s.count), 1);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-green-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-white">数据看板</span>
            </div>
            <div className="flex items-center gap-2">
              <CampusSelector value={selectedCampus} onChange={setSelectedCampus} />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm"
              >
                <option value="week">近7天</option>
                <option value="month">近30天</option>
                <option value="quarter">近90天</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchData} className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* 核心指标 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer" onClick={() => router.push("/customers")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-gray-500">总家长</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-500">高意向</span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">{stats.hot}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-500">已邀约</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{stats.invited}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-gray-500">已体验</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{stats.trial}</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-500">已签约</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{stats.signed}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-300">转化率</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">{stats.conversionRate}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 转化漏斗 */}
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    转化漏斗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.funnelData.map((stage, index) => {
                      const colors = ["from-blue-500 to-blue-400", "from-yellow-500 to-yellow-400", "from-purple-500 to-purple-400", "from-orange-500 to-orange-400", "from-green-500 to-green-400"];
                      const color = colors[index];
                      const width = stats.total > 0 ? Math.max(15, (stage.count / stats.total) * 100) : 15;

                      return (
                        <div key={stage.stage} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{stage.stage}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">{stage.count}</span>
                              <span className="text-gray-500">{stage.rate}%</span>
                              {index > 0 && stage.dropOff > 0 && (
                                <span className="text-red-400 text-xs">流失{stage.dropOff}%</span>
                              )}
                            </div>
                          </div>
                          <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${color} transition-all duration-500`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 转化提示 */}
                  <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2 text-sm">
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                      <span className="text-green-300">
                        整体转化率 <strong>{stats.conversionRate}%</strong>
                      </span>
                      {stats.conversionRate < 20 && (
                        <span className="text-gray-400 ml-2">建议优化邀约环节</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 渠道效果对比 */}
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Share2 className="w-5 h-5 text-blue-400" />
                    渠道效果对比
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.sourceStats.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">暂无数据</div>
                  ) : (
                    <div className="space-y-3">
                      {stats.sourceStats.slice(0, 6).map((source, index) => {
                        const colors = ["from-blue-500 to-cyan-500", "from-purple-500 to-pink-500", "from-green-500 to-emerald-500", "from-orange-500 to-amber-500", "from-rose-500 to-red-500", "from-indigo-500 to-violet-500"];
                        const color = colors[index % colors.length];
                        const width = (source.count / maxSourceCount) * 100;

                        return (
                          <div key={source.source} className="p-3 bg-white/5 rounded-lg hover:bg-white/[0.07] transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300 text-sm">{source.source}</span>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-gray-400">{source.count}人</span>
                                <span className="text-green-400">{source.signed}签约</span>
                                <span className={`font-medium ${source.rate >= 30 ? 'text-green-400' : source.rate >= 15 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                  {source.rate}%
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${color} rounded-full`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 渠道建议 */}
                  {stats.sourceStats.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300">
                          最佳渠道：<strong>{stats.sourceStats[0]?.source}</strong>（{stats.sourceStats[0]?.rate}%转化）
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 趋势图表 */}
            <Card className="mb-6 bg-white/[0.03] backdrop-blur-sm border-white/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  新增客户趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-48">
                  {stats.weeklyStats.map((day, index) => {
                    const height = maxWeeklyCount > 0 ? (day.count / maxWeeklyCount) * 100 : 0;
                    const isToday = index === stats.weeklyStats.length - 1;

                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex flex-col items-center justify-end h-36 relative">
                          {day.count > 0 && (
                            <div className="absolute -top-6 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              {day.count}
                            </div>
                          )}
                          <div
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                              isToday 
                                ? "bg-gradient-to-t from-green-600 to-green-400" 
                                : "bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300"
                            }`}
                            style={{ height: `${Math.max(height, 3)}%` }}
                          />
                        </div>
                        <div className={`text-xs mt-2 ${isToday ? "text-green-400 font-medium" : "text-gray-500"}`}>
                          {day.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 统计摘要 */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="text-sm">
                      <span className="text-gray-500">本周新增</span>
                      <span className="text-white font-medium ml-2">
                        {stats.weeklyStats.reduce((sum, d) => sum + d.count, 0)}人
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">日均</span>
                      <span className="text-white font-medium ml-2">
                        {(stats.weeklyStats.reduce((sum, d) => sum + d.count, 0) / 7).toFixed(1)}人
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push("/customers")} className="bg-white/5 border-white/10 text-gray-300">
                    查看详情
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 待跟进提醒 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-amber-400" />
                    今日待跟进
                    {stats.todayFollowUp.length > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-0">{stats.todayFollowUp.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.todayFollowUp.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-2" />
                      今日跟进任务已完成
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.todayFollowUp.slice(0, 5).map((customer) => (
                        <div
                          key={customer.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/[0.07] cursor-pointer transition-all"
                          onClick={() => router.push("/follow-up")}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm">
                              {customer.name[0]}
                            </div>
                            <div>
                              <div className="font-medium text-white">{customer.name}</div>
                              <div className="text-xs text-gray-500">{customer.phone}</div>
                            </div>
                          </div>
                          <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">待跟进</Badge>
                        </div>
                      ))}
                      {stats.todayFollowUp.length > 5 && (
                        <Button
                          variant="link"
                          className="w-full text-sm text-gray-400 hover:text-white"
                          onClick={() => router.push("/follow-up")}
                        >
                          查看全部 {stats.todayFollowUp.length} 位家长
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    超期未跟进
                    {stats.overdueFollowUp.length > 0 && (
                      <Badge className="bg-red-500/20 text-red-300 border-0">{stats.overdueFollowUp.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.overdueFollowUp.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 text-green-500/50 mx-auto mb-2" />
                      无超期客户
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stats.overdueFollowUp.slice(0, 5).map((customer) => {
                        const overdueDays = Math.floor(
                          (new Date().getTime() - new Date(customer.nextFollowUp!).getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                          <div
                            key={customer.id}
                            className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 cursor-pointer transition-all border border-red-500/20"
                            onClick={() => router.push("/follow-up")}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white text-sm">
                                {customer.name[0]}
                              </div>
                              <div>
                                <div className="font-medium text-white">{customer.name}</div>
                                <div className="text-xs text-red-400">超期 {overdueDays} 天</div>
                              </div>
                            </div>
                            <Badge className="bg-red-500/20 text-red-300 border-0 text-xs">紧急</Badge>
                          </div>
                        );
                      })}
                      {stats.overdueFollowUp.length > 5 && (
                        <Button
                          variant="link"
                          className="w-full text-sm text-gray-400 hover:text-white"
                          onClick={() => router.push("/follow-up")}
                        >
                          查看全部 {stats.overdueFollowUp.length} 位家长
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
