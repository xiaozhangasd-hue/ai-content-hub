# 南都AI Dockerfile
# 多阶段构建，优化镜像大小

# 阶段1: 依赖安装
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 阶段2: 构建
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# 构建
RUN pnpm build

# pnpm 将 .prisma 放在 .pnpm 嵌套目录，单独打包供运行阶段 COPY
RUN PRISMA_SRC="$(find /app/node_modules -type d -name '.prisma' 2>/dev/null | head -n1)" \
    && test -n "$PRISMA_SRC" \
    && mkdir -p /app/prisma-for-docker \
    && cp -a "$PRISMA_SRC" /app/prisma-for-docker/

# 阶段3: 运行
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --ingroup nodejs nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-for-docker/.prisma ./node_modules/.prisma

# 健康检查需要 curl；启动时 root 执行 prisma db push，再用 su-exec 降权跑 Node（全局 prisma 对非 root 不可写）
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh \
  && apk add --no-cache curl openssl su-exec \
  && npm install -g prisma@5.22.0 \
  && mkdir -p /app/data \
  && chown -R nextjs:nodejs /app/data /app/node_modules/.prisma

EXPOSE 5000

ENV PORT=5000
ENV HOSTNAME="0.0.0.0"

USER root
ENTRYPOINT ["/docker-entrypoint.sh"]
