"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";

export default function TestLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      const sendRes = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "13800000001" }),
      });

      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        throw new Error(sendData.error || "发送验证码失败");
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: "13800000001",
          code: sendData.devCode,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.error || "登录失败");
      }

      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      toast.success("登录成功！");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative tech-card">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">教培AI助手</CardTitle>
          <CardDescription className="text-base mt-2">
            快速体验智能内容创作
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-2">测试账号信息</p>
            <p className="text-muted-foreground">手机号：13800000001</p>
            <p className="text-muted-foreground">验证码：自动获取</p>
          </div>

          <Button
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                登录中...
              </>
            ) : (
              <>
                点击登录
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              返回正常登录
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
