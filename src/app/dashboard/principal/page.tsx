"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from "recharts";
import {
  Users,
  Calendar,
  DollarSign,
  UserPlus,
  Building,
  AlertTriangle,
  Phone,
  ChevronRight,
  Loader2,
  TrendingUp,
  UserCheck,
  LayoutGrid,
} from "lucide-react";

interface Campus {
  id: string;
  name: string;
  status: string;
}

interface DashboardData {
  overview: {
    totalStudents: number;
    todayLessons: number;
    monthRevenue: number;
    monthNewStudents: number;
    totalTeachers: number;
    totalClasses: number;
  };
  campuses: Campus[];
  selectedCampus: string | null;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    newStudents: number;
  }>;
  funnelData: Array<{
    name: string;
    value: number;
  }>;
  campusComparison: Array<{
    name: string;
    students: number;
    revenue: number;
    teachers: number;
  }>;
  todos: {
    renewalAlert: {
      count: number;
      items: Array<{
        studentId: string;
        studentName: string;
        parentPhone: string | null;
        className: string;
        remainingHours: number;
      }>;
    };
    pendingFollowUp: {
      count: number;
      items: Array<{
        id: string;
        name: string;
        phone: string;
        childName: string | null;
        status: string;
        campusName: string | null;
        nextFollowUp: string | null;
      }>;
    };
  };
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function PrincipalDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "merchant") {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    if (data) {
      fetchDashboardData(selectedCampus === "all" ? undefined : selectedCampus);
    }
  }, [selectedCampus]);

  const fetchDashboardData = async (campusId?: string) => {
    try {
      const token = localStorage.getItem("token");
      const url = campusId
        ? `/api/principal/dashboard?campusId=${campusId}`
        : "/api/principal/dashboard";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("获取数据失败");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      new: { label: "新客户", variant: "secondary" },
      contacted: { label: "已联系", variant: "outline" },
      invited: { label: "已邀约", variant: "outline" },
      trial: { label: "已试听", variant: "default" },
      signed: { label: "已签约", variant: "default" },
      lost: { label: "已流失", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchDashboardData()}>重试</Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 - 校区切换器 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">校长工作台</h1>
          <p className="text-muted-foreground">
            {selectedCampus === "all" ? "全部校区概览" : data.campuses.find(c => c.id === selectedCampus)?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
            <SelectTrigger className="w-[200px] text-gray-900">
              <SelectValue placeholder="选择校区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部校区</SelectItem>
              {data.campuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 全局数据概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总学员数</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.overview.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">在册学员</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日课程</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.overview.todayLessons}</div>
            <p className="text-xs text-muted-foreground mt-1">节</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月业绩</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.overview.monthRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">充值金额</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">本月新增</CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{data.overview.monthNewStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">新学员</p>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">管理功能</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/crm")}
            >
              <Users className="w-6 h-6" />
              <span className="text-xs">招生CRM</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/trial-classes")}
            >
              <Calendar className="w-6 h-6" />
              <span className="text-xs">试听管理</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/teachers")}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-xs">教师绩效</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/schedule")}
            >
              <LayoutGrid className="w-6 h-6" />
              <span className="text-xs">智能排课</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/consumption")}
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-xs">课消统计</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/attendance")}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-xs">考勤总览</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/referral")}
            >
              <UserPlus className="w-6 h-6" />
              <span className="text-xs">转介绍激励</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-1"
              onClick={() => router.push("/dashboard/principal/wechat")}
            >
              <Phone className="w-6 h-6" />
              <span className="text-xs">微信订阅</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 业绩趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>本月业绩趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "业绩" : "新增学员",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="newStudents"
                  name="newStudents"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 转化漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle>客户转化漏斗</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <FunnelChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Funnel
                  dataKey="value"
                  data={data.funnelData}
                  isAnimationActive
                >
                  <LabelList
                    position="right"
                    fill="hsl(var(--foreground))"
                    stroke="none"
                    dataKey="name"
                  />
                  {data.funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 校区对比（全部校区时显示） */}
      {selectedCampus === "all" && data.campusComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>校区对比</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.campusComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "业绩" : name === "students" ? "学员数" : "老师数",
                  ]}
                />
                <Bar dataKey="students" name="students" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" name="revenue" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 待办事项 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 续费预警 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              续费预警
            </CardTitle>
            {data.todos.renewalAlert.count > 0 && (
              <Badge variant="destructive">{data.todos.renewalAlert.count}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.todos.renewalAlert.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无续费预警
              </div>
            ) : (
              <div className="space-y-3">
                {data.todos.renewalAlert.items.map((item) => (
                  <div
                    key={`${item.studentId}-${item.className}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/education/students?id=${item.studentId}`)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{item.studentName}</div>
                      <div className="text-sm text-muted-foreground">{item.className}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        剩余 {item.remainingHours} 课时
                      </Badge>
                      {item.parentPhone && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {item.parentPhone}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 待跟进客户 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-500" />
              待跟进客户
            </CardTitle>
            {data.todos.pendingFollowUp.count > 0 && (
              <Badge variant="secondary">{data.todos.pendingFollowUp.count}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.todos.pendingFollowUp.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无待跟进客户
              </div>
            ) : (
              <div className="space-y-3">
                {data.todos.pendingFollowUp.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/customers?id=${item.id}`)}
                  >
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.childName && `孩子：${item.childName}`}
                        {item.campusName && ` · ${item.campusName}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
