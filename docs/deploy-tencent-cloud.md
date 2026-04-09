# 腾讯云生产部署说明

## 当前生产架构

- 服务器：`118.25.196.240`
- 应用目录：`/opt/ai-content-hub`
- 进程管理：`pm2`
- Web 服务：`nginx`
- 数据库：`MySQL 8`
- Node：`/usr/local/node20/bin/node`
- 包管理：`pnpm`

## 当前生产访问地址

- 首页：`http://118.25.196.240`
- 管理后台登录：`http://118.25.196.240/admin/login`
- 健康检查：`http://118.25.196.240/api/health`
- 应用直连端口：`http://118.25.196.240:5000`

## 生产环境关键配置

### PM2

- 应用名：`nandu-ai`
- 配置文件：`ecosystem.config.js`
- 日志目录：`/var/log/nandu-ai`

### Nginx

- 主配置目录：`/www/server/nginx/conf`
- 宝塔站点配置目录：`/www/server/panel/vhost/nginx`
- 当前反代配置文件：`/www/server/panel/vhost/nginx/nandu-ai.conf`

### MySQL

- 数据库名：`nandu_ai`
- Socket：`/tmp/mysql.sock`
- 生产连接字符串保存在：`/opt/ai-content-hub/.env`

## 首次部署流程

### 1. 安装运行环境

服务器已采用以下方案：

- Node 20：二进制安装到 `/usr/local/node20`
- pnpm：全局安装
- pm2：全局安装
- npm/pnpm 镜像：`https://registry.npmmirror.com`

### 2. 代码目录

```bash
mkdir -p /opt/ai-content-hub
```

### 3. 环境变量

生产环境使用项目根目录下的 `.env`：

```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/nandu_ai"
JWT_SECRET="请使用强随机字符串"
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
SILICONFLOW_API_KEY=
IMAGE_PROVIDER=siliconflow
NEXT_PUBLIC_APP_NAME=南都AI
NEXT_PUBLIC_APP_URL=http://118.25.196.240
NODE_ENV=production
PORT=5000
```

### 4. 数据库初始化

```bash
cd /opt/ai-content-hub
npx prisma db push --schema=./prisma/schema.prisma
```

### 5. 构建与启动

```bash
cd /opt/ai-content-hub
pnpm install --frozen-lockfile
pnpm build
cp -r .next/standalone/* ./
pm2 start ecosystem.config.js --update-env
pm2 save
```

## 日常手工部署

当不走 GitHub Actions 时，直接执行：

```bash
cd /opt/ai-content-hub
bash scripts/deploy-production.sh
```

该脚本会自动完成：

- 安装依赖
- 生产构建
- `prisma db push`
- 准备 standalone 运行文件
- PM2 重启
- 健康检查

## GitHub Actions 自动部署

仓库已使用工作流：

- `.github/workflows/deploy-tencent.yml`

触发条件：

- 推送到 `main`
- 手动执行 `workflow_dispatch`

部署逻辑：

1. 在 GitHub Actions 上执行 `pnpm install` 与 `pnpm build`
2. 打包当前提交为发布压缩包
3. 通过 SCP 上传到生产服务器 `/tmp`
4. 保留服务器现有 `.env`
5. 解压覆盖 `/opt/ai-content-hub`，并执行 `git reset --hard HEAD`、`git clean`
6. 执行 `bash scripts/deploy-production.sh`

## GitHub Secrets

Actions 依赖以下仓库级 Secrets：

- `PROD_HOST`
- `PROD_PORT`
- `PROD_USER`
- `PROD_SSH_KEY`

## 常用运维命令

```bash
export PATH="/usr/local/node20/bin:$PATH"

pm2 list
pm2 logs nandu-ai
pm2 restart nandu-ai
pm2 stop nandu-ai

curl http://127.0.0.1:5000/api/health
curl http://118.25.196.240/api/health
```

## Nginx 运维命令

```bash
nginx -t
nginx -s reload
```

## MySQL 运维命令

```bash
/www/server/mysql/bin/mysql -u root -p -S /tmp/mysql.sock
```

## 故障排查

### 应用无法启动

```bash
pm2 logs nandu-ai --lines 100
```

### 构建成功但页面打不开

检查：

- `pm2 list`
- `curl http://127.0.0.1:5000/api/health`
- `curl http://118.25.196.240/api/health`
- `nginx -t`

### 数据库异常

```bash
cd /opt/ai-content-hub
npx prisma db push --schema=./prisma/schema.prisma
```

### 自动部署失败

优先查看：

- GitHub Actions 运行日志
- `/tmp/ai-content-hub-release.tgz` 是否上传成功
- 服务器 `pm2 logs nandu-ai`

## 备注

- 当前生产环境不使用 Docker
- 当前生产环境采用 PM2 + Nginx + MySQL 的直接部署方式
- 若后续切换域名和 HTTPS，只需在现有 Nginx 站点上继续扩展证书配置
