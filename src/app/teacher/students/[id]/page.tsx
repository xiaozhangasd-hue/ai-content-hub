"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  Camera,
  Video,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckCircle,
  X,
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
  campusId?: string | null;
  class?: {
    id: string;
    name: string;
    merchantId?: string;
    campusId?: string | null;
  };
  _count?: {
    medias: number;
    faces: number;
  };
}

interface Media {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  recordDate: string;
  faceDetected: boolean;
  faceCount: number;
}

export default function TeacherStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [medias, setMedias] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudent();
    fetchMedias();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/teacher/students/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
      } else {
        toast.error("学员不存在");
        router.back();
      }
    } catch (error) {
      console.error("获取学员信息失败:", error);
      toast.error("获取学员信息失败");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedias = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/media?studentId=${studentId}&pageSize=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMedias(data.data || []);
      }
    } catch (error) {
      console.error("获取媒体列表失败:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const totalFiles = files.length;
    let uploadedCount = 0;

    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      for (const file of Array.from(files)) {
        // 检查文件类型
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(`${file.name} 不是支持的图片或视频格式`);
          continue;
        }

        // 检查文件大小（最大100MB）
        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} 超过100MB限制`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("merchantId", student?.class?.merchantId || localStorage.getItem("merchantId") || "");
        formData.append("campusId", student?.class?.campusId || student?.campusId || "");
        formData.append("studentId", studentId);
        formData.append("teacherId", user?.id || "");

        const response = await fetch("/api/media/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } else {
          const data = await response.json();
          toast.error(`${file.name} 上传失败: ${data.error}`);
        }
      }

      if (uploadedCount > 0) {
        toast.success(`成功上传 ${uploadedCount} 个文件`);
        fetchMedias();
      }
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("确定要删除这个文件吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/media?mediaId=${mediaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("删除成功");
        setMedias(medias.filter((m) => m.id !== mediaId));
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">学员不存在</p>
      </div>
    );
  }

  const age = calculateAge(student.birthDate);
  const hasRegisteredFace = (student._count?.faces || 0) > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回学员列表
      </button>

      {/* 学员信息卡片 */}
      <Card className="p-6 bg-slate-900/50 border-white/10">
        <div className="flex items-start gap-6">
          {/* 头像 */}
          <div className="relative">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            {hasRegisteredFace && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center border-2 border-slate-900">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* 基本信息 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{student.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                {student.gender === "male" ? "男" : "女"}
              </span>
              {age && (
                <span className="text-slate-400 text-sm">{age}岁</span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
              {student.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  {student.phone}
                </span>
              )}
              {student.class && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {student.class.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">
                  {medias.length} 张照片/视频
                </span>
              </div>
              {hasRegisteredFace ? (
                <span className="flex items-center gap-1.5 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  已注册人脸
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Camera className="w-4 h-4" />
                  未注册人脸
                </span>
              )}
            </div>
          </div>

          {/* 上传按钮 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  上传中 {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  上传照片/视频
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 媒体列表 */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          照片和视频
        </h2>

        {medias.length === 0 ? (
          <Card className="p-12 bg-slate-900/50 border-white/10 text-center">
            <Camera className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400 mb-2">暂无照片或视频</p>
            <p className="text-sm text-slate-500">点击上方按钮上传学员照片</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {medias.map((media) => (
              <Card
                key={media.id}
                className="group relative overflow-hidden bg-slate-900/50 border-white/10"
              >
                {/* 预览图 */}
                <div className="aspect-square relative">
                  {media.type === "photo" ? (
                    <img
                      src={media.previewUrl}
                      alt={media.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <Video className="w-12 h-12 text-slate-600" />
                    </div>
                  )}

                  {/* 类型标识 */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-xs text-white flex items-center gap-1">
                    {media.type === "photo" ? (
                      <Camera className="w-3 h-3" />
                    ) : (
                      <Video className="w-3 h-3" />
                    )}
                    {media.type === "photo" ? "照片" : "视频"}
                  </div>

                  {/* 人脸检测标识 */}
                  {media.faceDetected && media.faceCount > 0 && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500/80 text-xs text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {media.faceCount}张脸
                    </div>
                  )}

                  {/* 删除按钮 */}
                  <button
                    onClick={() => handleDeleteMedia(media.id)}
                    className="absolute bottom-2 right-2 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 文件信息 */}
                <div className="p-3">
                  <p className="text-sm text-slate-300 truncate">
                    {media.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(media.fileSize)} · {new Date(media.recordDate).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
