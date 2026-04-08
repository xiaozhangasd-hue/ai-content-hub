"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  Play,
  FileText,
  TrendingUp,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  topic?: string;
  status: string;
  class: { id: string; name: string; teacher?: { name: string } };
  attendances: Attendance[];
}

interface Attendance {
  id: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  remark?: string;
  student: { id: string; name: string; phone?: string };
  enrollment: { id: string; remainingHours: number };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  early_leave: number;
  pending: number;
  rate: number;
}

const attendanceOptions = [
  { value: "present", label: "出勤", icon: CheckCircle, color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-50" },
  { value: "absent", label: "缺勤", icon: XCircle, color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" },
  { value: "leave", label: "请假", icon: Clock, color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" },
  { value: "late", label: "迟到", icon: Clock, color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
  { value: "early_leave", label: "早退", icon: Clock, color: "bg-purple-500", textColor: "text-purple-700", bgColor: "bg-purple-50" },
];

const absentReasons = [
  "病假",
  "事假",
  "旷课",
  "调课",
  "其他",
];

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendanceLoading />}>
      <AttendancePageContent />
    </Suspense>
  );
}

function AttendanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonIdParam = searchParams.get("lessonId");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessonIdParam || "");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 日期筛选
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  
  // 批量选择
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  
  // 备注弹窗
  const [remarkDialog, setRemarkDialog] = useState<{
    open: boolean;
    attendanceId: string;
    studentName: string;
    currentRemark: string;
  }>({ open: false, attendanceId: "", studentName: "", currentRemark: "" });
  
  // 统计数据
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    late: 0,
    early_leave: 0,
    pending: 0,
    rate: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchLessons();
  }, [router, currentDate, viewMode]);

  useEffect(() => {
    if (selectedLessonId) {
      const lesson = lessons.find((l) => l.id === selectedLessonId);
      setSelectedLesson(lesson || null);
      if (lesson) {
        calculateStats(lesson.attendances);
      }
    } else {
      setSelectedLesson(null);
    }
  }, [selectedLessonId, lessons]);

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    if (viewMode === "day") {
      // 当天
    } else if (viewMode === "week") {
      start.setDate(start.getDate() - start.getDay() + 1); // 周一
      end.setDate(start.getDate() + 6); // 周日
    } else {
      start.setDate(1); // 月初
      end.setMonth(end.getMonth() + 1, 0); // 月末
    }
    
    return { start, end };
  };

  const fetchLessons = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);

    const { start, end } = getDateRange();

    try {
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: "scheduled,ongoing,completed",
      });

      const response = await fetch(`/api/education/lessons?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setLessons(data.lessons);
      }
    } catch (error) {
      toast.error("获取课程列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (attendances: Attendance[]) => {
    const total = attendances.length;
    const present = attendances.filter((a) => a.status === "present").length;
    const absent = attendances.filter((a) => a.status === "absent").length;
    const leave = attendances.filter((a) => a.status === "leave").length;
    const late = attendances.filter((a) => a.status === "late").length;
    const early_leave = attendances.filter((a) => a.status === "early_leave").length;
    const pending = attendances.filter((a) => a.status === "pending").length;
    const checkedTotal = total - pending;
    const rate = checkedTotal > 0 ? Math.round((present / checkedTotal) * 100) : 0;

    setStats({ total, present, absent, leave, late, early_leave, pending, rate });
  };

  const handleAttendanceChange = async (attendanceId: string, status: string, remark?: string) => {
    const token = localStorage.getItem("token");
    setIsSaving(true);

    try {
      const now = new Date();
      const updateData: Record<string, unknown> = { id: attendanceId, status };
      
      if (status === "present" || status === "late") {
        updateData.checkInTime = now.toISOString();
      }
      if (remark) {
        updateData.remark = remark;
      }

      const response = await fetch("/api/education/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("考勤状态已更新");
        
        // 更新本地状态
        if (selectedLesson) {
          const updatedAttendances = selectedLesson.attendances.map((a) =>
            a.id === attendanceId 
              ? { ...a, status, remark: remark || a.remark, checkInTime: status === "present" ? now.toISOString() : a.checkInTime } 
              : a
          );
          setSelectedLesson({ ...selectedLesson, attendances: updatedAttendances });
          setLessons(
            lessons.map((l) =>
              l.id === selectedLesson.id
                ? { ...l, attendances: updatedAttendances }
                : l
            )
          );
          calculateStats(updatedAttendances);
        }
      }
    } catch (error) {
      toast.error("更新失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 批量点名上课
  const handleBatchCheckIn = async () => {
    if (!selectedLesson) return;
    
    const pendingAttendances = selectedLesson.attendances.filter(
      (a) => a.status === "pending"
    );

    if (pendingAttendances.length === 0) {
      toast.info("没有待签到的学员");
      return;
    }

    const token = localStorage.getItem("token");
    setIsSaving(true);
    const now = new Date();

    try {
      const response = await fetch("/api/education/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          pendingAttendances.map((a) => ({ 
            id: a.id, 
            status: "present",
            checkInTime: now.toISOString()
          }))
        ),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`已为 ${data.count} 名学员完成点名`);
        fetchLessons();
      }
    } catch (error) {
      toast.error("批量点名失败");
    } finally {
      setIsSaving(false);
    }
  };

  // 批量设置状态
  const handleBatchStatus = async (status: string) => {
    if (selectedStudents.size === 0) {
      toast.info("请先选择学员");
      return;
    }

    const token = localStorage.getItem("token");
    setIsSaving(true);

    try {
      const updates = Array.from(selectedStudents).map((id) => {
        const attendance = selectedLesson?.attendances.find((a) => a.student.id === id);
        if (!attendance) return null;
        return { id: attendance.id, status };
      }).filter(Boolean);

      const response = await fetch("/api/education/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`已为 ${data.count} 名学员设置${attendanceOptions.find(o => o.value === status)?.label}`);
        setSelectedStudents(new Set());
        fetchLessons();
      }
    } catch (error) {
      toast.error("批量设置失败");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const toggleSelectAll = () => {
    if (!selectedLesson) return;
    
    if (selectedStudents.size === selectedLesson.attendances.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(selectedLesson.attendances.map((a) => a.student.id)));
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateDisplay = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
    } else if (viewMode === "week") {
      const { start, end } = getDateRange();
      return `${start.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long" });
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/education")}
              className="gap-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">考勤管理</h1>
              <p className="text-gray-500 mt-1">管理学员签到和考勤记录</p>
            </div>
          </div>
          
          {/* 日期导航 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-lg shadow-sm border">
              <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-4 text-sm font-medium min-w-[160px] text-center text-gray-900">
                {getDateDisplay()}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as "day" | "week" | "month")}>
              <SelectTrigger className="w-24 bg-white text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">日</SelectItem>
                <SelectItem value="week">周</SelectItem>
                <SelectItem value="month">月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 统计卡片 */}
        {selectedLesson && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">总人数</div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-xs text-green-600">出勤</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-xs text-red-600">缺勤</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.leave}</div>
                <div className="text-xs text-yellow-600">请假</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.late}</div>
                <div className="text-xs text-orange-600">迟到</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.early_leave}</div>
                <div className="text-xs text-purple-600">早退</div>
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                <div className="text-xs text-gray-500">待签到</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.rate}%</div>
                <div className="text-xs text-blue-600">出勤率</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧课程列表 */}
          <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                课程列表
                <Badge variant="secondary" className="ml-auto">{lessons.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto px-3">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                </div>
              ) : lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>暂无课程</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson) => {
                    const pendingCount = lesson.attendances.filter(
                      (a) => a.status === "pending"
                    ).length;
                    const presentCount = lesson.attendances.filter(
                      (a) => a.status === "present"
                    ).length;
                    const isSelected = selectedLessonId === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          setSelectedLessonId(lesson.id);
                          setSelectedStudents(new Set());
                        }}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-green-50 border-green-300 shadow-sm"
                            : "bg-gray-50 border-transparent hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-gray-900">{lesson.class.name}</span>
                          {pendingCount > 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              {pendingCount} 待签
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                              {presentCount}/{lesson.attendances.length}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(lesson.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })} {lesson.startTime}-{lesson.endTime}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-400">
                            {lesson.class.teacher?.name || "未指定"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {lesson.hours || 1}课时
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧考勤详情 */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-green-500" />
                  考勤详情
                </CardTitle>
                
                {selectedLesson && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleBatchCheckIn}
                      disabled={isSaving || stats.pending === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      一键点名上课
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedLesson ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>请选择左侧课程查看考勤</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 课程信息 */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedLesson.class.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(selectedLesson.date).toLocaleDateString("zh-CN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} ·{" "}
                        {selectedLesson.startTime} - {selectedLesson.endTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">授课教师</p>
                      <p className="font-medium text-gray-900">{selectedLesson.class.teacher?.name || "未指定"}</p>
                    </div>
                  </div>

                  {/* 批量操作栏 */}
                  {selectedStudents.size > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="text-sm text-blue-700">
                        已选择 {selectedStudents.size} 人
                      </span>
                      <div className="flex-1" />
                      {attendanceOptions.map((opt) => (
                        <Button
                          key={opt.value}
                          size="sm"
                          variant="outline"
                          onClick={() => handleBatchStatus(opt.value)}
                          disabled={isSaving}
                          className="h-7"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* 学员列表 */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-3 py-3">
                            <button onClick={toggleSelectAll} className="p-1">
                              {selectedStudents.size === selectedLesson.attendances.length ? (
                                <CheckSquare className="w-4 h-4 text-green-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            学员
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            剩余课时
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            签到时间
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            考勤状态
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                            备注
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedLesson.attendances.map((attendance) => {
                          const isSelected = selectedStudents.has(attendance.student.id);
                          const statusOption = attendanceOptions.find(o => o.value === attendance.status);
                          
                          return (
                            <tr 
                              key={attendance.id} 
                              className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""}`}
                            >
                              <td className="w-10 px-3 py-3">
                                <button 
                                  onClick={() => toggleStudentSelection(attendance.student.id)}
                                  className="p-1"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{attendance.student.name}</div>
                                {attendance.student.phone && (
                                  <div className="text-xs text-gray-400">{attendance.student.phone}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`font-medium ${
                                    attendance.enrollment.remainingHours < 2
                                      ? "text-red-500"
                                      : attendance.enrollment.remainingHours < 5
                                      ? "text-orange-500"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {attendance.enrollment.remainingHours} 课时
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatTime(attendance.checkInTime)}
                              </td>
                              <td className="px-4 py-3">
                                <Select
                                  value={attendance.status}
                                  onValueChange={(v) => handleAttendanceChange(attendance.id, v)}
                                >
                                  <SelectTrigger className={`w-24 h-8 ${attendance.status === "pending" ? "border-gray-300 text-gray-500" : statusOption?.bgColor + " " + statusOption?.textColor}`}>
                                    <SelectValue placeholder="待签到" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">
                                      <span className="text-gray-500">待签到</span>
                                    </SelectItem>
                                    {attendanceOptions.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        <span className={opt.textColor}>{opt.label}</span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => setRemarkDialog({
                                    open: true,
                                    attendanceId: attendance.id,
                                    studentName: attendance.student.name,
                                    currentRemark: attendance.remark || "",
                                  })}
                                >
                                  {attendance.remark ? (
                                    <FileText className="w-4 h-4 text-blue-500" />
                                  ) : (
                                    <MessageSquare className="w-4 h-4 text-gray-300" />
                                  )}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 备注弹窗 */}
      <Dialog open={remarkDialog.open} onOpenChange={(open) => setRemarkDialog({ ...remarkDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加备注 - {remarkDialog.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>缺勤原因</Label>
              <div className="flex flex-wrap gap-2">
                {absentReasons.map((reason) => (
                  <Button
                    key={reason}
                    variant="outline"
                    size="sm"
                    onClick={() => setRemarkDialog({ ...remarkDialog, currentRemark: reason })}
                    className={remarkDialog.currentRemark === reason ? "border-green-500 bg-green-50" : ""}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>详细备注</Label>
              <Textarea
                value={remarkDialog.currentRemark}
                onChange={(e) => setRemarkDialog({ ...remarkDialog, currentRemark: e.target.value })}
                placeholder="输入详细备注信息..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialog({ ...remarkDialog, open: false })}>
              取消
            </Button>
            <Button 
              onClick={() => {
                handleAttendanceChange(remarkDialog.attendanceId, selectedLesson?.attendances.find(a => a.id === remarkDialog.attendanceId)?.status || "absent", remarkDialog.currentRemark);
                setRemarkDialog({ ...remarkDialog, open: false });
              }}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
