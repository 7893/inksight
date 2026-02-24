# 变更日志

## [未发布]

### 变更
- 合并 API 与前端到单一 Worker `inksight`（原 `inksight-api`）
- 删除 Cloudflare Pages 项目，前端由 Worker 直接服务
- Worker URL：`inksight.53.workers.dev`
- 初始化 D1 数据库 schema（8 张表）
- 添加 `pnpm-workspace.yaml`
- 填入 wrangler.toml 真实资源 ID（D1, KV）
- 邮件接入改为 IMAP 拉取模式（用户登录邮箱密码）
- email-worker 架构：Cron 每分钟派发 → Queue 并发消费 → IMAP 拉取
- 新增 Cloudflare Queue `inksight-email-queue`
- D1 user_credentials 表新增 imap_host, imap_port, last_sync_uid, sync_enabled 字段

### 新增
- Terraform 基础设施配置
- D1 数据库：`inksight-d1`
- R2 存储桶：`inksight-r2`（标准存储类）
- KV 命名空间：`inksight-kv`
- Vectorize 索引：`inksight-vectorize`（768维, cosine）
- Workers：`inksight`, `inksight-email`, `inksight-processor`
- 项目文档结构（`docs/`）

## [0.1.0] - 2026-02-22

### 新增
- 初始项目结构（Turborepo monorepo）
- D1 数据库架构（`schema.sql`）
- 基础 API 骨架（Hono 框架）
- CI/CD 配置（`.gitlab-ci.yml`）
- 工程化工具链（ESLint, Prettier, Vitest）
- 项目目标文档
