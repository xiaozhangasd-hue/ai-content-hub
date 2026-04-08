"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Phone, Lock, Sparkles, User, Building2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // 当前Tab状态
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // 登录表单
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // 注册表单
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerInstitution, setRegisterInstitution] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // 登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginAccount) {
      toast.error("请输入账号");
      return;
    }

    if (!loginPassword) {
      toast.error("请输入密码");
      return;
    }

    setIsLoginLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginAccount,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登录失败");
      }

      // 保存token、用户信息和角色
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", data.role);

      // 根据角色显示不同的欢迎信息
      const roleMessages: Record<string, string> = {
        platform: "欢迎回来，平台管理员",
        merchant: "登录成功",
        teacher: "登录成功",
      };
      toast.success(roleMessages[data.role] || "登录成功");

      // 使用 replace 而不是 push，确保跳转后不能返回登录页
      setTimeout(() => {
        setIsLoginLoading(false);
        router.replace(data.redirectTo || "/dashboard");
      }, 300);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setIsLoginLoading(false);
    }
  };

  // 注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerPhone || !/^1[3-9]\d{9}$/.test(registerPhone)) {
      toast.error("请输入正确的手机号");
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      toast.error("密码至少需要6位");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setIsRegisterLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: registerPhone,
          password: registerPassword,
          name: registerName || undefined,
          institution: registerInstitution || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "注册失败");
      }

      // 保存token和用户信息
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", "merchant");

      toast.success("注册成功！请完善校区信息以获得更精准的AI内容");

      // 跳转到设置页面填写校区信息
      router.push("/settings?welcome=1");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "注册失败");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* 科技感背景 */}
      <div className="absolute inset-0 -z-10">
        {/* 网格背景 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        {/* 光晕效果 */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
        {/* 粒子动画效果 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/50 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 shadow-2xl shadow-purple-500/30 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
            南都AI
          </h1>
          <p className="text-purple-300/80 mt-2 text-lg">教培机构招生增长系统</p>
          <p className="text-gray-400 mt-1 text-sm">帝都科技 出品</p>
        </div>

        {/* 登录/注册卡片 */}
        <Card className="backdrop-blur-xl bg-gray-900/60 border-purple-500/30 shadow-2xl shadow-purple-500/10">
          <CardHeader className="pb-2">
            <div className="grid w-full grid-cols-2 bg-gray-800/50 rounded-lg p-1 border border-purple-500/20">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "login"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                登录
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === "register"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                注册
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* 登录表单 */}
            {activeTab === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-account" className="text-gray-300">账号</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="login-account"
                      type="text"
                      placeholder="手机号 / 老师账号"
                      value={loginAccount}
                      onChange={(e) => setLoginAccount(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-300">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="请输入密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-base font-medium shadow-lg shadow-purple-500/25"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登录
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>首次使用请点击"注册"创建账号</p>
                </div>
              </form>
            )}

            {/* 注册表单 - 仅限商家注册 */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-phone" className="text-gray-300">手机号 *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-gray-300">密码 *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="至少6位密码"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password" className="text-gray-300">确认密码 *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="再次输入密码"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-gray-300">联系人姓名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="您的姓名（选填）"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-institution" className="text-gray-300">机构名称</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="register-institution"
                      type="text"
                      placeholder="机构/学校名称（选填）"
                      value={registerInstitution}
                      onChange={(e) => setRegisterInstitution(e.target.value)}
                      className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-base font-medium shadow-lg shadow-purple-500/25"
                  disabled={isRegisterLoading}
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    <>
                      注册账号
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>注册即表示同意《用户服务协议》</p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* 底部信息 */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>帝都科技出品 · 专业教培招生解决方案</p>
        </div>
      </div>
    </div>
  );
}
