"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Download,
} from "lucide-react";

interface ConsumptionStats {
  summary: {
    totalDeductions: number;
    totalHours: number;
    totalRechargeHours: number;
    totalRechargeAmount: number;
    avgHoursPerDeduction: number;
  };
  byClass: Array<{ name: string; hours: number; count: number }>;
  daily: Array<{ date: string; hours: number; count: number }>;
  monthly: Array<{ month: string; hours: number; count: number }>;
}

export default function PrincipalConsumptionPage() {
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      let startDate = "";
      let endDate = now.toISOString().split("T")[0];

      if (period === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split("T")[0];
      } else if (period === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split("T")[0];
      } else if (period === "quarter") {
        const quarterAgo = new Date(now);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        startDate = quarterAgo.toISOString().split("T")[0];
      } else if (period === "year") {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split("T")[0];
      }

      const response = await fetch(
        `/api/principal/consumption/stats?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("获取课消统计失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  // 计算趋势（简单比较）
  const monthlyData = stats.monthly.slice(-2);
  const trend = monthlyData.length === 2 
    ? monthlyData[1].hours > monthlyData[0].hours ? "up" : "down"
    : "stable";

  return (
    <div className="space-y-6">
      {/* 页面标题和筛选 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课消统计</h1>
          <p className="text-muted-foreground">查看课时消耗和充值情况</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">近一周</SelectItem>
              <SelectItem value="month">近一月</SelectItem>
              <SelectItem value="quarter">近三月</SelectItem>
              <SelectItem value="year">近一年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总消课次数
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalDeductions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              平均每次 {stats.summary.avgHoursPerDeduction} 课时
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总消课课时
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalHours}</div>
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {trend === "up" ? "环比上升" : "环比下降"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              充值课时
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.totalRechargeHours}</div>
            <p className="text-xs text-muted-foreground mt-1">
              本周期内充值
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              充值金额
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ¥{stats.summary.totalRechargeAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              本周期充值总额
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月度趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">月度趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-2">
              {stats.monthly.slice(-12).map((item, index) => {
                const maxHours = Math.max(...stats.monthly.map(m => m.hours), 1);
                const height = (item.hours / maxHours) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <span className="text-xs text-muted-foreground truncate w-full text-center">
                      {item.month.split("-")[1]}月
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 班级排名 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">班级课消排名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {stats.byClass.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">{item.hours} 课时</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${(item.hours / (stats.byClass[0]?.hours || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 每日明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">每日消课明细</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">日期</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">消课次数</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">消课课时</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily.slice(-14).reverse().map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">{item.date}</td>
                    <td className="text-right py-2">{item.count}</td>
                    <td className="text-right py-2">{item.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
