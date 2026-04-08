# 南都AI - 腾讯云部署完整指南

## 一、前置准备

### 1.1 服务器要求
- **系统**：Ubuntu 20.04/22.04 LTS
- **配置**：2核4G内存以上（推荐4核8G）
- **存储**：50GB以上
- **网络**：公网IP，开放80、443、5000端口

### 1.2 域名准备
- 一个已备案的域名
- 域名解析到服务器IP

### 1.3 AI服务账号
**必须**申请以下至少一个：

| 服务商 | 官网 | 价格 | 特点 |
|--------|------|------|------|
| DeepSeek | https://platform.deepseek.com/ | 约1元/百万tokens | 推荐，国内直连 |
| 硅基流动 | https://cloud.siliconflow.cn/ | 按量计费 | 支持多种模型 |
| 智谱AI | https://open.bigmodel.cn/ | 按量计费 | 国产大模型 |

---

## 二、部署方式选择

### 方式A：直接部署（推荐新手）
- 使用PM2管理进程
- 需要手动配置Nginx

### 方式B：Docker部署（推荐运维）
- 一键启动，环境隔离
- 支持快速回滚

---

## 三、方式A：直接部署

### 3.1 安装系统依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装pnpm
npm install -g pnpm

# 安装PM2
npm install -g pm2

# 安装Nginx
sudo apt install -y nginx

# 安装SQLite
sudo apt install -y sqlite3

# 创建日志目录
sudo mkdir -p /var/log/nandu-ai
sudo chown -R $USER:$USER /var/log/nandu-ai
```

### 3.2 上传代码

**方式1：Git克隆**
```bash
cd /var/www
git clone <您的Git仓库地址> nandu-ai
cd nandu-ai
```

**方式2：本地打包上传**
```bash
# 本地执行打包
pnpm build

# 上传到服务器
scp -r . user@your-server:/var/www/nandu-ai/
```

### 3.3 配置环境变量

```bash
cd /var/www/nandu-ai
cp .env.example .env.production
nano .env.production
```

**必填配置：**
```env
# 数据库
DATABASE_URL="file:./data.db"

# JWT密钥（请修改！）
JWT_SECRET="your-random-string-at-least-32-chars"

# AI服务（必填，选择一个）
AI_PROVIDER="deepseek"
DEEPSEEK_API_KEY="sk-your-api-key-here"
```

### 3.4 安装和构建

```bash
cd /var/www/nandu-ai

# 安装依赖
pnpm install

# 生成Prisma客户端
npx prisma generate

# 初始化数据库
npx prisma db push

# 构建项目
pnpm build
```

### 3.5 启动服务

```bash
# 使用PM2启动
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs nandu-ai

# 设置开机自启
pm2 startup
pm2 save
```

### 3.6 配置Nginx

```bash
sudo nano /etc/nginx/sites-available/nandu-ai
```

**配置内容：**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成您的域名

    # 访问日志
    access_log /var/log/nginx/nandu-ai.access.log;
    error_log /var/log/nginx/nandu-ai.error.log;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # 代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # SSE流式输出支持
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

**启用配置：**
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/nandu-ai /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

### 3.7 配置SSL证书

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 四、方式B：Docker部署

### 4.1 安装Docker

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh

# 安装Docker Compose
sudo apt install -y docker-compose-plugin

# 添加用户到docker组
sudo usermod -aG docker $USER
```

### 4.2 配置环境变量

```bash
cd /var/www/nandu-ai
cp .env.example .env
nano .env
```

### 4.3 构建和启动

```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f
```

### 4.4 更新部署

```bash
git pull
docker compose build
docker compose up -d
```

---

## 五、验证部署

### 5.1 检查服务状态

```bash
# PM2方式
pm2 status

# Docker方式
docker compose ps

# 检查端口
curl http://localhost:5000
```

### 5.2 测试功能

访问 `https://your-domain.com`：

1. ✅ 落地页正常显示
2. ✅ 登录功能正常
3. ✅ 文案生成功能正常
4. ✅ 图片生成功能正常（需配置图片API）

---

## 六、常见问题

### Q1: AI生成失败
**原因**：API Key未配置或无效

**解决**：
1. 检查 `.env.production` 中的 `DEEPSEEK_API_KEY`
2. 确认API Key在DeepSeek控制台中有效
3. 查看日志：`pm2 logs nandu-ai`

### Q2: 图片/视频生成失败
**原因**：需要额外的API配置

**解决**：
1. 申请硅基流动API Key
2. 配置 `SILICONFLOW_API_KEY`
3. 重启服务

### Q3: 数据库错误
**原因**：数据库未初始化

**解决**：
```bash
cd /var/www/nandu-ai
npx prisma db push
```

### Q4: 端口被占用
```bash
# 查看5000端口占用
lsof -i:5000

# 杀死进程
kill -9 <PID>
```

---

## 七、运维命令

### PM2相关
```bash
pm2 restart nandu-ai    # 重启服务
pm2 stop nandu-ai       # 停止服务
pm2 logs nandu-ai       # 查看日志
pm2 monit               # 监控面板
```

### Docker相关
```bash
docker compose restart  # 重启
docker compose stop     # 停止
docker compose logs -f  # 查看日志
docker compose down     # 停止并删除容器
```

### 数据库备份
```bash
# 备份SQLite数据库
cp /var/www/nandu-ai/prisma/data.db /backup/data-$(date +%Y%m%d).db

# 定时备份（添加到crontab）
0 2 * * * cp /var/www/nandu-ai/prisma/data.db /backup/data-$(date +\%Y\%m\%d).db
```

---

## 八、联系方式

如有问题，请检查：
1. PM2日志：`pm2 logs nandu-ai`
2. Nginx日志：`/var/log/nginx/nandu-ai.error.log`
3. 应用日志：`/var/log/nandu-ai/error.log`
