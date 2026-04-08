"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Calendar,
  BookOpen,
  Star,
  Image as ImageIcon,
  ChevronLeft,
  Users,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  avatar: string | null;
  gender: string;
  birthDate: string | null;
  parentName: string | null;
  parentPhone: string | null;
  classes: Array<{
    id: string;
    name: string;
    remainingHours: number;
    totalHours: number;
  }>;
  totalRemainingHours: number;
  totalHours: number;
  attendance: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    rate: number;
  };
}

interface StudentProfile {
  basic: {
    id: string;
    name: string;
    avatar: string | null;
    gender: string;
    birthDate: string | null;
    parentName: string | null;
    parentPhone: string | null;
    address: string | null;
    notes: string | null;
    createdAt: string;
  };
  classes: Array<{
    id: string;
    name: string;
    subject: string | null;
    remainingHours: number;
    totalHours: number;
    startDate: string;
  }>;
  hours: {
    total: number;
    remaining: number;
    used: number;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    rate: number;
    recent: Array<{
      id: string;
      date: string;
      className: string;
      status: string;
      notes: string | null;
    }>;
  };
  performance: {
    averageRating: number;
    trend: Array<{
      date: string;
      rating: number;
      className: string;
      comment: string | null;
    }>;
  };
  works: Array<{
    id: string;
    title: string;
    description: string | null;
    mediaUrl: string;
    mediaType: string;
    date: string;
  }>;
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hoursFilter, setHoursFilter] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchStudents();
  }, [router, search, sortBy, sortOrder, hoursFilter, page]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        page: page.toString(),
        pageSize: "20",
      });

      if (hoursFilter) {
        params.append("hoursStatus", hoursFilter);
      }

      const response = await fetch(`/api/teacher/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("获取学员列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDetail = async (studentId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedStudent(data.data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error("获取学员详情失败:", error);
    }
  };

  const getAge = (birthDate: string | null) => {
    if (!birthDate) return "未知";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}岁`;
  };

  const getHoursStatus = (remaining: number) => {
    if (remaining < 5) return { label: "不足", color: "destructive" };
    if (remaining < 10) return { label: "偏低", color: "secondary" };
    return { label: "充足", color: "default" };
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return { label: "优秀", variant: "default" as const };
    if (rate >= 70) return { label: "良好", variant: "secondary" as const };
    return { label: "待提升", variant: "destructive" as const };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <span className="text-green-600">✓</span>;
      case "absent":
        return <span className="text-red-600">✗</span>;
      case "leave":
        return <span className="text-yellow-600">◐</span>;
      default:
        return <span>○</span>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">学员管理</h1>
          <p className="text-muted-foreground">全面了解学员情况，精细化教学服务</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-1" />
          导出学员
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索学员姓名或家长手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={hoursFilter} onValueChange={setHoursFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="课时状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="low">课时不足</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">按姓名</SelectItem>
                <SelectItem value="remainingHours">按剩余课时</SelectItem>
                <SelectItem value="attendanceRate">按出勤率</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 学员列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => {
          const hoursStatus = getHoursStatus(student.totalRemainingHours);
          const attendanceBadge = getAttendanceBadge(student.attendance.rate);

          return (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => fetchStudentDetail(student.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback>
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{student.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {getAge(student.birthDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Phone className="w-3 h-3" />
                      {student.parentPhone || "未填写"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* 班级信息 */}
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <div className="text-sm">
                      {student.classes.map((c) => c.name).join("、") || "未分班"}
                    </div>
                  </div>

                  {/* 课时信息 */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">剩余课时</span>
                      <span className="font-medium">
                        {student.totalRemainingHours}/{student.totalHours}
                      </span>
                    </div>
                    <Progress
                      value={(student.totalRemainingHours / student.totalHours) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-end mt-1">
                      <Badge variant={hoursStatus.color as "default" | "secondary" | "destructive"}>
                        {hoursStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* 出勤信息 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">出勤率</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.attendance.rate}%</span>
                      <Badge variant={attendanceBadge.variant}>
                        {attendanceBadge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 学员详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>学员档案</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedStudent.basic.avatar || undefined} />
                    <AvatarFallback className="text-xl">
                      {selectedStudent.basic.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.basic.name}</h2>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{getAge(selectedStudent.basic.birthDate)}</span>
                      <span>{selectedStudent.basic.gender === "male" ? "男" : "女"}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedStudent.basic.parentPhone}
                      </span>
                      <span>{selectedStudent.basic.parentName}</span>
                    </div>
                  </div>
                </div>

                {/* 课时统计 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">课时信息</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{selectedStudent.hours.total}</div>
                        <div className="text-xs text-muted-foreground">总课时</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStudent.hours.remaining}
                        </div>
                        <div className="text-xs text-muted-foreground">剩余课时</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedStudent.hours.used}
                        </div>
                        <div className="text-xs text-muted-foreground">已消课时</div>
                      </div>
                    </div>
                    <Progress
                      value={(selectedStudent.hours.remaining / selectedStudent.hours.total) * 100}
                      className="h-3 mt-4"
                    />
                  </CardContent>
                </Card>

                {/* 班级信息 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">在读班级</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedStudent.classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span>{cls.name}</span>
                          </div>
                          <div className="text-sm">
                            剩余 <span className="font-medium">{cls.remainingHours}</span> 课时
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 考勤统计 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">考勤统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{selectedStudent.attendance.total}</div>
                        <div className="text-xs text-muted-foreground">总课时</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {selectedStudent.attendance.present}
                        </div>
                        <div className="text-xs text-muted-foreground">出勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-600">
                          {selectedStudent.attendance.absent}
                        </div>
                        <div className="text-xs text-muted-foreground">缺勤</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-yellow-600">
                          {selectedStudent.attendance.leave}
                        </div>
                        <div className="text-xs text-muted-foreground">请假</div>
                      </div>
                    </div>

                    {/* 最近考勤记录 */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">最近考勤</div>
                      <div className="grid grid-cols-7 gap-1">
                        {selectedStudent.attendance.recent.slice(0, 14).map((att) => (
                          <div
                            key={att.id}
                            className="w-8 h-8 rounded flex items-center justify-center text-xs bg-muted"
                            title={`${att.className} - ${att.status === "present" ? "出勤" : att.status === "absent" ? "缺勤" : "请假"}`}
                          >
                            {getStatusIcon(att.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 课堂表现 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">课堂表现</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">平均评分</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xl font-bold">
                          {selectedStudent.performance.averageRating}
                        </span>
                        <span className="text-sm text-muted-foreground">/5</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedStudent.performance.trend.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= p.rating
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-sm flex-1 truncate">
                            {p.comment || `${p.className} - 表现良好`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 成长档案 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">成长档案</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedStudent.works.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedStudent.works.slice(0, 8).map((work) => (
                          <div
                            key={work.id}
                            className="aspect-square rounded-lg bg-muted overflow-hidden relative group"
                          >
                            {work.mediaType === "image" ? (
                              <img
                                src={work.mediaUrl}
                                alt={work.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={work.mediaUrl}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs text-center px-1">
                                {work.title}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        暂无作品记录
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
