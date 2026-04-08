# 腾讯云部署完整手册

> 本文档是“当前真实线上环境”的完整版本。若与其他历史文档冲突，以本文和 `docs/ops-runbook.md` 为准。

## 1. 当前线上事实

- 线上地址：`http://118.25.196.240`
- 部署方式：`PM2 + Nginx + MySQL`
- 不使用 Docker
- 仓库：`https://github.com/xiaozhangasd-hue/ai-content-hub.git`
- 代码目录：`/opt/ai-content-hub`
- 自动部署：GitHub Actions push `main` 触发

## 2. 服务器软件布局

### Node / pnpm / pm2

- Node：`/usr/local/node20/bin/node`
- npm：`/usr/local/node20/bin/npm`
- pnpm：全局安装
- pm2：全局安装

建议所有运维命令先执行：

```bash
export PATH="/usr/local/node20/bin:$PATH"
```

### Nginx

- Nginx 主目录：`/www/server/nginx/conf`
- 宝塔面板 vhost：`/www/server/panel/vhost/nginx`
- 项目反代配置：`/www/server/panel/vhost/nginx/nandu-ai.conf`

### MySQL

- 程序：宝塔安装版 MySQL 8
- socket：`/tmp/mysql.sock`
- 数据库名：`nandu_ai`

## 3. 首次部署步骤

### 3.1 拉代码

```bash
mkdir -p /opt/ai-content-hub
cd /opt/ai-content-hub
git clone https://github.com/xiaozhangasd-hue/ai-content-hub.git .
```

### 3.2 准备环境变量

创建 `/opt/ai-content-hub/.env`：

```env
DATABASE_URL="mysql://root:你的数据库密码@localhost:3306/nandu_ai"
JWT_SECRET="请替换为生产密钥"
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

### 3.3 安装依赖并构建

```bash
cd /opt/ai-content-hub
pnpm install --frozen-lockfile
pnpm build
```

### 3.4 初始化数据库

```bash
cd /opt/ai-content-hub
npx prisma db push --schema=./prisma/schema.prisma
```

### 3.5 启动 PM2

```bash
cd /opt/ai-content-hub
cp -r .next/standalone/* ./
pm2 start ecosystem.config.js --update-env
pm2 save
```

### 3.6 配置 Nginx

核心反代配置：

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 118.25.196.240 _;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

## 4. 自动部署方案

### 4.1 GitHub Actions 工作流

文件：

- `.github/workflows/deploy-tencent.yml`

动作：

1. checkout
2. setup node + pnpm
3. `pnpm install --frozen-lockfile`
4. `pnpm build`
5. SSH 登录生产机
6. 拉取最新代码
7. 保留生产 `.env`
8. 执行 `bash scripts/deploy-production.sh`

### 4.2 生产部署脚本

文件：

- `scripts/deploy-production.sh`

脚本统一负责：

- 安装依赖
- 构建
- `prisma db push`
- 同步 standalone 运行文件
- PM2 启动/重启
- 健康检查

## 5. GitHub Secrets 说明

自动部署依赖以下 Secrets：

- `PROD_HOST`
- `PROD_PORT`
- `PROD_USER`
- `PROD_SSH_KEY`
- `PROD_SSH_FINGERPRINT`

## 6. 发布命令

### 手工发布

```bash
cd /opt/ai-content-hub
bash scripts/deploy-production.sh
```

### 自动发布

```bash
git push origin main
```

## 7. 验证项

```bash
curl http://127.0.0.1:5000/api/health
curl http://118.25.196.240/api/health
pm2 list
```

预期：

- `nandu-ai` 状态为 `online`
- 健康检查返回 JSON 且 `ok=true`

## 8. 常见问题

### 8.1 登录后跳错后台

检查统一登录接口返回值：

- 系统管理员应返回 `/admin`
- 商家应返回 `/dashboard`
- 老师应返回 `/teacher`

### 8.2 Prisma 同步失败

```bash
cd /opt/ai-content-hub
npx prisma db push --schema=./prisma/schema.prisma
```

### 8.3 PM2 启动失败

```bash
pm2 logs nandu-ai --lines 100
```

### 8.4 Nginx 正常但首页 404

优先检查：

- 配置文件是否放在宝塔实际加载目录
- 不是旧的 `/www/server/nginx/conf/vhost/`
- 实际加载目录是 `/www/server/panel/vhost/nginx/`

## 9. 推荐后续工作

- 绑定正式域名
- 配置 HTTPS 证书
- 建立数据库备份
- 增加一键回滚工作流
