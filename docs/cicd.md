# CI/CD 说明

## 目标

实现以下链路：

```text
本地开发 -> push 到 main -> GitHub Actions 构建校验 -> 打包发布包 -> 上传到生产机 -> 服务器解压并执行部署脚本 -> 自动上线
```

## 工作流文件

- `.github/workflows/deploy-tencent.yml`

## 触发方式

- 推送到 `main`
- 在 GitHub Actions 页面手动执行

## 工作流步骤

### 1. 本地构建校验

Actions 在 GitHub Runner 上执行：

```bash
pnpm install --frozen-lockfile
pnpm build
```

如果构建失败，不会继续部署。

### 2. 上传部署包到生产环境

通过仓库 Secrets 注入生产机连接信息，然后 Actions 会把构建后的发布包上传到服务器：

- `PROD_HOST`
- `PROD_PORT`
- `PROD_USER`
- `PROD_SSH_KEY`

### 3. 服务器端部署

连接成功后，工作流会：

1. 进入 `/opt/ai-content-hub`
2. 解压由 GitHub Actions 上传的发布包
3. 保留服务器已有 `.env`
4. 用本次上传的 `.git` 元数据执行 `git reset --hard HEAD` 与 `git clean`
5. 执行 `bash scripts/deploy-production.sh`

## 部署脚本职责

`scripts/deploy-production.sh` 会完成：

- `pnpm install --frozen-lockfile`
- `pnpm build`
- `npx prisma db push`
- 同步 `.next/standalone` 运行产物
- `pm2 start/restart`
- 健康检查

## 失败处理

### 构建阶段失败

说明：

- 代码本身无法通过生产构建
- 需要先修复 `pnpm build`

### 上传阶段失败

说明：

- 生产机不可达
- SSH key / 用户配置不正确
- SCP 上传过程被中断

### 部署阶段失败

优先排查：

```bash
pm2 logs nandu-ai --lines 100
curl http://127.0.0.1:5000/api/health
nginx -t
```

## 手工补救方式

如果 Actions 成功上传但最后一步失败，可以在服务器手工执行：

```bash
cd /opt/ai-content-hub
bash scripts/deploy-production.sh
```

## 维护要求

- 修改生产部署流程时，必须同步更新：
  - `.github/workflows/deploy-tencent.yml`
  - `scripts/deploy-production.sh`
  - `docs/deploy-tencent-cloud.md`
  - `docs/ops-runbook.md`
  - `docs/cicd.md`
