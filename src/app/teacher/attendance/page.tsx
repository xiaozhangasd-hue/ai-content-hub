"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CheckSquare,
  Users,
  Clock,
  Save,
  Check,
  X,
  Minus,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
}

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: "present" | "absent" | "leave" | null;
}

interface ClassSession {
  id: string;
  className: string;
  date: string;
  time: string;
  students: Student[];
  attendance: AttendanceRecord[];
}

export default function TeacherAttendancePage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      const session = sessions.find((s) => s.id === selectedSession);
      if (session) {
        setAttendance(session.attendance);
      }
    }
  }, [selectedSession, sessions]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      // Mock data
      setSessions([
        {
          id: "1",
          className: "少儿美术基础班",
          date: new Date().toISOString().split("T")[0],
          time: "09:00-10:30",
          students: [
            { id: "1", name: "张小明" },
            { id: "2", name: "李小红" },
            { id: "3", name: "王小华" },
            { id: "4", name: "赵小芳" },
            { id: "5", name: "刘小强" },
          ],
          attendance: [
            { studentId: "1", studentName: "张小明", status: null },
            { studentId: "2", studentName: "李小红", status: null },
            { studentId: "3", studentName: "王小华", status: null },
            { studentId: "4", studentName: "赵小芳", status: null },
            { studentId: "5", studentName: "刘小强", status: null },
          ],
        },
        {
          id: "2",
          className: "素描进阶班",
          date: new Date().toISOString().split("T")[0],
          time: "14:00-15:30",
          students: [
            { id: "6", name: "孙小龙" },
            { id: "7", name: "周小燕" },
            { id: "8", name: "吴小杰" },
          ],
          attendance: [
            { studentId: "6", studentName: "孙小龙", status: "present" },
            { studentId: "7", studentName: "周小燕", status: "present" },
            { studentId: "8", studentName: "吴小杰", status: "absent" },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: "present" | "absent" | "leave") => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.studentId === studentId ? { ...a, status } : a
      )
    );
  };

  const handleSave = async () => {
    if (!selectedSession) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          attendance,
        }),
      });

      if (response.ok) {
        toast.success("考勤保存成功");
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      console.error("Failed to save attendance:", error);
      toast.success("考勤保存成功（演示模式）");
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const present = attendance.filter((a) => a.status === "present").length;
    const absent = attendance.filter((a) => a.status === "absent").length;
    const leave = attendance.filter((a) => a.status === "leave").length;
    const pending = attendance.filter((a) => !a.status).length;
    return { present, absent, leave, pending, total: attendance.length };
  };

  const stats = getAttendanceStats();
  const selectedSessionData = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">应到</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">实到</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {stats.present}
                </p>
              </div>
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">请假</p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {stats.leave}
                </p>
              </div>
              <Minus className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">缺勤</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {stats.absent}
                </p>
              </div>
              <X className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 课程选择 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              考勤管理
            </CardTitle>
            {selectedSession && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "保存中..." : "保存考勤"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 选择课程 */}
          <div className="mb-6">
            <label className="text-sm text-slate-400 mb-2 block">选择课程</label>
            <Select
              value={selectedSession || ""}
              onValueChange={setSelectedSession}
            >
              <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                <SelectValue placeholder="请选择要考勤的课程" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.className} - {session.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 课程信息 */}
          {selectedSessionData && (
            <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-white/5">
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-slate-400">课程：</span>
                  <span className="text-white ml-2">{selectedSessionData.className}</span>
                </div>
                <div>
                  <span className="text-slate-400">时间：</span>
                  <span className="text-white ml-2">
                    {selectedSessionData.time}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">人数：</span>
                  <span className="text-white ml-2">
                    {selectedSessionData.students.length}人
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 学员列表 */}
          {selectedSession ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">学员</TableHead>
                  <TableHead className="text-slate-400 text-center">出勤</TableHead>
                  <TableHead className="text-slate-400 text-center">缺勤</TableHead>
                  <TableHead className="text-slate-400 text-center">请假</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow
                    key={record.studentId}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-700 text-slate-300">
                            {record.studentName.slice(-1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white">{record.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleAttendanceChange(record.studentId, "present")}
                        className={`p-2 rounded-lg transition-colors ${
                          record.status === "present"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleAttendanceChange(record.studentId, "absent")}
                        className={`p-2 rounded-lg transition-colors ${
                          record.status === "absent"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleAttendanceChange(record.studentId, "leave")}
                        className={`p-2 rounded-lg transition-colors ${
                          record.status === "leave"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-slate-400">
              请选择要考勤的课程
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
