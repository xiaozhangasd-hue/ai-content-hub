"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Camera,
  Video,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  Trash2,
  Filter,
  Grid,
  List,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface Media {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  previewUrl: string;
  recordDate: string;
  faceDetected: boolean;
  faceCount: number;
  student?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export default function TeacherMediaPage() {
  const router = useRouter();
  const [medias, setMedias] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState<"all" | "photo" | "video">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedias();
  }, []);

  const fetchMedias = async () => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      // 获取老师所属商家
      const teacherRes = await fetch(`/api/teacher/profile?id=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!teacherRes.ok) {
        throw new Error("获取教师信息失败");
      }

      const teacherData = await teacherRes.json();
      const merchantId = teacherData.teacher?.merchantId;

      if (!merchantId) {
        throw new Error("无法获取商家信息");
      }

      const response = await fetch(
        `/api/media?merchantId=${merchantId}&teacherId=${user?.id}&pageSize=100`,
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
      toast.error("获取媒体列表失败");
    } finally {
      setIsLoading(false);
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

      // 获取老师所属商家
      const teacherRes = await fetch(`/api/teacher/profile?id=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const teacherData = await teacherRes.json();
      const merchantId = teacherData.teacher?.merchantId;
      const campusId = teacherData.teacher?.campusId;

      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(`${file.name} 不是支持的格式`);
          continue;
        }

        if (file.size > 100 * 1024 * 1024) {
          toast.error(`${file.name} 超过100MB限制`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("merchantId", merchantId);
        if (campusId) formData.append("campusId", campusId);
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

  // 过滤媒体
  const filteredMedias = medias.filter(
    (media) => filterType === "all" || media.type === filterType
  );

  // 统计
  const photoCount = medias.filter((m) => m.type === "photo").length;
  const videoCount = medias.filter((m) => m.type === "video").length;
  const linkedCount = medias.filter((m) => m.student).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">媒体素材</h2>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Camera className="w-4 h-4" />
              {photoCount} 张照片
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              {videoCount} 个视频
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 过滤器 */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/50 border border-white/10">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                filterType === "all"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType("photo")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                filterType === "photo"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              照片
            </button>
            <button
              onClick={() => setFilterType("video")}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                filterType === "video"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              视频
            </button>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/50 border border-white/10">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
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
                  上传
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 媒体列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredMedias.length === 0 ? (
        <Card className="p-12 bg-slate-900/50 border-white/10 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 mb-2">暂无媒体素材</p>
          <p className="text-sm text-slate-500">点击上方按钮上传照片或视频</p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedias.map((media) => (
            <Card
              key={media.id}
              className="group relative overflow-hidden bg-slate-900/50 border-white/10 cursor-pointer"
              onClick={() => {
                if (media.student) {
                  router.push(`/teacher/students/${media.student.id}`);
                }
              }}
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

                {/* 学员关联标识 */}
                {media.student && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-blue-500/80 text-xs text-white flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {media.student.name}
                  </div>
                )}

                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMedia(media.id);
                  }}
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
                  {formatFileSize(media.fileSize)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMedias.map((media) => (
            <Card
              key={media.id}
              className="p-4 bg-slate-900/50 border-white/10 flex items-center gap-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
              onClick={() => {
                if (media.student) {
                  router.push(`/teacher/students/${media.student.id}`);
                }
              }}
            >
              {/* 缩略图 */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {media.type === "photo" ? (
                  <img
                    src={media.previewUrl}
                    alt={media.fileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Video className="w-6 h-6 text-slate-600" />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {media.fileName}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    {media.type === "photo" ? (
                      <Camera className="w-3 h-3" />
                    ) : (
                      <Video className="w-3 h-3" />
                    )}
                    {media.type === "photo" ? "照片" : "视频"}
                  </span>
                  <span>{formatFileSize(media.fileSize)}</span>
                  <span>{new Date(media.recordDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* 状态标签 */}
              <div className="flex items-center gap-2">
                {media.faceDetected && media.faceCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已识脸
                  </span>
                )}
                {media.student && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {media.student.name}
                  </span>
                )}
              </div>

              {/* 删除按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMedia(media.id);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
