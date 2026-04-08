"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign,
  Plus,
  Search,
  AlertCircle,
  Clock,
  TrendingUp,
  Wallet,
  Users,
  GraduationCap,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  UserPlus,
  Pencil,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  enrollments: {
    id: string;
    classId: string;
    remainingHours: number;
    totalHours: number;
    class: { id: string; name: string };
  }[];
}

interface Recharge {
  id: string;
  hours: number;
  amount?: number;
  paymentType?: string;
  remark?: string;
  createdAt: string;
  student: { id: string; name: string };
}

interface Deduction {
  id: string;
  hours: number;
  type: string;
  remark?: string;
  createdAt: string;
  lesson?: { date: string; class: { name: string } };
  enrollment: { class: { name: string } };
}

interface ClassItem {
  id: string;
  name: string;
  courseTemplate?: { id: string; name: string };
  teacher?: { id: string; name: string };
  capacity: number;
  _count?: { enrollments: number };
}

export default function HoursPage() {
  return (
    <Suspense fallback={<HoursLoading />}>
      <HoursPageContent />
    </Suspense>
  );
}

function HoursLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

function HoursPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showLowAlert = searchParams.get("alert") === "low";

  const [students, setStudents] = useState<Student[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "recharge" | "deduct" | "teacher">(
    "overview"
  );
  const [isRechargeDialogOpen, setIsRechargeDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [rechargeForm, setRechargeForm] = useState({
    hours: "",
    amount: "",
    paymentType: "cash",
    remark: "",
  });
  
  // 教师课消统计
  const [teacherStats, setTeacherStats] = useState<{
    teacherStats: Array<{
      teacherId: string;
      teacherName: string;
      lessonCount: number;
      classCount: number;
      totalHours: number;
      expectedStudents: number;
      actualStudents: number;
      deductedStudents: number;
      deductedHours: number;
    }>;
    summary: {
      totalTeachers: number;
      totalLessons: number;
      totalHours: number;
      totalExpected: number;
      totalActual: number;
      totalDeducted: number;
    };
  } | null>(null);
  const [statsDate, setStatsDate] = useState<{
    year: number;
    month: number;
  }>({ year: new Date().getFullYear(), month: new Date().getMonth() });

  // 分配班级相关状态
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState<string>("");
  const [assignForm, setAssignForm] = useState({
    classId: "",
    totalHours: "",
  });

  // 修改课时相关状态
  const [isEditHoursDialogOpen, setIsEditHoursDialogOpen] = useState(false);
  const [editEnrollment, setEditEnrollment] = useState<{
    id: string;
    studentName: string;
    className: string;
    totalHours: number;
    remainingHours: number;
  } | null>(null);
  const [editHoursForm, setEditHoursForm] = useState({
    totalHours: "",
    remainingHours: "",
    note: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    if (activeTab === "teacher") {
      fetchTeacherStats();
    }
  }, [activeTab, statsDate]);

  const fetchTeacherStats = async () => {
    const token = localStorage.getItem("token");
    const startDate = new Date(statsDate.year, statsDate.month, 1);
    const endDate = new Date(statsDate.year, statsDate.month + 1, 0);

    try {
      const response = await fetch(
        `/api/education/teacher-stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success) {
        setTeacherStats(data);
      }
    } catch (error) {
      toast.error("获取教师统计失败");
    }
  };

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const [studentsRes, rechargesRes, deductionsRes] = await Promise.all([
        fetch(`/api/education/students?search=${search}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/recharges", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/education/deductions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [studentsData, rechargesData, deductionsData] = await Promise.all([
        studentsRes.json(),
        rechargesRes.json(),
        deductionsRes.json(),
      ]);

      if (studentsData.success) setStudents(studentsData.students);
      if (rechargesData.success) setRecharges(rechargesData.recharges);
      if (deductionsData.success) setDeductions(deductionsData.deductions);
    } catch (error) {
      toast.error("获取数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/education/recharges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          hours: parseFloat(rechargeForm.hours),
          amount: rechargeForm.amount ? parseFloat(rechargeForm.amount) : null,
          paymentType: rechargeForm.paymentType,
          remark: rechargeForm.remark,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("充值成功");
        setIsRechargeDialogOpen(false);
        setRechargeForm({ hours: "", amount: "", paymentType: "cash", remark: "" });
        fetchData();
      } else {
        toast.error(data.error || "充值失败");
      }
    } catch (error) {
      toast.error("充值失败");
    }
  };

  // 获取班级列表
  const fetchClasses = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/education/classes?status=active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    }
  };

  // 打开分配班级弹窗
  const openAssignDialog = (studentId: string) => {
    setAssignStudentId(studentId);
    setAssignForm({ classId: "", totalHours: "" });
    fetchClasses();
    setIsAssignDialogOpen(true);
  };

  // 分配班级
  const handleAssignClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!assignForm.classId) {
      toast.error("请选择班级");
      return;
    }

    try {
      const response = await fetch("/api/education/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: assignStudentId,
          classId: assignForm.classId,
          totalHours: assignForm.totalHours ? parseFloat(assignForm.totalHours) : 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("分配班级成功");
        setIsAssignDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "分配失败");
      }
    } catch (error) {
      toast.error("分配班级失败");
    }
  };

  // 打开修改课时弹窗
  const openEditHoursDialog = (
    enrollmentId: string,
    studentName: string,
    className: string,
    totalHours: number,
    remainingHours: number
  ) => {
    setEditEnrollment({
      id: enrollmentId,
      studentName,
      className,
      totalHours,
      remainingHours,
    });
    setEditHoursForm({
      totalHours: totalHours.toString(),
      remainingHours: remainingHours.toString(),
      note: "",
    });
    setIsEditHoursDialogOpen(true);
  };

  // 修改课时
  const handleEditHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEnrollment) return;

    const token = localStorage.getItem("token");
    const newTotalHours = parseFloat(editHoursForm.totalHours);
    const newRemainingHours = parseFloat(editHoursForm.remainingHours);

    if (isNaN(newTotalHours) || isNaN(newRemainingHours)) {
      toast.error("请输入有效的课时数");
      return;
    }

    if (newRemainingHours > newTotalHours) {
      toast.error("剩余课时不能大于总课时");
      return;
    }

    try {
      const response = await fetch("/api/education/enrollments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editEnrollment.id,
          totalHours: newTotalHours,
          remainingHours: newRemainingHours,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("课时修改成功");
        setIsEditHoursDialogOpen(false);
        fetchData();
      } else {
        toast.error(data.error || "修改失败");
      }
    } catch (error) {
      toast.error("修改课时失败");
    }
  };

  // 课时不足的学员
  const lowHoursStudents = students.filter((s) =>
    s.enrollments.some((e) => e.remainingHours < 2)
  );

  // 统计数据
  const totalRemaining = students.reduce(
    (sum, s) => sum + s.enrollments.reduce((s, e) => s + e.remainingHours, 0),
    0
  );
  const totalRecharged = recharges.reduce((sum, r) => sum + r.hours, 0);
  const totalDeducted = deductions.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
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
              <h1 className="text-2xl font-bold text-gray-900">课消管理</h1>
              <p className="text-gray-500 mt-1">管理学员课时充值和消耗</p>
            </div>
          </div>
          <Dialog open={isRechargeDialogOpen} onOpenChange={setIsRechargeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                课时充值
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900">课时充值</DialogTitle>
                <DialogDescription className="text-gray-500">为学员充值课时</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecharge} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">选择学员</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger className="border-gray-200 text-gray-900">
                      <SelectValue placeholder="选择学员" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">充值课时</Label>
                    <Input
                      type="number"
                      value={rechargeForm.hours}
                      onChange={(e) =>
                        setRechargeForm({ ...rechargeForm, hours: e.target.value })
                      }
                      placeholder="课时数"
                      required
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">金额（选填）</Label>
                    <Input
                      type="number"
                      value={rechargeForm.amount}
                      onChange={(e) =>
                        setRechargeForm({ ...rechargeForm, amount: e.target.value })
                      }
                      placeholder="金额"
                      className="border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">支付方式</Label>
                  <Select
                    value={rechargeForm.paymentType}
                    onValueChange={(v) =>
                      setRechargeForm({ ...rechargeForm, paymentType: v })
                    }
                  >
                    <SelectTrigger className="border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="wechat">微信</SelectItem>
                      <SelectItem value="alipay">支付宝</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">备注</Label>
                  <Input
                    value={rechargeForm.remark}
                    onChange={(e) =>
                      setRechargeForm({ ...rechargeForm, remark: e.target.value })
                    }
                    placeholder="备注信息"
                    className="border-gray-200"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRechargeDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit">确认充值</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总剩余课时</p>
                  <p className="text-3xl font-bold mt-1 text-gray-900">{totalRemaining.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">本月充值</p>
                  <p className="text-3xl font-bold mt-1 text-gray-900">{totalRecharged}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">本月消课</p>
                  <p className="text-3xl font-bold mt-1 text-gray-900">{totalDeducted}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">课时预警</p>
                  <p className="text-3xl font-bold mt-1 text-red-500">
                    {lowHoursStudents.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 课时预警 */}
        {lowHoursStudents.length > 0 && (
          <Card className="bg-orange-50 border-orange-200 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-orange-700">课时不足学员（少于2课时）</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {lowHoursStudents.map((s) => (
                  <div key={s.id} className="bg-white p-3 rounded-lg border border-orange-200">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-sm text-red-500">
                      剩余 {s.enrollments[0]?.remainingHours || 0} 课时
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 切换 */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "overview", label: "学员课时" },
            { key: "recharge", label: "充值记录" },
            { key: "deduct", label: "消课记录" },
            { key: "teacher", label: "教师课消", icon: GraduationCap },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        {activeTab === "overview" && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">学员课时一览</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无学员数据</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          学员
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          班级
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          总课时
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          剩余课时
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          状态
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) =>
                        student.enrollments && student.enrollments.length > 0 ? (
                          student.enrollments.map((enrollment, idx) => (
                            <tr key={`${student.id}-${enrollment.id}`} className="hover:bg-gray-50">
                              {idx === 0 && (
                                <td className="px-4 py-3 font-medium text-gray-900" rowSpan={student.enrollments.length}>
                                  {student.name}
                                </td>
                              )}
                              <td className="px-4 py-3 text-gray-700">{enrollment.class?.name || "-"}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700">{enrollment.totalHours}</span>
                                  <button
                                    onClick={() => openEditHoursDialog(
                                      enrollment.id,
                                      student.name,
                                      enrollment.class?.name || "",
                                      enrollment.totalHours,
                                      enrollment.remainingHours
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="修改课时"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={
                                      enrollment.remainingHours < 2
                                        ? "text-red-500 font-medium"
                                        : "text-gray-700"
                                    }
                                  >
                                    {enrollment.remainingHours}
                                  </span>
                                  <button
                                    onClick={() => openEditHoursDialog(
                                      enrollment.id,
                                      student.name,
                                      enrollment.class?.name || "",
                                      enrollment.totalHours,
                                      enrollment.remainingHours
                                    )}
                                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="修改课时"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {enrollment.remainingHours < 2 ? (
                                  <Badge variant="destructive">不足</Badge>
                                ) : enrollment.remainingHours < 5 ? (
                                  <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                    即将不足
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-600">
                                    正常
                                  </Badge>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {idx === 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openAssignDialog(student.id)}
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    分配班级
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-3 text-gray-400 italic">暂未分配班级</td>
                            <td className="px-4 py-3 text-gray-400">-</td>
                            <td className="px-4 py-3 text-gray-400">-</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="border-gray-300 text-gray-500">
                                待分配
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignDialog(student.id)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                分配班级
                              </Button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "recharge" && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">充值记录</CardTitle>
            </CardHeader>
            <CardContent>
              {recharges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无充值记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recharges.map((recharge) => (
                    <div
                      key={recharge.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{recharge.student?.name || "未知学员"}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(recharge.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">+{recharge.hours}课时</p>
                        {recharge.amount && (
                          <p className="text-sm text-gray-500">¥{recharge.amount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "deduct" && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">消课记录</CardTitle>
            </CardHeader>
            <CardContent>
              {deductions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无消课记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deductions.map((deduction) => (
                    <div
                      key={deduction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{deduction.enrollment?.class?.name || "未知班级"}</p>
                        <p className="text-sm text-gray-500">
                          {deduction.lesson
                            ? new Date(deduction.lesson.date).toLocaleDateString()
                            : new Date(deduction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">-{deduction.hours}课时</p>
                        <p className="text-sm text-gray-500">
                          {deduction.type === "lesson" ? "上课消课" : deduction.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 教师课消统计 */}
        {activeTab === "teacher" && (
          <div className="space-y-6">
            {/* 日期选择 */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(statsDate.year, statsDate.month - 1);
                        setStatsDate({ year: newDate.getFullYear(), month: newDate.getMonth() });
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium min-w-[120px] text-center text-gray-900">
                      {statsDate.year}年{statsDate.month + 1}月
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(statsDate.year, statsDate.month + 1);
                        setStatsDate({ year: newDate.getFullYear(), month: newDate.getMonth() });
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {teacherStats?.summary && (
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{teacherStats.summary.totalTeachers}</div>
                        <div className="text-gray-500">教师数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{teacherStats.summary.totalLessons}</div>
                        <div className="text-gray-500">总课次</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-600">{teacherStats.summary.totalDeducted}</div>
                        <div className="text-gray-500">总消耗课时</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-purple-600">
                          {teacherStats.summary.totalExpected > 0 
                            ? Math.round(teacherStats.summary.totalActual / teacherStats.summary.totalExpected * 100) 
                            : 0}%
                        </div>
                        <div className="text-gray-500">出勤率</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 教师课消汇总表 */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    教师课消汇总
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!teacherStats ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : teacherStats.teacherStats.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>暂无数据</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">教师</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">班级数</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">上课次数</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">上课课时</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">应到人数</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">实到人数</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">扣费人数</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">消耗课时</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">出勤率</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {teacherStats.teacherStats.map((teacher) => (
                          <tr key={teacher.teacherId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                  {teacher.teacherName[0]}
                                </div>
                                <span className="font-medium text-gray-900">{teacher.teacherName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-700">{teacher.classCount}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{teacher.lessonCount}</td>
                            <td className="px-4 py-3 text-center font-medium text-gray-700">{teacher.totalHours}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{teacher.expectedStudents}</td>
                            <td className="px-4 py-3 text-center text-green-600">{teacher.actualStudents}</td>
                            <td className="px-4 py-3 text-center text-gray-700">{teacher.deductedStudents}</td>
                            <td className="px-4 py-3 text-center font-bold text-orange-600">{teacher.deductedHours}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant={
                                teacher.expectedStudents > 0 && (teacher.actualStudents / teacher.expectedStudents) >= 0.9
                                  ? "default"
                                  : teacher.expectedStudents > 0 && (teacher.actualStudents / teacher.expectedStudents) >= 0.7
                                  ? "secondary"
                                  : "destructive"
                              }>
                                {teacher.expectedStudents > 0 
                                  ? Math.round(teacher.actualStudents / teacher.expectedStudents * 100) 
                                  : 0}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* 合计行 */}
                      <tfoot className="bg-gray-100 font-medium">
                        <tr>
                          <td className="px-4 py-3 text-gray-900">合计</td>
                          <td className="px-4 py-3 text-center text-gray-700">{teacherStats.summary.totalTeachers}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{teacherStats.summary.totalLessons}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{teacherStats.summary.totalHours}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{teacherStats.summary.totalExpected}</td>
                          <td className="px-4 py-3 text-center text-green-600">{teacherStats.summary.totalActual}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{teacherStats.summary.totalDeducted}</td>
                          <td className="px-4 py-3 text-center text-orange-600">{teacherStats.summary.totalDeducted}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="default">
                              {teacherStats.summary.totalExpected > 0 
                                ? Math.round(teacherStats.summary.totalActual / teacherStats.summary.totalExpected * 100) 
                                : 0}%
                            </Badge>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 分配班级弹窗 */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">分配班级</DialogTitle>
            <DialogDescription className="text-gray-500">为学员分配班级</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignClass} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-gray-700">选择班级 *</Label>
              <Select 
                value={assignForm.classId} 
                onValueChange={(v) => setAssignForm({ ...assignForm, classId: v })}
              >
                <SelectTrigger className="border-gray-200 text-gray-900">
                  <SelectValue placeholder="选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <div className="px-2 py-4 text-center text-gray-500 text-sm">
                      暂无可分配的班级
                    </div>
                  ) : (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.courseTemplate && (
                            <span className="text-xs text-gray-400">({c.courseTemplate.name})</span>
                          )}
                          <span className="text-xs text-gray-400">
                            ({c._count?.enrollments || 0}/{c.capacity}人)
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">初始课时</Label>
              <Input
                type="number"
                value={assignForm.totalHours}
                onChange={(e) => setAssignForm({ ...assignForm, totalHours: e.target.value })}
                placeholder="输入初始课时（可选）"
                className="border-gray-200"
              />
              <p className="text-xs text-gray-400">如不填写，默认为0课时，后续可充值</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500">
                确认分配
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 修改课时弹窗 */}
      <Dialog open={isEditHoursDialogOpen} onOpenChange={setIsEditHoursDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">修改课时</DialogTitle>
            <DialogDescription className="text-gray-500">
              修改学员 <span className="text-orange-600 font-medium">{editEnrollment?.studentName}</span> 在 
              <span className="text-orange-600 font-medium"> {editEnrollment?.className}</span> 的课时
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditHours} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">总课时</Label>
                <Input
                  type="number"
                  step="1"
                  value={editHoursForm.totalHours}
                  onChange={(e) => setEditHoursForm({ ...editHoursForm, totalHours: e.target.value })}
                  placeholder="总课时"
                  className="border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">剩余课时</Label>
                <Input
                  type="number"
                  step="1"
                  value={editHoursForm.remainingHours}
                  onChange={(e) => setEditHoursForm({ ...editHoursForm, remainingHours: e.target.value })}
                  placeholder="剩余课时"
                  className="border-gray-200"
                />
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 提示：修改总课时和剩余课时将直接影响学员的课时余额，请谨慎操作。
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditHoursDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                确认修改
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
