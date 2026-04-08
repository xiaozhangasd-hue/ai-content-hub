"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  Users,
  Clock,
  Phone,
  MessageSquare,
  Bell,
  CheckCircle,
  Filter,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AlertStudent {
  student: {
    id: string;
    name: string;
    phone: string;
    guardianName: string | null;
    guardianPhone: string | null;
  };
  enrollments: Array<{
    id: string;
    classId: string;
    className: string;
    teacherName: string | null;
    remainingHours: number;
    totalHours: number;
  }>;
  totalRemaining: number;
}

interface AlertData {
  alerts: AlertStudent[];
  summary: {
    total: number;
    critical: number;
    warning: number;
  };
  threshold: number;
}

export default function HoursAlertPage() {
  const router = useRouter();
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState("5");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [isRemindDialogOpen, setIsRemindDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchAlerts();
  }, [router, threshold]);

  const fetchAlerts = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await fetch(`/api/education/hours-alert?threshold=${threshold}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAlertData(data);
      }
    } catch (error) {
      toast.error("获取预警数据失败");
    } finally {
      setIsLoading(false);
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
    if (!alertData) return;
    
    if (selectedStudents.size === alertData.alerts.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(alertData.alerts.map(a => a.student.id)));
    }
  };

  const handleSendReminder = async () => {
    if (selectedStudents.size === 0) {
      toast.info("请先选择学员");
      return;
    }

    const token = localStorage.getItem("token");
    setIsSending(true);

    try {
      const response = await fetch("/api/education/hours-alert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedStudents(new Set());
        setIsRemindDialogOpen(false);
      }
    } catch (error) {
      toast.error("发送提醒失败");
    } finally {
      setIsSending(false);
    }
  };

  const getAlertLevel = (remaining: number) => {
    if (remaining <= 2) return { label: "紧急", color: "bg-red-100 text-red-700 border-red-200" };
    if (remaining <= 5) return { label: "预警", color: "bg-orange-100 text-orange-700 border-orange-200" };
    return { label: "注意", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/30">
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
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-7 h-7 text-orange-500" />
                课时预警
              </h1>
              <p className="text-gray-500 mt-1">监控学员课时余额，及时提醒续费</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger className="w-36 bg-white text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">≤2课时</SelectItem>
                <SelectItem value="3">≤3课时</SelectItem>
                <SelectItem value="5">≤5课时</SelectItem>
                <SelectItem value="10">≤10课时</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAlerts}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">预警学员</p>
                  <p className="text-3xl font-bold mt-1 text-orange-500">{alertData?.summary.total || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-100 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">紧急（≤2课时）</p>
                  <p className="text-3xl font-bold mt-1 text-red-600">{alertData?.summary.critical || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-100 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">预警（3-5课时）</p>
                  <p className="text-3xl font-bold mt-1 text-yellow-600">{alertData?.summary.warning || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作栏 */}
        {alertData && alertData.alerts.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedStudents.size === alertData.alerts.length ? "取消全选" : "全选"}
                  </Button>
                  {selectedStudents.size > 0 && (
                    <span className="text-sm text-gray-500">
                      已选择 {selectedStudents.size} 人
                    </span>
                  )}
                </div>
                <Button 
                  onClick={() => setIsRemindDialogOpen(true)}
                  disabled={selectedStudents.size === 0}
                  className="bg-gradient-to-r from-orange-500 to-amber-500"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  发送提醒
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 预警列表 */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">预警学员列表</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
              </div>
            ) : !alertData || alertData.alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-300" />
                <p>暂无课时预警学员</p>
              </div>
            ) : (
              <div className="divide-y">
                {alertData.alerts.map((alert) => {
                  const level = getAlertLevel(alert.totalRemaining);
                  const isSelected = selectedStudents.has(alert.student.id);
                  
                  return (
                    <div 
                      key={alert.student.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${isSelected ? "bg-orange-50" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* 选择框 */}
                        <button
                          onClick={() => toggleStudentSelection(alert.student.id)}
                          className="mt-1 p-1 rounded border border-gray-300 hover:border-orange-400"
                        >
                          {isSelected ? (
                            <CheckCircle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                        </button>

                        {/* 学员信息 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg">{alert.student.name}</span>
                            <Badge className={level.color}>{level.label}</Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {alert.student.phone}
                            </div>
                            {alert.student.guardianName && (
                              <div>
                                家长：{alert.student.guardianName}
                                {alert.student.guardianPhone && ` (${alert.student.guardianPhone})`}
                              </div>
                            )}
                          </div>

                          {/* 课程详情 */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {alert.enrollments.map((enrollment) => (
                              <div 
                                key={enrollment.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                              >
                                <span className="font-medium">{enrollment.className}</span>
                                <span className="text-gray-400">|</span>
                                <span className={`font-bold ${
                                  enrollment.remainingHours <= 2 ? "text-red-500" : "text-orange-500"
                                }`}>
                                  剩 {enrollment.remainingHours} 课时
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 剩余课时 */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-500">
                            {alert.totalRemaining}
                          </div>
                          <div className="text-xs text-gray-500">剩余课时</div>
                        </div>

                        {/* 操作 */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/education/students/${alert.student.id}`)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 发送提醒弹窗 */}
      <Dialog open={isRemindDialogOpen} onOpenChange={setIsRemindDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>发送续费提醒</DialogTitle>
            <DialogDescription>
              将向 {selectedStudents.size} 名学员发送续费提醒
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              系统将通过以下方式提醒家长：
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span>微信模板消息（需对接微信公众号）</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>短信通知（需对接短信服务）</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * 当前为演示模式，实际通知需配置相关服务
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemindDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSendReminder} disabled={isSending}>
              {isSending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
