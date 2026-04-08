"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  AlertCircle,
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

interface PerformanceData {
  overview: {
    totalStudents: number;
    newStudents: number;
    revenue: number;
    conversionRate: number;
    renewalRate: number;
  };
  comparison: {
    studentGrowth: number;
    revenueGrowth: number;
    lastMonthRevenue: number;
    lastMonthStudents: number;
  };
  trends: {
    revenue: Array<{ month: string; revenue: number }>;
    students: Array<{ month: string; count: number }>;
  };
  funnel: Array<{ name: string; value: number }>;
  campusComparison: Array<{ name: string; students: number; revenue: number }>;
}

interface Insight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  suggestion?: string;
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function PerformancePage() {
  const router = useRouter();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [campusId, setCampusId] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router, campusId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (campusId) params.append("campusId", campusId);

      const [perfRes, insightsRes] = await Promise.all([
        fetch(`/api/principal/performance?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/principal/performance/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const perfData = await perfRes.json();
      const insightsData = await insightsRes.json();

      if (perfData.success) setData(perfData.data);
      if (insightsData.success) setInsights(insightsData.data.insights);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString()}`;
  };

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600";
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "danger":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "danger":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          暂无数据
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">业绩看板</h1>
          <p className="text-muted-foreground">全面掌握机构运营数据</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={campusId} onValueChange={setCampusId}>
            <SelectTrigger className="w-[150px] text-gray-900">
              <SelectValue placeholder="全部校区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部校区</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              <span>总学员</span>
            </div>
            <div className="text-2xl font-bold mt-2">{data.overview.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              <span>本月新增</span>
            </div>
            <div className="text-2xl font-bold mt-2">{data.overview.newStudents}</div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.comparison.studentGrowth)}`}>
              {getGrowthIcon(data.comparison.studentGrowth)}
              <span>{Math.abs(data.comparison.studentGrowth)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="w-4 h-4" />
              <span>本月业绩</span>
            </div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(data.overview.revenue)}</div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(data.comparison.revenueGrowth)}`}>
              {getGrowthIcon(data.comparison.revenueGrowth)}
              <span>{Math.abs(data.comparison.revenueGrowth)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="w-4 h-4" />
              <span>转化率</span>
            </div>
            <div className="text-2xl font-bold mt-2">{data.overview.conversionRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>续费率</span>
            </div>
            <div className="text-2xl font-bold mt-2">{data.overview.renewalRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 业绩趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">业绩趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 新增学员趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新增学员趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trends.students}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 转化漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">转化漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={data.funnel} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
                    {data.funnel.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 校区对比 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">校区对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.campusComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#3b82f6" name="学员数" />
                  <Bar dataKey="revenue" fill="#22c55e" name="业绩" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 智能洞察 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">智能洞察</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightBg(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{insight.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {insight.description}
                      </div>
                      {insight.suggestion && (
                        <div className="text-sm mt-2 p-2 bg-white/50 rounded">
                          💡 {insight.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                暂无洞察数据
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm">续费预警学员</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-sm">待跟进客户</span>
        </Button>
        <Button variant="outline" className="h-16 flex flex-col gap-1">
          <Download className="w-5 h-5 text-green-500" />
          <span className="text-sm">导出报表</span>
        </Button>
      </div>
    </div>
  );
}
