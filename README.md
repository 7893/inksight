# Inksight (智墨)

**Slogan:** *Writing with Context, Reading with Insight.*

**Core Vision:** Transform chaotic inbox into an intelligent, structured, SQL-queryable personal data BI dashboard with natural language interaction.

---

## Architecture Overview

### 1. Data Ingestion Layer (CDC Engine)

**Three Ingestion Strategies:**

**A. Rule-based Forwarding (Serverless Recommended)**
- Use Sieve scripts or global filters to silently forward email copies to Cloudflare Email Routing subdomain
- Trigger: `inbox@parser.yourdomain.com` → Email Worker (millisecond-level)

**B. JMAP Incremental Sync (Modern Protocol)**
- For JMAP-native providers (Fastmail, etc.)
- Use State Token for CDC (Change Data Capture)
- Pull only incremental JSON metadata since last check

**C. IMAP IDLE Long Connection (Self-hosted Fallback)**
- Lightweight Go/Python daemon in PVE container
- Maintain IMAP IDLE connection, webhook to cloud Worker on `EXISTS` event

---

### 2. AI Processing Pipeline

**Event-driven Serverless Architecture:**

**Stage 1: AI Router**
- Workers AI (Llama 3) reads raw email
- Five-way classification:
  - A. Newsletter/Subscription
  - B. Financial Transaction
  - C. Travel Booking
  - D. Personal Correspondence
  - E. Spam/Advertisement

**Stage 2: Entity Extraction**
- **Financial:** JSON mode extraction → `Merchant`, `Amount`, `Currency`, `Date`
- **Newsletter:** Extract 3 core bullet points
- **Multimodal:** PDF/Image receipts → Vision model OCR

---

### 3. Storage & State Management

**Multi-modal Storage (Hot/Cold Separation):**

**D1 Database (Structured Hot Data)**
- `Finance_Table`, `Trips_Table`, `News_Table`
- Millisecond-level frontend queries

**R2 Object Storage (Raw Data Foundation)**
- Archive `.eml` files, HTML bodies, unparsed attachments
- Source of Truth for `[View Source]` time travel

**Vectorize (Semantic Search & RAG)**
- Embed cleaned long-form content and personal correspondence
- Support fuzzy semantic search: "discussion about server pricing last week"
- Provide context memory for smart replies

---

### 4. Zero Trust Security & Multi-tenancy

**Passwordless Authentication**
- WebAuthn protocol with FIDO2 hardware keys (YubiKey/Titan Key)
- Device Passkeys for phishing-resistant login

**Multi-tenant Physical Isolation**
- Row-Level Security: all tables enforce `user_id` field
- API gateway validates JWT, auto-inject `WHERE user_id = ?`

**Secret Management (Envelope Encryption)**
- User credentials never stored in plaintext
- Cloudflare Secrets stores AES-256-GCM master key
- Runtime encryption/decryption in Worker

---

### 5. Generative UI & Aesthetics

**Visual Design (E-ink Cyber Zen)**
- Monochrome palette: paper white, carbon black, lead gray
- Accent colors: "pen blue" and "seal red"
- Serif fonts for reading, monospace for data/code

**Dynamic Interaction (Generative Widgets)**
- Top Omnibar for natural language input
- Backend translates to SQL
- Frontend renders trend charts, pie charts dynamically

**Feedback Loop (Human-in-the-Loop)**
- "Red pen annotation" correction interface
- User corrections recorded as golden training data

---

### 6. Action Engine & Ecosystem Integration

**Morning Brief (Cyber Daily)**
- Cron-triggered aggregation of 24h bills, trips, news
- Generate beautifully formatted digital newspaper
- Push to Telegram/WeChat

**Smart Reply (Contextual Draft Generation)**
- For personal correspondence
- Combine Vectorize history + D1 tone preferences
- Generate 3 style variants, one-click SMTP send

**Webhook Automation**
- Open API hooks for external integrations
- Push financial data to accounting apps
- Send knowledge summaries to Notion workspace

---

## Tech Stack

**Compute:** Cloudflare Workers, Workflows
**Storage:** D1 (metadata), R2 (raw files), Vectorize (embeddings), KV (config)
**AI:** Workers AI (Llama 3, Whisper, BGE)
**Auth:** WebAuthn, JWT
**Frontend:** Next.js (React)

---

## Project Structure

```
inksight/
├── apps/
│   ├── web/              # Frontend (Next.js)
│   ├── api/              # API Gateway (Hono)
│   ├── email-worker/     # Email ingestion handler
│   ├── processor/        # AI processing pipeline
│   └── sync-daemon/      # JMAP/IMAP sync (optional)
├── packages/
│   └── shared/           # Shared types & utilities
├── database/
│   └── schema.sql        # D1 database schema
└── docs/
    └── architecture.md   # Detailed architecture docs
```

---

## Data Models

### Core Tables

**users**
- `id`, `email`, `created_at`, `tone_preference`

**emails**
- `id`, `user_id`, `message_id`, `subject`, `from`, `to`, `date`
- `category` (newsletter/financial/travel/personal/spam)
- `r2_key` (raw .eml file path)
- `processed_at`, `status`

**finance**
- `id`, `user_id`, `email_id`, `merchant`, `amount`, `currency`, `date`
- `category`, `description`

**trips**
- `id`, `user_id`, `email_id`, `destination`, `departure_date`, `return_date`
- `booking_ref`, `carrier`

**news**
- `id`, `user_id`, `email_id`, `source`, `title`, `summary`
- `bullet_points` (JSON array)

**embeddings**
- `id`, `email_id`, `content_type`, `vector_id`
- `text_chunk`

---

## Development Phases

### Phase 1: MVP (Core Pipeline)
- Email ingestion via Cloudflare Email Routing
- AI classification (5 categories)
- Basic entity extraction (financial only)
- D1 storage + simple query API
- Minimal web UI

### Phase 2: Enhanced Intelligence
- Full entity extraction (all categories)
- Vectorize integration for semantic search
- Smart reply generation
- Morning brief automation

### Phase 3: Production Ready
- WebAuthn authentication
- Multi-tenant isolation
- JMAP/IMAP sync daemon
- Generative UI with charts
- Webhook integrations

---

## Security Considerations

- Never store email passwords in plaintext
- Use envelope encryption for credentials
- Enforce row-level security on all queries
- Rate limiting on AI API calls
- Audit logging for all data access

---

## Next Steps

1. Initialize D1 database schema
2. Implement Email Worker for ingestion
3. Build AI classification router
4. Create basic API endpoints
5. Develop minimal frontend

---

**Status:** Architecture Design Complete
**Version:** 1.0
**Last Updated:** 2026-02-22
