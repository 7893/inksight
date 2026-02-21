# Inksight (智墨)

**标语：** *带上背景书写，带上洞察阅读*

**核心愿景：** 将混乱的电子邮件收件箱转化为智能、结构化、可 SQL 查询并具备自然语言交互能力的个人数据智能 BI 面板。

---

## 架构概览

### 1. 数据接入层（CDC 引擎）

**三种接入策略：**

**A. 规则转发（Serverless 推荐）**
- 使用 Sieve 脚本或全局过滤规则将邮件副本静默转发到 Cloudflare Email Routing 子域名
- 触发：`inbox@parser.yourdomain.com` → Email Worker（毫秒级）

**B. JMAP 增量同步（现代协议）**
- 针对 JMAP 原生提供商（Fastmail 等）
- 使用 State Token 进行 CDC（变更数据捕获）
- 仅拉取自上次检查以来的增量 JSON 元数据

**C. IMAP IDLE 长连接（自托管后备方案）**
- 在 PVE 容器中运行轻量级 Go/Python 守护进程
- 维持 IMAP IDLE 连接，在 `EXISTS` 事件时 webhook 到云端 Worker

---

### 2. AI 处理流水线

**事件驱动的 Serverless 架构：**

**阶段 1：AI 路由器**
- Workers AI (Llama 3) 读取原始邮件
- 五分类：
  - A. 资讯订阅
  - B. 财务交易
  - C. 行程预订
  - D. 个人通信
  - E. 垃圾广告

**阶段 2：实体提取**
- **财务：** JSON 模式提取 → `商家`, `金额`, `货币`, `日期`
- **资讯：** 提取 3 个核心要点
- **多模态：** PDF/图片收据 → Vision 模型 OCR

---

### 3. 存储与状态管理

**多模态存储（冷热分离）：**

**D1 数据库（结构化热数据）**
- `Finance_Table`, `Trips_Table`, `News_Table`
- 毫秒级前端查询

**R2 对象存储（原始数据基础）**
- 归档 `.eml` 文件、HTML 正文、未解析附件
- 作为 `[查看源文件]` 时间旅行的真实来源

**Vectorize（语义搜索与 RAG）**
- 嵌入清洗后的长篇内容和个人通信
- 支持模糊语义搜索："上周关于服务器降价的讨论"
- 为智能回复提供上下文记忆

---

### 4. 零信任安全与多租户

**无密码身份验证**
- WebAuthn 协议配合 FIDO2 硬件密钥（YubiKey/Titan Key）
- 设备 Passkeys 实现防钓鱼登录

**多租户物理隔离**
- 行级安全：所有表强制 `user_id` 字段
- API 网关验证 JWT，自动注入 `WHERE user_id = ?`

**机密管理（信封加密）**
- 用户凭证绝不明文存储
- Cloudflare Secrets 存储 AES-256-GCM 主密钥
- Worker 运行时加解密

---

### 5. 生成式 UI 与美学

**视觉设计（电子墨水赛博禅意）**
- 单色调色板：纸白、碳黑、铅灰
- 强调色："钢笔蓝"和"印泥红"
- 正文使用衬线字体，数据/代码使用等宽字体

**动态交互（生成式组件）**
- 顶部 Omnibar 自然语言输入
- 后端转译为 SQL
- 前端动态渲染趋势图、饼图

**反馈循环（人在回路）**
- "红笔批注"纠错交互
- 用户纠错记录为黄金训练数据

---

### 6. 动作引擎与生态集成

**赛博早报**
- Cron 触发聚合 24 小时账单、行程、新闻
- 生成精美排版的数字报纸
- 推送到 Telegram/微信

**智能回复**
- 针对个人通信
- 结合 Vectorize 历史 + D1 语气偏好
- 生成 3 种风格草稿，一键 SMTP 发送

**Webhook 自动化**
- 开放 API 钩子用于外部集成
- 推送财务数据到记账应用
- 发送知识摘要到 Notion 工作区

---

## 技术栈

**计算：** Cloudflare Workers, Workflows  
**存储：** D1（元数据）, R2（原始文件）, Vectorize（嵌入）, KV（配置）  
**AI：** Workers AI (Llama 3, Whisper, BGE)  
**认证：** WebAuthn, JWT  
**前端：** Next.js (React)  

---

## 项目结构

```
inksight/
├── apps/
│   ├── web/              # 前端（Next.js）
│   ├── api/              # API 网关（Hono）
│   ├── email-worker/     # 邮件接入处理器
│   ├── processor/        # AI 处理流水线
│   └── sync-daemon/      # JMAP/IMAP 同步（可选）
├── packages/
│   └── shared/           # 共享类型与工具
├── database/
│   └── schema.sql        # D1 数据库架构
└── docs/
    └── architecture.md   # 详细架构文档
```

---

## 数据模型

### 核心表

**users（用户）**
- `id`, `email`, `created_at`, `tone_preference`

**emails（邮件）**
- `id`, `user_id`, `message_id`, `subject`, `from`, `to`, `date`
- `category`（newsletter/financial/travel/personal/spam）
- `r2_key`（原始 .eml 文件路径）
- `processed_at`, `status`

**finance（财务）**
- `id`, `user_id`, `email_id`, `merchant`, `amount`, `currency`, `date`
- `category`, `description`

**trips（行程）**
- `id`, `user_id`, `email_id`, `destination`, `departure_date`, `return_date`
- `booking_ref`, `carrier`

**news（资讯）**
- `id`, `user_id`, `email_id`, `source`, `title`, `summary`
- `bullet_points`（JSON 数组）

**embeddings（嵌入）**
- `id`, `email_id`, `content_type`, `vector_id`
- `text_chunk`

---

## 开发阶段

### 阶段 1：MVP（核心流水线）
- 通过 Cloudflare Email Routing 接入邮件
- AI 分类（5 类）
- 基础实体提取（仅财务）
- D1 存储 + 简单查询 API
- 最小化 Web UI

### 阶段 2：增强智能
- 完整实体提取（所有类别）
- Vectorize 集成语义搜索
- 智能回复生成
- 早报自动化

### 阶段 3：生产就绪
- WebAuthn 身份验证
- 多租户隔离
- JMAP/IMAP 同步守护进程
- 生成式 UI 配图表
- Webhook 集成

---

## 安全考虑

- 绝不明文存储邮箱密码
- 凭证使用信封加密
- 所有查询强制行级安全
- AI API 调用速率限制
- 所有数据访问审计日志

---

## 下一步

1. 初始化 D1 数据库架构
2. 实现 Email Worker 接入
3. 构建 AI 分类路由器
4. 创建基础 API 端点
5. 开发最小化前端

---

**状态：** 架构设计完成  
**版本：** 1.0  
**最后更新：** 2026-02-22
