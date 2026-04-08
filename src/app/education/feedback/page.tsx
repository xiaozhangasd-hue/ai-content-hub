"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  Plus,
  Star,
  Image as ImageIcon,
  ThumbsUp,
  Clock,
  Users,
  ChevronLeft,
} from "lucide-react";

interface Lesson {
  id: string;
  date: string;
  startTime: string;
  class: { id: string; name: string };
  attendances: {
    student: { id: string; name: string };
    status: string;
  }[];
}

interface Feedback {
  id: string;
  content: string;
  images?: string;
  ratings?: string;
  tags?: string;
  liked: boolean;
  createdAt: string;
  lesson: { date: string; class: { name: string } };
  student: { id: string; name: string };
  teacher: { id: string; name: string };
}

const ratingDimensions = [
  { key: "focus", label: "专注力" },
  { key: "creativity", label: "创造力" },
  { key: "skill", label: "动手能力" },
  { key: "expression", label: "表达能力" },
  { key: "cooperation", label: "协作能力" },
];

const quickTags = [
  "认真听讲", "积极发言", "思维活跃", "有创意", "进步明显",
  "需要鼓励", "细心观察", "独立完成", "乐于分享", "专注投入",
];

export default function FeedbackPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    content: "",
    images: [] as string[],
    ratings: {} as Record<string, number>,
    tags: [] as string[],
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      // 获取近期的课程（已完成或有出勤的）
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [lessonsRes, feedbacksRes] = await Promise.all([
        fetch(
          `/api/education/lessons?startDate=${weekAgo.toISOString()}&endDate=${today.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        fetch("/api/education/feedbacks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [lessonsData, feedbacksData] = await Promise.all([
        lessonsRes.json(),
        feedbacksRes.json(),
      ]);

      if (lessonsData.success) {
        // 过滤出有出勤学员的课程
        const validLessons = lessonsData.lessons.filter(
          (l: Lesson) => l.attendances.some((a) => a.status === "present")
        );
        setLessons(validLessons);
      }
      if (feedbacksData.success) {
        setFeedbacks(feedbacksData.feedbacks);
      }
    } catch (error) {
      toast.error("获取数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const presentStudents = selectedLesson?.attendances.filter((a) => a.status === "present") || [];

  const handleRatingChange = (dimension: string, value: number) => {
    setFeedbackForm({
      ...feedbackForm,
      ratings: { ...feedbackForm.ratings, [dimension]: value },
    });
  };

  const handleTagToggle = (tag: string) => {
    const tags = feedbackForm.tags.includes(tag)
      ? feedbackForm.tags.filter((t) => t !== tag)
      : [...feedbackForm.tags, tag];
    setFeedbackForm({ ...feedbackForm, tags });
  };

  const handleSubmitFeedback = async () => {
    if (!selectedLessonId || !selectedStudentId || !feedbackForm.content) {
      toast.error("请填写完整信息");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("/api/education/feedbacks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          studentId: selectedStudentId,
          teacherId: "current", // 实际应从登录信息获取
          content: feedbackForm.content,
          images: feedbackForm.images,
          ratings: feedbackForm.ratings,
          tags: feedbackForm.tags,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("点评已发送");
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(data.error || "发送失败");
      }
    } catch (error) {
      toast.error("发送失败");
    }
  };

  const resetForm = () => {
    setFeedbackForm({
      content: "",
      images: [],
      ratings: {},
      tags: [],
    });
    setSelectedStudentId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
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
              <h1 className="text-2xl font-bold text-gray-900">课堂点评</h1>
              <p className="text-gray-500 mt-1">记录学员课堂表现，促进家校沟通</p>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "create", label: "发起点评" },
            { key: "history", label: "点评记录" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "create" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 选择课程 */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-500" />
                  选择课程
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {lessons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无可点评的课程</p>
                    <p className="text-sm mt-2">请先完成学员考勤</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson) => {
                      const isSelected = selectedLessonId === lesson.id;
                      const feedbackedStudents = feedbacks.filter(
                        (f) => f.lesson.date.split("T")[0] === lesson.date.split("T")[0]
                      ).length;
                      const totalStudents = lesson.attendances.filter(
                        (a) => a.status === "present"
                      ).length;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => {
                            setSelectedLessonId(lesson.id);
                            setSelectedStudentId("");
                          }}
                          className={`p-4 rounded-lg cursor-pointer border transition-all ${
                            isSelected
                              ? "bg-purple-50 border-purple-300"
                              : "bg-gray-50 border-transparent hover:border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{lesson.class.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {feedbackedStudents}/{totalStudents} 已点评
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(lesson.date).toLocaleDateString()} · {lesson.startTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 选择学员并发起点评 */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  选择学员
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedLesson ? (
                  <div className="text-center py-8 text-gray-500">
                    请先选择左侧课程
                  </div>
                ) : (
                  <div className="space-y-2">
                    {presentStudents.map((attendance) => {
                      const hasFeedback = feedbacks.some(
                        (f) =>
                          f.student.id === attendance.student.id &&
                          f.lesson.date.split("T")[0] === selectedLesson.date.split("T")[0]
                      );

                      return (
                        <div
                          key={attendance.student.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-medium">{attendance.student.name}</span>
                          {hasFeedback ? (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              已点评
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedStudentId(attendance.student.id);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              点评
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">点评记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium">{feedback.student.name}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-sm text-gray-500">
                          {feedback.lesson.class.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        {feedback.liked && <ThumbsUp className="w-4 h-4 text-pink-500" />}
                        <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{feedback.content}</p>
                    {feedback.tags && (
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(feedback.tags).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 点评弹窗 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>填写课堂点评</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* 多维度评分 */}
              <div className="space-y-2">
                <Label>能力评分</Label>
                <div className="grid grid-cols-2 gap-3">
                  {ratingDimensions.map((dim) => (
                    <div key={dim.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{dim.label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(dim.key, star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                (feedbackForm.ratings[dim.key] || 0) >= star
                                  ? "text-yellow-400 fill-yellow-400"
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

              {/* 快捷标签 */}
              <div className="space-y-2">
                <Label>快捷标签</Label>
                <div className="flex flex-wrap gap-2">
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        feedbackForm.tags.includes(tag)
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 点评内容 */}
              <div className="space-y-2">
                <Label>点评内容 *</Label>
                <Textarea
                  value={feedbackForm.content}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, content: e.target.value })
                  }
                  placeholder="描述学员在课堂上的表现..."
                  rows={4}
                />
              </div>

              {/* 添加图片 */}
              <div className="space-y-2">
                <Label>添加图片</Label>
                <Button variant="outline" className="w-full h-20 border-dashed">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  点击上传图片
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmitFeedback}>发送点评</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
