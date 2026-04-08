"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Star,
  Send,
  Clock,
  Users,
  MessageSquare,
  Image,
  ChevronRight,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ClassInfo {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string | null;
}

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  class: { id: string; name: string };
  _count: { feedbacks: number; attendances: number };
}

interface Feedback {
  id: string;
  content: string;
  ratings: Record<string, number> | null;
  tags: string[] | null;
  images: string[] | null;
  createdAt: string;
  liked: boolean;
  student: { id: string; name: string; avatar: string | null };
}

const ratingDimensions = [
  { key: "focus", label: "专注力", icon: "🎯" },
  { key: "creativity", label: "创造力", icon: "💡" },
  { key: "expression", label: "表达能力", icon: "🗣️" },
  { key: "cooperation", label: "团队协作", icon: "🤝" },
  { key: "progress", label: "学习进步", icon: "📈" },
];

const tagOptions = [
  "认真听讲", "积极发言", "思维活跃", "作品优秀", "进步明显",
  "专注力强", "乐于助人", "有创意", "需要加强", "继续保持"
];

export default function TeacherFeedbackPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 新点评表单
  const [newFeedback, setNewFeedback] = useState({
    studentId: "",
    content: "",
    ratings: {} as Record<string, number>,
    tags: [] as string[],
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchLessons(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedLesson) {
      fetchStudentsAndFeedbacks(selectedLesson.id);
    }
  }, [selectedLesson]);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch(
        `/api/teacher/classes?teacherId=${user?.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLessons = async (classId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/education/lessons?classId=${classId}&status=completed`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error("获取课程列表失败:", error);
    }
  };

  const fetchStudentsAndFeedbacks = async (lessonId: string) => {
    try {
      const token = localStorage.getItem("token");
      
      // 获取课程的学生
      const studentsRes = await fetch(
        `/api/education/lessons/${lessonId}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data.students || []);
      }

      // 获取已有点评
      const feedbacksRes = await fetch(
        `/api/education/feedbacks?lessonId=${lessonId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (feedbacksRes.ok) {
        const data = await feedbacksRes.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
    }
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.studentId) {
      toast.error("请选择学生");
      return;
    }
    if (!newFeedback.content.trim()) {
      toast.error("请填写点评内容");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const response = await fetch("/api/education/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLesson?.id,
          studentId: newFeedback.studentId,
          teacherId: user?.id,
          content: newFeedback.content,
          ratings: newFeedback.ratings,
          tags: newFeedback.tags,
        }),
      });

      if (response.ok) {
        toast.success("点评成功");
        setShowAddDialog(false);
        setNewFeedback({
          studentId: "",
          content: "",
          ratings: {},
          tags: [],
        });
        fetchStudentsAndFeedbacks(selectedLesson!.id);
      } else {
        const data = await response.json();
        toast.error(data.error || "点评失败");
      }
    } catch (error) {
      console.error("点评失败:", error);
      toast.error("点评失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = [...newFeedback.tags];
    if (newTags.includes(tag)) {
      const index = newTags.indexOf(tag);
      newTags.splice(index, 1);
    } else {
      newTags.push(tag);
    }
    setNewFeedback({ ...newFeedback, tags: newTags });
  };

  const setRating = (dimension: string, value: number) => {
    setNewFeedback({
      ...newFeedback,
      ratings: { ...newFeedback.ratings, [dimension]: value },
    });
  };

  const getFeedbackForStudent = (studentId: string) => {
    return feedbacks.find((f) => f.student.id === studentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课堂点评</h1>
          <p className="text-muted-foreground">为学生填写课堂表现点评</p>
        </div>
      </div>

      {/* 选择班级和课程 */}
      <div className="flex gap-4">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="选择班级" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 课程列表 */}
      {selectedClass && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">历史课程</h2>
          {lessons.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              暂无已完成的课程
            </Card>
          ) : (
            <div className="grid gap-3">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedLesson?.id === lesson.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "hover:border-blue-500/50"
                  }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(lesson.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lesson.startTime} - {lesson.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {lesson._count.attendances} 人
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {lesson._count.feedbacks} 点评
                      </span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 学生点评列表 */}
      {selectedLesson && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">学生点评</h2>
            <Button onClick={() => setShowAddDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              添加点评
            </Button>
          </div>

          <div className="grid gap-3">
            {students.map((student) => {
              const feedback = getFeedbackForStudent(student.id);
              return (
                <Card key={student.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {student.name[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{student.name}</span>
                        {feedback ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            已点评
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                            未点评
                          </Badge>
                        )}
                      </div>
                      {feedback ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {feedback.content}
                          </p>
                          {feedback.ratings && (
                            <div className="flex gap-4">
                              {Object.entries(feedback.ratings).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {ratingDimensions.find(d => d.key === key)?.label}:
                                  </span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= value
                                            ? "fill-yellow-500 text-yellow-500"
                                            : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {feedback.tags && feedback.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {feedback.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          还未填写点评
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 添加点评对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加课堂点评</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                选择学生 <span className="text-red-400">*</span>
              </label>
              <Select
                value={newFeedback.studentId}
                onValueChange={(value) =>
                  setNewFeedback({ ...newFeedback, studentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择学生" />
                </SelectTrigger>
                <SelectContent>
                  {students
                    .filter(
                      (s) => !getFeedbackForStudent(s.id)
                    )
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                评分维度
              </label>
              <div className="space-y-3">
                {ratingDimensions.map((dim) => (
                  <div
                    key={dim.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {dim.icon} {dim.label}
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(dim.key, star)}
                          className="p-0.5"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= (newFeedback.ratings[dim.key] || 0)
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      newFeedback.tags.includes(tag)
                        ? "bg-blue-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                点评内容 <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={newFeedback.content}
                onChange={(e) =>
                  setNewFeedback({ ...newFeedback, content: e.target.value })
                }
                placeholder="请详细描述学生的课堂表现..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddFeedback}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    提交点评
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
