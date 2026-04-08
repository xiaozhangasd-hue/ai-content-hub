"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import {
  Search,
  Plus,
  User,
  Phone,
  Calendar,
  Camera,
  ChevronRight,
  UserPlus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  gender: string;
  birthDate: string | null;
  phone: string | null;
  avatar: string | null;
  status: string;
  enrolledDate: string | null;
  class?: {
    id: string;
    name: string;
  };
  _count?: {
    medias: number;
    studentFaces: number;
  };
}

interface ClassInfo {
  id: string;
  name: string;
}

interface ParentInfo {
  name: string;
  relationship: string;
  phone: string;
}

export default function TeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // 新学员表单
  const [newStudent, setNewStudent] = useState({
    name: "",
    gender: "male",
    birthDate: "",
    phone: "",
    classId: "",
    note: "",
  });

  // 家长信息列表（最多3个）
  const [parents, setParents] = useState<ParentInfo[]>([
    { name: "", relationship: "father", phone: "" },
  ]);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // 获取老师关联的班级学员
      const response = await fetch(
        `/api/teacher/students?teacherId=${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error("获取学员列表失败:", error);
      toast.error("获取学员列表失败");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch(
        `/api/teacher/classes?teacherId=${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    }
  };

  // 添加家长
  const addParent = () => {
    if (parents.length < 3) {
      setParents([...parents, { name: "", relationship: "other", phone: "" }]);
    } else {
      toast.error("最多添加3个家长");
    }
  };

  // 删除家长
  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
    }
  };

  // 更新家长信息
  const updateParent = (index: number, field: keyof ParentInfo, value: string) => {
    const newParents = [...parents];
    newParents[index] = { ...newParents[index], [field]: value };
    setParents(newParents);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      toast.error("请输入学员姓名");
      return;
    }

    // 验证家长手机号（至少填写一个）
    const validParents = parents.filter(p => p.phone.trim());
    if (validParents.length === 0) {
      toast.error("请至少填写一个家长的手机号");
      return;
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    for (const parent of validParents) {
      if (!phoneRegex.test(parent.phone)) {
        toast.error(`家长 ${parent.name || '未命名'} 的手机号格式不正确`);
        return;
      }
    }

    setIsAddingStudent(true);

    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch("/api/teacher/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newStudent,
          teacherId: user?.id,
          parents: validParents.map(p => ({
            name: p.name,
            relationship: p.relationship,
            phone: p.phone,
          })),
        }),
      });

      if (response.ok) {
        toast.success("学员添加成功");
        setShowAddDialog(false);
        resetForm();
        fetchStudents();
      } else {
        const data = await response.json();
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加学员失败:", error);
      toast.error("添加学员失败");
    } finally {
      setIsAddingStudent(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setNewStudent({
      name: "",
      gender: "male",
      birthDate: "",
      phone: "",
      classId: "",
      note: "",
    });
    setParents([{ name: "", relationship: "father", phone: "" }]);
  };

  // 过滤学员
  const filteredStudents = students.filter(
    (student) =>
      student.name.includes(searchQuery) ||
      student.phone?.includes(searchQuery)
  );

  // 计算年龄
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 关系映射
  const relationshipOptions = [
    { value: "father", label: "父亲" },
    { value: "mother", label: "母亲" },
    { value: "grandfather", label: "爷爷" },
    { value: "grandmother", label: "奶奶" },
    { value: "other", label: "其他" },
  ];

  const getRelationshipLabel = (value: string) => {
    return relationshipOptions.find(o => o.value === value)?.label || "其他";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索学员姓名或电话..."
            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加学员
        </Button>
      </div>

      {/* 学员列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 bg-slate-900/50 border-white/10 text-center">
          <User className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">暂无学员</p>
          <p className="text-sm text-slate-500">
            {searchQuery ? "未找到匹配的学员" : "点击上方按钮添加学员"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredStudents.map((student) => {
            const age = calculateAge(student.birthDate);
            const hasRegisteredFace = (student._count?.studentFaces || 0) > 0;
            const mediaCount = student._count?.medias || 0;

            return (
              <Card
                key={student.id}
                className="p-4 bg-slate-900/50 border-white/10 hover:bg-slate-800/50 transition-all cursor-pointer"
                onClick={() => router.push(`/teacher/students/${student.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* 头像 */}
                  <div className="relative">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    {hasRegisteredFace && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">
                        {student.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {student.gender === "male" ? "男" : "女"}
                      </span>
                      {age && (
                        <span className="text-xs text-slate-400">{age}岁</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      {student.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {student.phone}
                        </span>
                      )}
                      {student.class && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {student.class.name}
                        </span>
                      )}
                      {mediaCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {mediaCount}张照片
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 箭头 */}
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加学员对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              添加学员
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 pt-4">
            {/* 学生基本信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <User className="w-4 h-4" />
                学生基本信息
              </h3>
              
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  姓名 <span className="text-red-400">*</span>
                </label>
                <Input
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  placeholder="请输入学员姓名"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">性别</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newStudent.gender === "male" ? "default" : "outline"}
                    className={`flex-1 ${
                      newStudent.gender === "male"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-slate-800 border-white/10 text-slate-400"
                    }`}
                    onClick={() =>
                      setNewStudent({ ...newStudent, gender: "male" })
                    }
                  >
                    男
                  </Button>
                  <Button
                    type="button"
                    variant={newStudent.gender === "female" ? "default" : "outline"}
                    className={`flex-1 ${
                      newStudent.gender === "female"
                        ? "bg-pink-500 hover:bg-pink-600"
                        : "bg-slate-800 border-white/10 text-slate-400"
                    }`}
                    onClick={() =>
                      setNewStudent({ ...newStudent, gender: "female" })
                    }
                  >
                    女
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  出生日期
                </label>
                <Input
                  type="date"
                  value={newStudent.birthDate}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, birthDate: e.target.value })
                  }
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  分配班级
                </label>
                <select
                  value={newStudent.classId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, classId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md bg-slate-800 border border-white/10 text-white"
                >
                  <option value="">请选择班级</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">
                  备注
                </label>
                <Input
                  value={newStudent.note}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, note: e.target.value })
                  }
                  placeholder="备注信息"
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>

            {/* 家长信息 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  家长信息
                  <span className="text-xs text-slate-500">（至少填写一个）</span>
                </h3>
                {parents.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParent}
                    className="h-7 text-xs bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加家长
                  </Button>
                )}
              </div>

              {parents.map((parent, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-slate-800/50 border border-white/5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      家长 {index + 1} {index === 0 && <span className="text-red-400">*</span>}
                    </span>
                    {parents.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParent(index)}
                        className="h-6 w-6 p-0 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">姓名</label>
                      <Input
                        value={parent.name}
                        onChange={(e) => updateParent(index, "name", e.target.value)}
                        placeholder="家长姓名"
                        className="h-9 bg-slate-800 border-white/10 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">关系</label>
                      <Select
                        value={parent.relationship}
                        onValueChange={(value) => updateParent(index, "relationship", value)}
                      >
                        <SelectTrigger className="h-9 bg-slate-800 border-white/10 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          {relationshipOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-white hover:bg-slate-700"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      手机号 <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={parent.phone}
                      onChange={(e) => updateParent(index, "phone", e.target.value)}
                      placeholder="用于家长绑定验证"
                      className="h-9 bg-slate-800 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 bg-slate-800 border-white/10 text-slate-400 hover:text-white"
                onClick={() => setShowAddDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleAddStudent}
                disabled={isAddingStudent}
              >
                {isAddingStudent ? "添加中..." : "确认添加"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
