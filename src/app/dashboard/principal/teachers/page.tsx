"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle,
} from "lucide-react";
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
} from "recharts";

interface TeacherPerformance {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  totalCourses: number;
  totalHours: number;
  totalSalary: number;
  avgRating: number;
  reviewCount: number;
}

interface SalaryRecord {
  id: string;
  teacher: { id: string; name: string };
  course: { id: string; name: string };
  date: string;
  duration: number;
  salary: number;
  status: string;
}

interface TrendsData {
  trends: Array<{
    label: string;
    totalCourses: number;
    totalHours: number;
    totalSalary: number;
  }>;
  overallStats: {
    totalCourses: number;
    totalHours: number;
    totalSalary: number;
    avgCoursesPerDay: number;
    avgHoursPerDay: number;
  };
  teachers: Array<{ id: string; name: string }>;
  period: string;
}

export default function TeachersPerformancePage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherPerformance[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salarySummary, setSalarySummary] = useState<Array<{
    teacher: { id: string; name: string };
    totalCourses: number;
    totalSalary: number;
    paidSalary: number;
    unpaidSalary: number;
  }>>([]);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("month");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTeachers();
    fetchTrends();
  }, [router, page, search, period]);

  useEffect(() => {
    fetchSalaryData();
  }, [salaryMonth, selectedTeacher]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("period", period);
      if (search) params.append("search", search);

      const response = await fetch(`/api/principal/teachers/performance?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取教师绩效失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("month", salaryMonth);
      if (selectedTeacher) params.append("teacherId", selectedTeacher);

      const response = await fetch(`/api/principal/teachers/salary?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setSalaryRecords(data.data.records);
        setSalarySummary(data.data.summary);
      }
    } catch (error) {
      console.error("获取课酬数据失败:", error);
    }
  };

  const fetchTrends = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/teachers/trends?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTrendsData(data.data);
      }
    } catch (error) {
      console.error("获取趋势数据失败:", error);
    }
  };

  const handlePaySalary = async () => {
    if (selectedRecords.length === 0) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/teachers/salary", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordIds: selectedRecords }),
      });
      const data = await response.json();
      if (data.success) {
        setSelectedRecords([]);
        setIsSalaryDialogOpen(false);
        fetchSalaryData();
      }
    } catch (error) {
      console.error("标记发放失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">教师绩效</h1>
          <p className="text-muted-foreground">查看教师绩效统计与课酬管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px] text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { fetchTeachers(); fetchTrends(); }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      {trendsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="w-4 h-4" />
                <span>教师数</span>
              </div>
              <div className="text-2xl font-bold mt-2">{trendsData.teachers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="w-4 h-4" />
                <span>总课时</span>
              </div>
              <div className="text-2xl font-bold mt-2">{trendsData.overallStats.totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>总时长</span>
              </div>
              <div className="text-2xl font-bold mt-2">{trendsData.overallStats.totalHours}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign className="w-4 h-4" />
                <span>总课酬</span>
              </div>
              <div className="text-2xl font-bold mt-2">¥{trendsData.overallStats.totalSalary.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>日均课时</span>
              </div>
              <div className="text-2xl font-bold mt-2">{trendsData.overallStats.avgCoursesPerDay}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 图表 */}
      {trendsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">课时趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalCourses" stroke="#3b82f6" name="课时数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">课酬趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `¥${value}`} />
                    <Bar dataKey="totalSalary" fill="#22c55e" name="课酬" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 教师绩效列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">教师绩效排名</CardTitle>
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索教师..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教师</TableHead>
                <TableHead className="text-center">课时数</TableHead>
                <TableHead className="text-center">时长</TableHead>
                <TableHead className="text-center">课酬</TableHead>
                <TableHead className="text-center">评分</TableHead>
                <TableHead className="text-center">评价数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无教师数据
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {teacher.avatar ? (
                            <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="text-sm">{teacher.name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-xs text-muted-foreground">{teacher.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{teacher.totalCourses}</TableCell>
                    <TableCell className="text-center">{teacher.totalHours}h</TableCell>
                    <TableCell className="text-center">¥{teacher.totalSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>{teacher.avgRating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{teacher.reviewCount}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 课酬管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">课酬管理</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              className="w-[150px]"
            />
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-[150px] text-gray-900">
                <SelectValue placeholder="全部教师" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部教师</SelectItem>
                {trendsData?.teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setIsSalaryDialogOpen(true)}>
              <DollarSign className="w-4 h-4 mr-1" />
              发放课酬
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教师</TableHead>
                <TableHead className="text-center">课时数</TableHead>
                <TableHead className="text-center">总课酬</TableHead>
                <TableHead className="text-center">已发放</TableHead>
                <TableHead className="text-center">待发放</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salarySummary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无课酬数据
                  </TableCell>
                </TableRow>
              ) : (
                salarySummary.map((summary) => (
                  <TableRow key={summary.teacher.id}>
                    <TableCell className="font-medium">{summary.teacher.name}</TableCell>
                    <TableCell className="text-center">{summary.totalCourses}</TableCell>
                    <TableCell className="text-center">¥{summary.totalSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-center text-green-600">
                      ¥{summary.paidSalary.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-orange-600">
                      ¥{summary.unpaidSalary.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 发放课酬对话框 */}
      <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发放课酬</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-[300px] overflow-y-auto">
              {salaryRecords
                .filter((r) => r.status !== "paid")
                .map((record) => (
                  <div
                    key={record.id}
                    className={`p-3 rounded border mb-2 cursor-pointer ${
                      selectedRecords.includes(record.id) ? "bg-muted border-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedRecords((prev) =>
                        prev.includes(record.id)
                          ? prev.filter((id) => id !== record.id)
                          : [...prev, record.id]
                      );
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{record.teacher.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.course.name} - {new Date(record.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">¥{record.salary}</div>
                        <div className="text-xs text-muted-foreground">{record.duration}h</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded">
              <span>已选择 {selectedRecords.length} 条记录</span>
              <span className="font-bold">
                ¥{salaryRecords
                  .filter((r) => selectedRecords.includes(r.id))
                  .reduce((sum, r) => sum + r.salary, 0)
                  .toLocaleString()}
              </span>
            </div>
            <Button
              onClick={handlePaySalary}
              className="w-full"
              disabled={selectedRecords.length === 0}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              标记为已发放
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
