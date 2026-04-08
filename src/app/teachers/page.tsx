"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Phone,
  BookOpen,
  Users,
  Clock,
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  avatar: string | null;
  phone: string | null;
  campus: { id: string; name: string } | null;
  subjects: string | null;
  studentCount: number;
  lessonCount: number;
  hoursConsumed: number;
  classCount: number;
  createdAt: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    campusId: "",
    subjects: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchTeachers();
  }, [router, search]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await fetch(`/api/principal/teachers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error("获取老师列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTeacher(null);
    setFormData({ name: "", phone: "", campusId: "", subjects: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      phone: teacher.phone || "",
      campusId: teacher.campus?.id || "",
      subjects: teacher.subjects || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该老师吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/principal/teachers?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        fetchTeachers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("删除老师失败:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const method = editingTeacher ? "PUT" : "POST";
      const body = editingTeacher
        ? { id: editingTeacher.id, ...formData }
        : formData;

      const response = await fetch("/api/principal/teachers", {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setIsDialogOpen(false);
        fetchTeachers();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("保存老师失败:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">老师管理</h1>
          <p className="text-muted-foreground">管理所有老师信息</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-1" />
            添加老师
          </Button>
        </div>
      </div>

      {/* 搜索 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索老师姓名或手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 老师列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map((teacher) => (
          <Card
            key={teacher.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => {
              setSelectedTeacher(teacher);
              setIsDetailOpen(true);
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={teacher.avatar || undefined} />
                  <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {teacher.campus?.name || "未分配校区"}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Phone className="w-3 h-3" />
                    {teacher.phone || "未填写"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Users className="w-3 h-3" />
                    <span>学员</span>
                  </div>
                  <div className="font-bold">{teacher.studentCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <BookOpen className="w-3 h-3" />
                    <span>授课</span>
                  </div>
                  <div className="font-bold">{teacher.lessonCount}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Clock className="w-3 h-3" />
                    <span>课消</span>
                  </div>
                  <div className="font-bold">{teacher.hoursConsumed}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <Button variant="outline" size="sm" onClick={() => handleEdit(teacher)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(teacher.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeacher ? "编辑老师" : "添加老师"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">姓名 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入老师姓名"
              />
            </div>
            <div>
              <label className="text-sm font-medium">手机号</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
            <div>
              <label className="text-sm font-medium">科目</label>
              <Input
                value={formData.subjects}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                placeholder="如：美术、舞蹈（多个用逗号分隔）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 老师详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>老师详情</DialogTitle>
          </DialogHeader>
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedTeacher.avatar || undefined} />
                  <AvatarFallback className="text-xl">
                    {selectedTeacher.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-bold">{selectedTeacher.name}</div>
                  <div className="text-muted-foreground">
                    {selectedTeacher.campus?.name || "未分配校区"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    科目：{selectedTeacher.subjects || "未设置"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{selectedTeacher.studentCount}</div>
                    <div className="text-xs text-muted-foreground">学员数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{selectedTeacher.classCount}</div>
                    <div className="text-xs text-muted-foreground">班级数</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{selectedTeacher.lessonCount}</div>
                    <div className="text-xs text-muted-foreground">本月授课</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold">{selectedTeacher.hoursConsumed}</div>
                    <div className="text-xs text-muted-foreground">本月课消</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
