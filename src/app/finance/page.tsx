"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
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
  Legend,
} from "recharts";

interface FinanceData {
  income: number;
  expense: number;
  profit: number;
  lastMonth: {
    income: number;
    expense: number;
    profit: number;
  };
  growth: {
    income: number;
    expense: number;
    profit: number;
  };
}

interface TrendData {
  income: Array<{ month: string; value: number }>;
  expense: Array<{ month: string; value: number }>;
  profit: Array<{ month: string; value: number }>;
}

export default function FinancePage() {
  const router = useRouter();
  const [overview, setOverview] = useState<FinanceData | null>(null);
  const [trend, setTrend] = useState<TrendData | null>(null);
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

      const [overviewRes, trendRes] = await Promise.all([
        fetch(`/api/principal/finance/overview?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/principal/finance/trend?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const overviewData = await overviewRes.json();
      const trendData = await trendRes.json();

      if (overviewData.success) setOverview(overviewData.data);
      if (trendData.success) setTrend(trendData.data);
    } catch (error) {
      console.error("获取财务数据失败:", error);
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">财务管理</h1>
          <p className="text-muted-foreground">查看机构财务数据</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={campusId} onValueChange={setCampusId}>
            <SelectTrigger className="w-[150px]">
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

      {/* 财务概览 */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">本月收入</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(overview.income)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(overview.growth.income)}`}>
                    {getGrowthIcon(overview.growth.income)}
                    <span>{Math.abs(overview.growth.income)}% vs 上月</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">本月支出</div>
                  <div className="text-3xl font-bold text-red-600">
                    {formatCurrency(overview.expense)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(-overview.growth.expense)}`}>
                    {getGrowthIcon(-overview.growth.expense)}
                    <span>{Math.abs(overview.growth.expense)}% vs 上月</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">本月净利润</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(overview.profit)}
                  </div>
                  <div className={`flex items-center gap-1 text-sm mt-1 ${getGrowthColor(overview.growth.profit)}`}>
                    {getGrowthIcon(overview.growth.profit)}
                    <span>{Math.abs(overview.growth.profit)}% vs 上月</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 趋势图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">收支趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {trend && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend.income.map((item, idx) => ({
                    month: item.month,
                    收入: trend.income[idx].value,
                    支出: trend.expense[idx].value,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="收入" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="支出" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">利润趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {trend && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend.profit}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#3b82f6" name="利润" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
