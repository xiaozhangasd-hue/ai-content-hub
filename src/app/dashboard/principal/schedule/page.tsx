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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Plus,
  RefreshCw,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Zap,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Schedule {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  teacher: { id: string; name: string; avatar?: string };
  course: { id: string; name: string; type?: string };
  student?: { id: string; name: string };
}

interface Conflict {
  id: string;
  reason: string;
  conflicts: string[];
}

interface AutoSchedulePlan {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  teacherName?: string;
  conflict: boolean;
}

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "list">("week");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAutoDialogOpen, setIsAutoDialogOpen] = useState(false);
  const [autoPlan, setAutoPlan] = useState<AutoSchedulePlan[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    teacherId: "",
    courseId: "",
    studentId: "",
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    note: "",
  });

  const [autoFormData, setAutoFormData] = useState({
    courseId: "",
    studentId: "",
    sessionsPerWeek: 2,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSchedules();
    fetchOptions();
  }, [router, currentDate]);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const params = new URLSearchParams();
      params.append("startDate", startOfWeek.toISOString().split("T")[0]);
      params.append("endDate", endOfWeek.toISOString().split("T")[0]);

      const response = await fetch(`/api/principal/schedule?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setSchedules(data.data.schedules);
        setConflicts(data.data.conflicts);
      }
    } catch (error) {
      console.error("获取排课失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      // 获取教师列表
      const teachersRes = await fetch("/api/principal/teachers/performance?pageSize=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teachersData = await teachersRes.json();
      if (teachersData.success) {
        setTeachers(teachersData.data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })));
      }

      // 获取课程列表（暂时使用模拟数据）
      setCourses([
        { id: "1", name: "钢琴课" },
        { id: "2", name: "舞蹈课" },
        { id: "3", name: "美术课" },
        { id: "4", name: "英语课" },
      ]);

      // 获取学生列表（暂时使用模拟数据）
      setStudents([
        { id: "1", name: "张小明" },
        { id: "2", name: "李小红" },
        { id: "3", name: "王小华" },
      ]);
    } catch (error) {
      console.error("获取选项失败:", error);
    }
  };

  const handleAddSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        setIsAddDialogOpen(false);
        setFormData({
          teacherId: "",
          courseId: "",
          studentId: "",
          date: "",
          startTime: "09:00",
          endTime: "10:00",
          note: "",
        });
        fetchSchedules();
      } else if (data.error?.includes("冲突")) {
        alert(data.error);
      }
    } catch (error) {
      console.error("添加排课失败:", error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("确定要删除该排课吗？")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/schedule?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchSchedules();
      }
    } catch (error) {
      console.error("删除排课失败:", error);
    }
  };

  const handleAutoSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/schedule/auto", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(autoFormData),
      });
      const data = await response.json();
      if (data.success) {
        setAutoPlan(data.data.plan);
      }
    } catch (error) {
      console.error("自动排课失败:", error);
    }
  };

  const handleConfirmAutoSchedule = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/schedule/auto", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: autoPlan,
          courseId: autoFormData.courseId,
          studentId: autoFormData.studentId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setIsAutoDialogOpen(false);
        setAutoPlan([]);
        fetchSchedules();
      }
    } catch (error) {
      console.error("确认排课失败:", error);
    }
  };

  // 生成周视图数据
  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  const getSchedulesForSlot = (date: Date, time: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return schedules.filter((s) => {
      const scheduleDate = new Date(s.date).toISOString().split("T")[0];
      return scheduleDate === dateStr && s.startTime <= time && s.endTime > time;
    });
  };

  const isConflictSchedule = (scheduleId: string) => {
    return conflicts.some((c) => c.conflicts.includes(scheduleId));
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">智能排课</h1>
          <p className="text-muted-foreground">管理课程安排，检测时间冲突</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAutoDialogOpen(true)}>
            <Zap className="w-4 h-4 mr-1" />
            自动排课
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            添加排课
          </Button>
          <Button variant="outline" onClick={fetchSchedules}>
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
        </div>
      </div>

      {/* 冲突提示 */}
      {conflicts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">发现 {conflicts.length} 个时间冲突</span>
            </div>
            <div className="mt-2 space-y-1">
              {conflicts.map((c) => (
                <div key={c.id} className="text-sm text-orange-600">
                  {c.reason}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 周导航 */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() - 7);
          setCurrentDate(newDate);
        }}>
          <ChevronLeft className="w-4 h-4" />
          上一周
        </Button>
        <div className="text-lg font-medium text-gray-900">
          {weekDays[0].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })} - {weekDays[6].toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const newDate = new Date(currentDate);
          newDate.setDate(newDate.getDate() + 7);
          setCurrentDate(newDate);
        }}>
          下一周
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* 周视图 */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b">
              <div className="p-2 bg-muted font-medium text-center">时间</div>
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`p-2 text-center ${
                    day.toDateString() === new Date().toDateString()
                      ? "bg-primary/10 font-bold"
                      : "bg-muted"
                  }`}
                >
                  <div>{dayNames[index]}</div>
                  <div className="text-sm text-muted-foreground">
                    {day.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                  </div>
                </div>
              ))}
            </div>

            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b">
                <div className="p-2 text-center text-sm text-muted-foreground border-r">
                  {time}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const slotSchedules = getSchedulesForSlot(day, time);
                  return (
                    <div
                      key={dayIndex}
                      className={`p-1 min-h-[60px] border-r ${
                        day.toDateString() === new Date().toDateString()
                          ? "bg-primary/5"
                          : ""
                      }`}
                    >
                      {slotSchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className={`p-1 rounded text-xs mb-1 ${
                            isConflictSchedule(schedule.id)
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-primary/10 text-primary"
                          }`}
                          title={`${schedule.course.name} - ${schedule.teacher.name}`}
                        >
                          <div className="font-medium truncate">{schedule.course.name}</div>
                          <div className="truncate">{schedule.teacher.name}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 今日课程 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">本周课程列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无排课数据
              </div>
            ) : (
              <div className="divide-y">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`p-4 flex items-center justify-between ${
                      isConflictSchedule(schedule.id) ? "bg-red-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {new Date(schedule.date).getDate()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dayNames[new Date(schedule.date).getDay()]}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{schedule.course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime} · {schedule.teacher.name}
                          {schedule.student && ` · ${schedule.student.name}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isConflictSchedule(schedule.id) && (
                        <Badge variant="destructive">冲突</Badge>
                      )}
                      <Badge variant={schedule.status === "completed" ? "default" : "secondary"}>
                        {schedule.status === "completed" ? "已完成" : 
                         schedule.status === "cancelled" ? "已取消" : "待上课"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加排课对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加排课</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>教师 *</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(v) => setFormData({ ...formData, teacherId: v })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue placeholder="选择教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>课程 *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(v) => setFormData({ ...formData, courseId: v })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue placeholder="选择课程" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>学生</Label>
              <Select
                value={formData.studentId}
                onValueChange={(v) => setFormData({ ...formData, studentId: v })}
              >
                <SelectTrigger className="text-gray-900">
                  <SelectValue placeholder="选择学生" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>日期 *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间 *</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间 *</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="可选备注"
                rows={2}
              />
            </div>
            <Button onClick={handleAddSchedule} className="w-full">
              添加排课
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 自动排课对话框 */}
      <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>自动排课</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {autoPlan.length === 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>课程 *</Label>
                    <Select
                      value={autoFormData.courseId}
                      onValueChange={(v) => setAutoFormData({ ...autoFormData, courseId: v })}
                    >
                      <SelectTrigger className="text-gray-900">
                        <SelectValue placeholder="选择课程" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>学生</Label>
                    <Select
                      value={autoFormData.studentId}
                      onValueChange={(v) => setAutoFormData({ ...autoFormData, studentId: v })}
                    >
                      <SelectTrigger className="text-gray-900">
                        <SelectValue placeholder="选择学生" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>开始日期 *</Label>
                    <Input
                      type="date"
                      value={autoFormData.startDate}
                      onChange={(e) => setAutoFormData({ ...autoFormData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>结束日期 *</Label>
                    <Input
                      type="date"
                      value={autoFormData.endDate}
                      onChange={(e) => setAutoFormData({ ...autoFormData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>每周课时</Label>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={autoFormData.sessionsPerWeek}
                      onChange={(e) => setAutoFormData({ ...autoFormData, sessionsPerWeek: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <Button onClick={handleAutoSchedule} className="w-full">
                  <Zap className="w-4 h-4 mr-1" />
                  生成排课方案
                </Button>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  已生成 {autoPlan.length} 个排课方案
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {autoPlan.map((plan, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border ${
                        plan.conflict ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{plan.date} 周{plan.dayOfWeek}</span>
                          <span className="text-muted-foreground ml-2">
                            {plan.startTime} - {plan.endTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{plan.teacherName}</span>
                          {plan.conflict && (
                            <Badge variant="destructive">冲突</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAutoPlan([])} className="flex-1">
                    重新生成
                  </Button>
                  <Button onClick={handleConfirmAutoSchedule} className="flex-1">
                    确认排课
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
