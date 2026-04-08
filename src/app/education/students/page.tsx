"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Edit,
  Trash2,
  User,
  GraduationCap,
  ChevronLeft,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  note?: string;
  createdAt: string;
  _count?: { enrollments: number };
  enrollments?: { class: { id: string; name: string } }[];
}

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    birthDate: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    note: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/education/students?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      toast.error("获取学生列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const url = editingStudent
        ? `/api/education/students/${editingStudent.id}`
        : "/api/education/students";
      const method = editingStudent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingStudent ? "更新成功" : "添加成功");
        setIsDialogOpen(false);
        resetForm();
        fetchStudents();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该学生吗？")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`/api/education/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("删除成功");
        fetchStudents();
      }
    } catch (error) {
      toast.error("删除失败");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "",
      birthDate: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      note: "",
    });
    setEditingStudent(null);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      gender: student.gender || "",
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      phone: student.phone || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      note: student.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页头 */}
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
              <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
              <p className="text-gray-500 mt-1">管理机构学员信息</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                添加学生
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900">{editingStudent ? "编辑学生" : "添加学生"}</DialogTitle>
                <DialogDescription className="text-gray-500">填写学生基本信息</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">学生姓名 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入姓名"
                      required
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-gray-700">性别</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger className="border-gray-200 text-gray-900">
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">男</SelectItem>
                        <SelectItem value="female">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-gray-700">出生日期</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700">联系电话</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="学生联系电话"
                    className="border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName" className="text-gray-700">家长姓名</Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="家长姓名"
                      className="border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone" className="text-gray-700">家长电话</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="家长电话"
                      className="border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note" className="text-gray-700">备注</Label>
                  <Input
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="备注信息"
                    className="border-gray-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">{editingStudent ? "更新" : "添加"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 搜索栏 */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索学生姓名或电话..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && fetchStudents()}
                />
              </div>
              <Button onClick={fetchStudents}>搜索</Button>
            </div>
          </CardContent>
        </Card>

        {/* 学生列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">加载中...</div>
          ) : students.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>暂无学生数据</p>
            </div>
          ) : (
            students.map((student) => (
              <Card key={student.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                        {student.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{student.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {student.gender && (
                            <Badge variant="outline" className="text-xs">
                              {student.gender === "male" ? "男" : "女"}
                            </Badge>
                          )}
                          {student._count?.enrollments !== undefined && (
                            <span>{student._count.enrollments} 个班级</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(student.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {student.parentPhone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>家长：{student.parentPhone}</span>
                      </div>
                    )}
                    {student.birthDate && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(student.birthDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {student.enrollments && student.enrollments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {student.enrollments.map((e, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {e.class.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
