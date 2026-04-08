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
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";

interface AttendanceStats {
  summary: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
    earlyLeave: number;
    attendanceRate: number;
    pendingLeaveRequests: number;
  };
  byClass: Array<{
    classId: string;
    className: string;
    total: number;
    present: number;
    rate: number;
  }>;
  daily: Array<{
    date: string;
    total: number;
    present: number;
    rate: number;
  }>;
  abnormalAttendances: Array<{
    studentId: string;
    studentName: string;
    absentCount: number;
  }>;
}

export default function PrincipalAttendancePage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
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
      }

      const response = await fetch(
        `/api/principal/attendance/stats?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("获取考勤统计失败:", error);
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

  const getRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-500";
    if (rate >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和筛选 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">考勤总览</h1>
          <p className="text-muted-foreground">查看全校考勤情况</p>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总考勤
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              出勤率
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRateColor(stats.summary.attendanceRate)}`}>
              {stats.summary.attendanceRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              正常出勤
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.summary.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              缺勤
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.summary.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              请假
            </CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.summary.leave}</div>
          </CardContent>
        </Card>
      </div>

      {/* 待处理提醒 */}
      {stats.summary.pendingLeaveRequests > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium">有待处理的请假申请</p>
              <p className="text-sm text-muted-foreground">
                {stats.summary.pendingLeaveRequests} 条请假申请等待审批
              </p>
            </div>
            <Button variant="outline">去处理</Button>
          </CardContent>
        </Card>
      )}

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 班级出勤率排名 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">班级出勤率排名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {stats.byClass.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.className}</span>
                      <span className={getRateColor(item.rate)}>{item.rate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full mt-1">
                      <div
                        className={`h-full rounded-full ${
                          item.rate >= 90 ? "bg-green-500" :
                          item.rate >= 70 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${item.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 异常考勤预警 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              异常考勤预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.abnormalAttendances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>暂无异常考勤</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.abnormalAttendances.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.studentName}</p>
                      <p className="text-sm text-muted-foreground">缺勤次数过多</p>
                    </div>
                    <Badge variant="destructive">{item.absentCount}次缺勤</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 每日出勤趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">每日出勤趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end gap-1">
            {stats.daily.slice(-30).map((item, index) => {
              const height = item.total > 0 ? (item.rate / 100) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${
                      item.rate >= 90 ? "bg-green-500" :
                      item.rate >= 70 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${item.date}: ${item.rate}%`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>30天前</span>
            <span>今天</span>
          </div>
        </CardContent>
      </Card>

      {/* 考勤状态明细 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">考勤状态分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-500">{stats.summary.present}</p>
              <p className="text-sm text-muted-foreground">正常出勤</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-red-500">{stats.summary.absent}</p>
              <p className="text-sm text-muted-foreground">缺勤</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-500">{stats.summary.leave}</p>
              <p className="text-sm text-muted-foreground">请假</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{stats.summary.late}</p>
              <p className="text-sm text-muted-foreground">迟到</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-500">{stats.summary.earlyLeave}</p>
              <p className="text-sm text-muted-foreground">早退</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
