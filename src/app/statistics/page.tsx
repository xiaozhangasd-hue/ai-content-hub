"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  BookOpen,
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Statistics {
  overview: {
    totalStudents: number;
    totalClasses: number;
    totalAttendance: number;
    attendanceRate: number;
    averagePerformance: number;
  };
  trends: {
    students: Array<{ month: string; count: number }>;
    attendance: Array<{ week: string; rate: number; present: number; total: number }>;
  };
  distribution: {
    subjects: Array<{ name: string; value: number }>;
    attendance: Array<{ name: string; value: number }>;
  };
  students: Array<{
    id: string;
    name: string;
    avatar: string | null;
    remainingHours: number;
    attendanceRate: number;
    averageRating: number;
    lastAttendance: string | null;
  }>;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [selectedClass, setSelectedClass] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchStatistics();
  }, [router, dateRange, selectedClass]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedClass) {
        params.append("classId", selectedClass);
      }

      const response = await fetch(`/api/teacher/statistics?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: 实现导出功能
    alert("导出功能开发中...");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">暂无数据</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">数据统计</h1>
          <p className="text-muted-foreground">全面了解教学数据，优化教学质量</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] text-gray-900">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">最近7天</SelectItem>
              <SelectItem value="30">最近30天</SelectItem>
              <SelectItem value="90">最近3个月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
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
              <span>学员总数</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.overview.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BookOpen className="w-4 h-4" />
              <span>授课班级</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.overview.totalClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              <span>本周出勤</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.overview.totalAttendance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>出勤率</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.overview.attendanceRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Star className="w-4 h-4" />
              <span>平均评分</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.overview.averagePerformance}/5</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 学生增长趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">学员增长趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {stats.trends.students.length > 0 ? (
                <div className="flex items-end justify-between h-full gap-2">
                  {stats.trends.students.map((item, idx) => {
                    const maxCount = Math.max(...stats.trends.students.map((s) => s.count), 1);
                    const height = (item.count / maxCount) * 150;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                        <div className="text-sm font-medium">{item.count}</div>
                        <div
                          className="w-full bg-primary rounded-t"
                          style={{ height: `${Math.max(height, 4)}px` }}
                        />
                        <div className="text-xs text-muted-foreground truncate w-full text-center">
                          {item.month.split("-")[1]}月
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 出勤率趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">出勤率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {stats.trends.attendance.length > 0 ? (
                <div className="space-y-4">
                  {stats.trends.attendance.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-16 text-sm text-muted-foreground">{item.week}</div>
                      <div className="flex-1">
                        <Progress value={item.rate} className="h-3" />
                      </div>
                      <div className="w-16 text-sm font-medium text-right">{item.rate}%</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 科目分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">学员科目分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {stats.distribution.subjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.distribution.subjects.map((item, idx) => {
                    const total = stats.distribution.subjects.reduce((sum, s) => sum + s.value, 0);
                    const percentage = Math.round((item.value / total) * 100);
                    const colors = [
                      "bg-pink-500",
                      "bg-purple-500",
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-yellow-500",
                    ];
                    return (
                      <div key={idx} className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded ${colors[idx % colors.length]}`} />
                        <div className="flex-1 text-sm">{item.name}</div>
                        <div className="text-sm font-medium">{item.value}人</div>
                        <div className="text-sm text-muted-foreground">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 考勤状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">考勤状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {stats.distribution.attendance.length > 0 ? (
                <div className="grid grid-cols-3 gap-4 h-full">
                  {stats.distribution.attendance.map((item, idx) => {
                    const total = stats.distribution.attendance.reduce(
                      (sum, s) => sum + s.value,
                      0
                    );
                    const percentage = Math.round((item.value / total) * 100);
                    const colors: Record<string, string> = {
                      出勤: "text-green-600",
                      缺勤: "text-red-600",
                      请假: "text-yellow-600",
                    };
                    return (
                      <div key={idx} className="flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-gray-900">{item.value}</div>
                        <div className={`text-sm mt-1 ${colors[item.name] || ""}`}>
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 学员分析列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">学员分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left p-2">学员</th>
                  <th className="text-center p-2">剩余课时</th>
                  <th className="text-center p-2">出勤率</th>
                  <th className="text-center p-2">平均评分</th>
                  <th className="text-center p-2">最近出勤</th>
                  <th className="text-center p-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {stats.students.map((student) => {
                  const status = student.remainingHours < 5
                    ? { label: "课时不足", variant: "destructive" as const }
                    : student.attendanceRate < 70
                    ? { label: "出勤待提升", variant: "secondary" as const }
                    : { label: "正常", variant: "default" as const };

                  return (
                    <tr key={student.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={student.avatar || undefined} />
                            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <span className={student.remainingHours < 5 ? "text-red-600 font-medium" : ""}>
                          {student.remainingHours}
                        </span>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={student.attendanceRate} className="w-16 h-2" />
                          <span className="text-sm">{student.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{student.averageRating}</span>
                        </div>
                      </td>
                      <td className="text-center p-2 text-sm text-muted-foreground">
                        {student.lastAttendance
                          ? new Date(student.lastAttendance).toLocaleDateString("zh-CN")
                          : "-"}
                      </td>
                      <td className="text-center p-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
