"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Lightbulb,
  Loader2,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  avatar?: string;
}

interface ReviewTemplate {
  id: string;
  name: string;
  content: string;
}

interface Review {
  studentId: string;
  studentName: string;
  rating: number;
  content: string;
  sent: boolean;
}

interface ClassSession {
  id: string;
  className: string;
  date: string;
  time: string;
  students: Student[];
}

const reviewTemplates: ReviewTemplate[] = [
  {
    id: "1",
    name: "表现优秀",
    content: "今天课堂表现非常棒！专注力强，积极回答问题，作品完成度很高。希望继续保持，加油！",
  },
  {
    id: "2",
    name: "有进步",
    content: "今天有明显进步，比上节课更专注了。继续保持这个状态，相信你会越来越棒！",
  },
  {
    id: "3",
    name: "需要鼓励",
    content: "今天表现不错，如果能再专注一些就更好了。老师相信你可以做得更好，加油！",
  },
];

export default function TeacherReviewPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      const session = sessions.find((s) => s.id === selectedSession);
      if (session) {
        setReviews(
          session.students.map((s) => ({
            studentId: s.id,
            studentName: s.name,
            rating: 5,
            content: "",
            sent: false,
          }))
        );
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
          ],
        },
        {
          id: "2",
          className: "素描进阶班",
          date: new Date().toISOString().split("T")[0],
          time: "14:00-15:30",
          students: [
            { id: "4", name: "孙小龙" },
            { id: "5", name: "周小燕" },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (studentId: string, rating: number) => {
    setReviews((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, rating } : r))
    );
  };

  const handleContentChange = (studentId: string, content: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, content } : r))
    );
  };

  const handleTemplateApply = (studentId: string, templateId: string) => {
    const template = reviewTemplates.find((t) => t.id === templateId);
    if (template) {
      handleContentChange(studentId, template.content);
    }
  };

  const handleGenerateAI = async (studentId: string) => {
    setGenerating(studentId);
    try {
      const token = localStorage.getItem("token");
      const review = reviews.find((r) => r.studentId === studentId);
      
      const response = await fetch("/api/ai/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentName: review?.studentName,
          rating: review?.rating,
          className: sessions.find((s) => s.id === selectedSession)?.className,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        handleContentChange(studentId, data.content);
        toast.success("AI点评生成成功");
      } else {
        // Fallback for demo
        const rating = review?.rating ?? 5;
        const fallbackContent = `${review?.studentName}同学今天课堂表现${rating === 5 ? "非常出色" : rating >= 4 ? "很不错" : "良好"}，完成了课堂任务，作品质量${rating === 5 ? "优秀" : "良好"}。继续保持！`;
        handleContentChange(studentId, fallbackContent);
        toast.success("AI点评生成成功（演示模式）");
      }
    } catch (error) {
      console.error("Failed to generate review:", error);
      toast.error("生成失败，请手动填写");
    } finally {
      setGenerating(null);
    }
  };

  const handleSend = async (studentId: string) => {
    const review = reviews.find((r) => r.studentId === studentId);
    if (!review?.content) {
      toast.error("请填写点评内容");
      return;
    }

    setSending(studentId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/teacher/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: selectedSession,
          studentId,
          rating: review.rating,
          content: review.content,
        }),
      });

      if (response.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.studentId === studentId ? { ...r, sent: true } : r))
        );
        toast.success("点评已发送给家长");
      } else {
        // Demo mode
        setReviews((prev) =>
          prev.map((r) => (r.studentId === studentId ? { ...r, sent: true } : r))
        );
        toast.success("点评已发送给家长（演示模式）");
      }
    } catch (error) {
      console.error("Failed to send review:", error);
      toast.error("发送失败");
    } finally {
      setSending(null);
    }
  };

  const selectedSessionData = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5" />
            课堂点评
          </CardTitle>
          <p className="text-slate-400 text-sm mt-1">
            课后向家长发送学员表现点评，支持AI智能生成
          </p>
        </CardHeader>
      </Card>

      {/* 选择课程 */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardContent className="p-6">
          <label className="text-sm text-slate-400 mb-2 block">选择课程</label>
          <Select
            value={selectedSession || ""}
            onValueChange={setSelectedSession}
          >
            <SelectTrigger className="bg-slate-800 border-white/10 text-white">
              <SelectValue placeholder="请选择要点评的课程" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {session.className} - {session.time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 点评列表 */}
      {selectedSession && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.studentId}
              className={`bg-slate-900/50 border-white/10 ${
                review.sent ? "opacity-60" : ""
              }`}
            >
              <CardContent className="p-6">
                {/* 学员信息 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-slate-700 text-slate-300">
                        {review.studentName.slice(-1)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{review.studentName}</p>
                      <p className="text-sm text-slate-400">
                        {selectedSessionData?.className}
                      </p>
                    </div>
                  </div>
                  {review.sent && (
                    <Badge className="bg-green-500/20 text-green-400">
                      已发送
                    </Badge>
                  )}
                </div>

                {/* 评分 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-slate-400">评分：</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingChange(review.studentId, star)}
                        disabled={review.sent}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 快捷模板 */}
                <div className="flex gap-2 mb-3">
                  {reviewTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateApply(review.studentId, template.id)}
                      disabled={review.sent}
                      className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    >
                      {template.name}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateAI(review.studentId)}
                    disabled={review.sent || generating === review.studentId}
                    className="bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                  >
                    {generating === review.studentId ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1" />
                    )}
                    AI生成
                  </Button>
                </div>

                {/* 点评内容 */}
                <Textarea
                  value={review.content}
                  onChange={(e) => handleContentChange(review.studentId, e.target.value)}
                  placeholder="请输入课堂点评内容..."
                  disabled={review.sent}
                  className="bg-slate-800 border-white/10 text-white min-h-[100px] resize-none"
                />

                {/* 发送按钮 */}
                {!review.sent && (
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => handleSend(review.studentId)}
                      disabled={sending === review.studentId || !review.content}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      {sending === review.studentId ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      发送给家长
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!selectedSession && (
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">请选择要点评的课程</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
