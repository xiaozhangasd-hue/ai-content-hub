# 南都AI - 腾讯云部署指南

## 一、服务器准备

### 1.1 服务器要求
- **系统**：Ubuntu 20.04/22.04 或 CentOS 7/8
- **配置**：2核4G以上
- **端口**：开放 80、443、5000 端口

### 1.2 安装依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx
sudo apt install -y nginx

# 安装 SQLite（如果使用SQLite）
sudo apt install -y sqlite3
```

## 二、上传代码

### 2.1 方式一：Git拉取（推荐）
```bash
# 在服务器上
cd /var/www
git clone <您的Git仓库地址> nandu-ai
cd nandu-ai
```

### 2.2 方式二：本地打包上传
```bash
# 在本地项目目录执行
pnpm build

# 打包以下文件/目录
# - package.json
# - pnpm-lock.yaml
# - next.config.ts
# - prisma/
# - public/
# - src/
# - .next/ (构建产物)
# - .env.production (环境变量)

# 上传到服务器
scp -r ./dist/* user@your-server:/var/www/nandu-ai/
```

## 三、环境变量配置

### 3.1 创建环境变量文件
```bash
cd /var/www/nandu-ai
nano .env.production
```

### 3.2 环境变量内容
```env
# 数据库
DATABASE_URL="file:./data.db"

# JWT密钥（请修改为随机字符串）
JWT_SECRET="your-super-secret-jwt-key-change-this"

# AI服务配置（三选一）

# 方案1：使用DeepSeek（国内可访问，推荐）
DEEPSEEK_API_KEY="sk-xxxxx"
DEEPSEEK_BASE_URL="https://api.deepseek.com"

# 方案2：使用硅基流动（代理多种模型）
SILICONFLOW_API_KEY="sk-xxxxx"
SILICONFLOW_BASE_URL="https://api.siliconflow.cn/v1"

# 方案3：使用智谱AI
ZHIPU_API_KEY="xxxxx"

# 如果有对象存储，配置以下项（可选）
# OSS_ACCESS_KEY_ID=""
# OSS_ACCESS_KEY_SECRET=""
# OSS_BUCKET=""
# OSS_REGION=""
# OSS_ENDPOINT=""
```

## 四、安装依赖和初始化

```bash
cd /var/www/nandu-ai

# 安装依赖
pnpm install

# 生成Prisma客户端
npx prisma generate

# 初始化数据库
npx prisma db push

# 构建项目（如果还没构建）
pnpm build
```

## 五、进程管理（PM2）

### 5.1 创建PM2配置
```bash
nano ecosystem.config.js
```

内容：
```javascript
module.exports = {
  apps: [{
    name: 'nandu-ai',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/nandu-ai',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
```

### 5.2 启动服务
```bash
# 启动
pm2 start ecosystem.config.js --env production

# 开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status

# 查看日志
pm2 logs nandu-ai
```

## 六、Nginx配置

### 6.1 创建Nginx配置
```bash
sudo nano /etc/nginx/sites-available/nandu-ai
```

内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成您的域名

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE支持（AI对话流式输出）
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

### 6.2 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/nandu-ai /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

## 七、SSL证书（HTTPS）

### 7.1 使用Let's Encrypt免费证书
```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

## 八、AI服务配置说明

由于您没有火山备案，需要使用国内可访问的AI服务：

### 8.1 DeepSeek（推荐）
- 官网：https://platform.deepseek.com/
- 价格：约1元/百万tokens
- 国内可直接访问，无需备案

### 8.2 硅基流动
- 官网：https://cloud.siliconflow.cn/
- 提供多种模型代理（DeepSeek、Qwen等）
- 国内可访问

### 8.3 智谱AI
- 官网：https://open.bigmodel.cn/
- GLM系列模型
- 国内可访问

## 九、修改代码使用新AI服务

需要修改以下文件中的AI调用：

```typescript
// src/app/api/claude/generate/route.ts
// 将 coze-coding-dev-sdk 替换为直接调用 DeepSeek API

import axios from 'axios';

const response = await axios.post(
  'https://api.deepseek.com/chat/completions',
  {
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.8
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

## 十、常用命令

```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart nandu-ai

# 查看日志
pm2 logs nandu-ai

# 更新代码后重新部署
cd /var/www/nandu-ai
git pull
pnpm install
pnpm build
pm2 restart nandu-ai
```

## 十一、故障排查

### 11.1 查看日志
```bash
# PM2日志
pm2 logs nandu-ai

# Nginx日志
sudo tail -f /var/log/nginx/error.log
```

### 11.2 常见问题
1. **端口被占用**：`lsof -i:5000` 查看
2. **数据库错误**：检查 `DATABASE_URL` 配置
3. **AI调用失败**：检查API Key是否正确
