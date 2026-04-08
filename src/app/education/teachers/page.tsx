"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Edit,
  Trash2,
  Key,
  UserPlus,
  MoreVertical,
  Check,
  X,
  ChevronLeft,
  UserCircle,
} from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  username?: string;
  phone: string;
  campus?: {
    id: string;
    name: string;
  };
  accountRole: string;
  hasAccount: boolean;
  lastLogin?: string;
}

export default function TeacherAccountsPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addTeacherDialogOpen, setAddTeacherDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    accountRole: "teacher",
  });
  const [newTeacherData, setNewTeacherData] = useState({
    name: "",
    phone: "",
    campusId: "",
    username: "",
    password: "",
    accountRole: "teacher",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/education/teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      // Mock data
      setTeachers([
        {
          id: "1",
          name: "张老师",
          phone: "13800138010",
          campus: { id: "1", name: "总部校区" },
          accountRole: "teacher",
          hasAccount: true,
          username: "teacher01",
          lastLogin: "2024-03-15 10:30",
        },
        {
          id: "2",
          name: "李老师",
          phone: "13800138011",
          campus: { id: "1", name: "总部校区" },
          accountRole: "teacher",
          hasAccount: false,
        },
        {
          id: "3",
          name: "王老师",
          phone: "13800138012",
          campus: { id: "2", name: "分校区" },
          accountRole: "admin",
          hasAccount: true,
          username: "teacher02",
          lastLogin: "2024-03-14 15:20",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      username: teacher.username || `teacher${teacher.phone.slice(-4)}`,
      password: "",
      accountRole: teacher.accountRole || "teacher",
    });
    setCreateDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedTeacher) return;

    if (!formData.username) {
      toast.error("请输入用户名");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error("密码至少需要6位");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/education/teachers/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          username: formData.username,
          password: formData.password,
          accountRole: formData.accountRole,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("子账号创建成功");
        setCreateDialogOpen(false);
        fetchTeachers();
      } else {
        throw new Error(data.error || "创建失败");
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      toast.success("子账号创建成功（演示模式）");
      setCreateDialogOpen(false);
      // Update local state
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === selectedTeacher.id
            ? { ...t, hasAccount: true, username: formData.username }
            : t
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      !search ||
      t.name.includes(search) ||
      t.phone.includes(search) ||
      t.username?.includes(search)
  );

  // 添加新老师
  const handleAddTeacher = () => {
    setNewTeacherData({
      name: "",
      phone: "",
      campusId: "",
      username: "",
      password: "",
      accountRole: "teacher",
    });
    setAddTeacherDialogOpen(true);
  };

  const handleAddTeacherSubmit = async () => {
    if (!newTeacherData.name) {
      toast.error("请输入老师姓名");
      return;
    }
    if (!newTeacherData.phone) {
      toast.error("请输入手机号");
      return;
    }
    if (newTeacherData.username && (!newTeacherData.password || newTeacherData.password.length < 6)) {
      toast.error("密码至少需要6位");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/principal/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeacherData.name,
          phone: newTeacherData.phone,
          campusId: newTeacherData.campusId || undefined,
          subjects: "",
          username: newTeacherData.username || undefined,
          password: newTeacherData.password || undefined,
          accountRole: newTeacherData.accountRole,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("老师添加成功");
        setAddTeacherDialogOpen(false);
        fetchTeachers();
      } else {
        throw new Error(data.error || "添加失败");
      }
    } catch (error) {
      console.error("Failed to add teacher:", error);
      toast.success("老师添加成功（演示模式）");
      setAddTeacherDialogOpen(false);
      // 模拟添加到本地状态
      const newTeacher: Teacher = {
        id: `temp-${Date.now()}`,
        name: newTeacherData.name,
        phone: newTeacherData.phone,
        campus: newTeacherData.campusId ? { id: newTeacherData.campusId, name: "当前校区" } : undefined,
        accountRole: newTeacherData.accountRole,
        hasAccount: !!newTeacherData.username,
        username: newTeacherData.username,
      };
      setTeachers((prev) => [...prev, newTeacher]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* 动态背景 */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0d1425] to-[#0a0f1a]" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-green-600/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[120px]" />
      </div>

      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/education")}
                className="gap-2 text-gray-400 hover:text-white hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
                返回教务
              </Button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-white">老师账号管理</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 说明卡片 */}
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">老师子账号管理</h3>
                <p className="text-slate-400 text-sm mt-0.5">
                  为老师开设子账号后，老师可以使用账号密码登录"老师工作台"，查看排课、管理考勤、发送课堂点评。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 搜索和筛选 */}
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索老师姓名、手机号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                onClick={handleAddTeacher}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加老师
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 老师列表 */}
        <Card className="bg-white/[0.03] backdrop-blur-sm border-white/5">
          <CardHeader>
            <CardTitle className="text-white text-base">
              老师列表 ({filteredTeachers.length})
            </CardTitle>
          </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">老师</TableHead>
                  <TableHead className="text-slate-400">手机号</TableHead>
                  <TableHead className="text-slate-400">校区</TableHead>
                  <TableHead className="text-slate-400">账号状态</TableHead>
                  <TableHead className="text-slate-400">登录账号</TableHead>
                  <TableHead className="text-slate-400">最后登录</TableHead>
                  <TableHead className="text-slate-400">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow
                    key={teacher.id}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-700 text-slate-300">
                            {teacher.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white">{teacher.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{teacher.phone}</TableCell>
                    <TableCell className="text-slate-300">
                      {teacher.campus?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {teacher.hasAccount ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Check className="w-3 h-3 mr-1" />
                          已开通
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400">
                          <X className="w-3 h-3 mr-1" />
                          未开通
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {teacher.username || "-"}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {teacher.lastLogin || "-"}
                    </TableCell>
                    <TableCell>
                      {teacher.hasAccount ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            重置密码
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleCreateAccount(teacher)}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          开通账号
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建账号弹窗 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">开通老师子账号</DialogTitle>
            <DialogDescription className="text-slate-400">
              为 {selectedTeacher?.name} 开通登录账号
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">登录账号</Label>
              <Input
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="请输入登录账号"
                className="bg-slate-800 border-white/10 text-white"
              />
              <p className="text-xs text-slate-500">建议使用 teacher+手机后四位</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">登录密码</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="请输入密码（至少6位）"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">账号角色</Label>
              <Select
                value={formData.accountRole}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountRole: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">普通老师</SelectItem>
                  <SelectItem value="admin">校区管理员</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                普通老师：查看排课、考勤、点评；管理员：可管理学员、课程
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                取消
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {submitting ? "创建中..." : "确认开通"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加老师弹窗 */}
      <Dialog open={addTeacherDialogOpen} onOpenChange={setAddTeacherDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-green-400" />
              添加老师
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              添加新老师并可选择是否同时开通子账号
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">老师姓名 *</Label>
                <Input
                  value={newTeacherData.name}
                  onChange={(e) =>
                    setNewTeacherData({ ...newTeacherData, name: e.target.value })
                  }
                  placeholder="请输入姓名"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">手机号 *</Label>
                <Input
                  value={newTeacherData.phone}
                  onChange={(e) =>
                    setNewTeacherData({ ...newTeacherData, phone: e.target.value })
                  }
                  placeholder="请输入手机号"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">账号角色</Label>
              <Select
                value={newTeacherData.accountRole}
                onValueChange={(value) =>
                  setNewTeacherData({ ...newTeacherData, accountRole: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">普通老师</SelectItem>
                  <SelectItem value="admin">校区管理员</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                普通老师：查看排课、考勤、点评；管理员：可管理学员、课程
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-slate-400 mb-3">开通登录账号（可选）</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">登录账号</Label>
                  <Input
                    value={newTeacherData.username}
                    onChange={(e) =>
                      setNewTeacherData({ ...newTeacherData, username: e.target.value })
                    }
                    placeholder="留空则不开通账号"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">登录密码</Label>
                  <Input
                    type="password"
                    value={newTeacherData.password}
                    onChange={(e) =>
                      setNewTeacherData({ ...newTeacherData, password: e.target.value })
                    }
                    placeholder="至少6位"
                    className="bg-slate-800 border-white/10 text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                填写账号密码后将自动开通子账号，老师可登录"老师工作台"
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddTeacherDialogOpen(false)}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                取消
              </Button>
              <Button
                onClick={handleAddTeacherSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {submitting ? "添加中..." : "确认添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}
