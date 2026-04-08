# 运维与发布手册

## 目标

本手册用于记录项目当前的生产部署方式、CI/CD 约定、人工干预步骤与常见排障流程。

## 当前生产环境

- 服务器 IP：`118.25.196.240`
- 代码目录：`/opt/ai-content-hub`
- 进程管理：`pm2`
- Web 入口：`nginx`
- 数据库：`MySQL`
- 主分支：`main`
- 自动部署触发：push 到 `main`

## 发布原则

- 所有依赖统一使用 `pnpm`
- 生产部署统一走 `scripts/deploy-production.sh`
- GitHub Actions 只做两件事：
  - 先本地构建校验
  - 再远程执行生产部署脚本

## 发布流程

### 自动发布

```text
本地提交 -> push 到 main -> GitHub Actions 构建 -> SSH 到服务器 -> 拉取最新代码 -> 执行部署脚本 -> PM2 重启
```

### 手工发布

```bash
cd /opt/ai-content-hub
git fetch origin main
git reset --hard origin/main
bash scripts/deploy-production.sh
```

## 部署后的验证

```bash
curl http://127.0.0.1:5000/api/health
curl http://118.25.196.240/api/health
pm2 list
```

验证项：

- 健康检查返回 `{"ok":true}`
- `pm2 list` 中 `nandu-ai` 为 `online`
- 首页可以打开
- `/admin/login` 可访问

## 回滚策略

当前仓库尚未建立正式版本号流程，临时回滚方式：

```bash
cd /opt/ai-content-hub
git log --oneline -n 10
git reset --hard <目标提交>
bash scripts/deploy-production.sh
```

说明：

- 这是服务器上的回滚方式
- 回滚后需要重新推送正确提交，避免后续 Actions 又部署回最新版本

## 生产账号说明

当前默认系统管理员：

- 用户名：`admin`
- 密码：`admin123`

登录地址：

- 系统管理员：`/admin/login`
- 统一登录页：`/login`

## 敏感信息存放规则

- `.env` 仅保存在服务器，不提交到仓库
- GitHub Actions 使用仓库 Secrets 注入 SSH 能力
- 数据库密码、AI Key、JWT Secret 不写入文档明文

## GitHub Actions 依赖项

仓库 Secrets：

- `PROD_HOST`
- `PROD_PORT`
- `PROD_USER`
- `PROD_SSH_KEY`

## 常见故障

### 1. Actions 构建失败

优先检查：

- `pnpm install`
- `pnpm build`
- TypeScript 报错
- Prisma schema 问题

### 2. Actions 部署失败

优先检查：

- SSH Secret 是否失效
- 服务器磁盘是否不足
- Node / pnpm / pm2 是否仍可用

### 3. 页面 502 / 404

优先检查：

- `pm2 logs nandu-ai`
- `nginx -t`
- Nginx 站点配置路径是否仍为宝塔实际加载目录

### 4. 登录页跳错后台

检查：

- `/api/auth/login` 返回的 `role`
- `redirectTo`
- 浏览器 `localStorage` 中的 `token` / `role`

## 建议的后续增强

- 增加预发布环境
- 增加数据库备份脚本
- 增加失败自动回滚
- 增加 GitHub Actions 手动回滚工作流
