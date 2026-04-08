# AI内容生成平台 - 教培机构智能获客助手

## 项目简介

这是一个为教培机构和美业商家打造的AI内容生成平台，帮助商家快速生成营销文案、图片和视频内容，解决"不会做内容"的痛点。

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **UI框架**: Shadcn/ui + Tailwind CSS
- **数据库**: Prisma ORM + SQLite
- **认证**: JWT Token
- **AI模型**: OpenRouter API（Claude 3.5、Midjourney、Runway等）

## 功能特性

### 1. 用户认证
- ✅ 手机号 + 验证码登录
- ✅ JWT Token 认证
- ✅ 自动注册新用户

### 2. AI内容生成
- ✅ **Claude 3.5 文案生成** - 营销文案、课程介绍
- ✅ **Midjourney 图片生成** - 高质量营销图片
- ✅ **Runway 视频生成** - AI视频制作
- 🔜 HeyGen 数字人视频
- 🔜 ElevenLabs 语音合成

### 3. 即将上线功能
- 🔜 课程管理模块
- 🔜 知识库管理
- 🔜 企业微信机器人
- 🔜 H5校区展示
- 🔜 日历选课预约
- 🔜 多平台发布

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenRouter API（请使用您自己的API Key）
OPENROUTER_API_KEY="your-openrouter-api-key"
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

# JWT
JWT_SECRET="your-jwt-secret-key"

# App Config
NEXT_PUBLIC_APP_NAME="AI内容生成平台"
NEXT_PUBLIC_APP_URL="http://localhost:5000"
```

### 3. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

### 5. 获取 OpenRouter API Key

1. 访问 https://openrouter.ai/
2. 注册并登录
3. 在 API Keys 页面创建新的 API Key
4. 将 API Key 配置到 `.env` 文件中

## API 文档

### 认证相关

#### 发送验证码
```
POST /api/auth/send-code
Body: { "phone": "13800138000" }
Response: { "success": true, "message": "验证码已发送" }
```

#### 登录
```
POST /api/auth/login
Body: { "phone": "13800138000", "code": "123456" }
Response: { "success": true, "token": "jwt-token", "user": {...} }
```

#### 获取用户信息
```
GET /api/auth/me
Headers: { "Authorization": "Bearer jwt-token" }
Response: { "user": {...} }
```

### AI 内容生成

#### Claude 文案生成
```
POST /api/claude/generate
Headers: { "Authorization": "Bearer jwt-token" }
Body: {
  "type": "招生宣传",
  "shopName": "阳光艺术培训中心",
  "industry": "教育培训",
  "description": "钢琴培训课程"
}
```

#### Midjourney 图片生成
```
POST /api/midjourney/generate
Headers: { "Authorization": "Bearer jwt-token" }
Body: {
  "type": "营销图片",
  "shopName": "店铺名称",
  "description": "图片描述",
  "style": "专业商务"
}
```

#### Runway 视频生成
```
POST /api/runway/generate
Headers: { "Authorization": "Bearer jwt-token" }
Body: {
  "type": "营销视频",
  "shopName": "店铺名称",
  "description": "视频描述",
  "duration": 5,
  "quality": "720p"
}
```

#### 获取内容列表
```
GET /api/contents/list?type=text&status=completed
Headers: { "Authorization": "Bearer jwt-token" }
```

## 数据库结构

### Merchant (商家)
- id: String (主键)
- phone: String (手机号，唯一)
- name: String? (商家名称)
- createdAt: DateTime

### Content (内容)
- id: String (主键)
- merchantId: String (关联商家)
- type: String (类型: text/image/video)
- title: String?
- description: String?
- content: String? (文案内容)
- mediaUrl: String? (图片/视频URL)
- status: String (状态: pending/generating/completed/failed)
- prompt: String?
- createdAt: DateTime

### VerificationCode (验证码)
- id: String (主键)
- phone: String
- code: String
- expiresAt: DateTime
- createdAt: DateTime

### Course (课程)
- id: String (主键)
- merchantId: String (关联商家)
- title: String
- description: String?
- price: Float?
- teacher: String?
- createdAt: DateTime

## 部署说明

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### 环境变量配置

生产环境需要配置以下环境变量：
- `DATABASE_URL`: 数据库连接字符串
- `OPENROUTER_API_KEY`: OpenRouter API Key
- `JWT_SECRET`: JWT密钥（请使用强密钥）
- `NEXT_PUBLIC_APP_URL`: 应用URL

## 项目结构

```
├── prisma/
│   └── schema.prisma        # 数据库模型
├── src/
│   ├── app/
│   │   ├── api/             # API路由
│   │   │   ├── auth/        # 认证相关
│   │   │   ├── claude/      # Claude文案生成
│   │   │   ├── midjourney/  # Midjourney图片生成
│   │   │   ├── runway/      # Runway视频生成
│   │   │   └── contents/    # 内容管理
│   │   ├── login/           # 登录页面
│   │   ├── dashboard/       # Dashboard页面
│   │   └── page.tsx         # 首页
│   ├── components/          # React组件
│   │   └── ui/              # UI组件库
│   └── lib/                 # 工具库
│       ├── prisma.ts        # Prisma客户端
│       ├── auth.ts          # 认证工具
│       └── openrouter.ts    # OpenRouter API封装
├── .env                     # 环境变量
├── package.json
└── README.md
```

## 注意事项

1. **API Key 安全**: 请勿将 API Key 提交到代码仓库
2. **验证码**: 开发环境下验证码会在响应中返回，生产环境需要接入短信服务
3. **数据库**: 当前使用SQLite，生产环境建议使用PostgreSQL或MySQL
4. **文件存储**: 生成的图片和视频存储在对象存储中

## 常见问题

### Q: OpenRouter API返回401错误？
A: 请检查：
1. API Key是否正确配置
2. API Key是否有余额
3. 是否有访问Claude等模型的权限

### Q: 如何接入短信验证码服务？
A: 修改 `src/app/api/auth/send-code/route.ts`，添加短信服务调用

### Q: 如何切换到MySQL/PostgreSQL？
A: 
1. 修改 `prisma/schema.prisma` 中的数据库配置
2. 更新 `.env` 中的 `DATABASE_URL`
3. 运行 `npx prisma db push`

## 技术支持

如有问题，请提交 Issue 或联系开发团队。

## License

MIT
