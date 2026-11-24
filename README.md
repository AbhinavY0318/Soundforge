# SoundForge AI Platform 🎵⚡

> Enterprise-Grade Developer API Platform for AI Music Generation built with the MERN Stack, Redis, BullMQ, and MinIO.

[![Node.js CI](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org)
[![MERN Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Redis%20%2B%20MinIO-orange.svg)](https://expressjs.com)
[![Acceptance Tests](https://img.shields.io/badge/Acceptance%20Tests-16%2F16%20Passing-emerald.svg)](./backend/src/tests/acceptance.test.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)

---

## 1. Project Overview

**SoundForge** is a production-ready, self-service enterprise API platform that allows developers to compose, synthesize, monitor, and license AI music tracks via high-throughput REST APIs.

The platform provides a modern developer experience inspired by Stripe and Linear:
- **Instant Developer Onboarding:** Self-service registration, team organizations, and email verification.
- **Dual-Mode API Keys:** Live (`sf_live_...`) and Test (`sf_test_...`) modes, one-time secret reveals, instant revocation, and zero-downtime key rotation.
- **Bulletproof Metering & Concurrency:** Real-time credit reservations before queueing, mathematical race-condition prevention under simultaneous requests, and parallel slot enforcement.
- **Asynchronous Generation Engine:** BullMQ queue coordination, provider abstraction (ElevenLabs & deterministic Mock provider with PCM WAV synthesis), and MinIO S3 signed audio URLs.
- **Hardened Webhooks:** HMAC-SHA256 signature verification, replay-attack guards, exponential backoff retries, and multi-layer SSRF protection blocking private IPs and cloud metadata (`169.254.169.254`).

---

## 2. Architecture

```mermaid
flowchart TD
    subgraph Clients["Clients & Developers"]
        DevApp["Client Applications / SDKs"]
        DashUI["React Developer Dashboard"]
    end

    subgraph Gateway["Express API Gateway"]
        AuthMW["Authentication & API Key Guard"]
        RateMW["Redis Rate Limiter (Hour/Day)"]
        IdemMW["Idempotency Filter (SHA-256)"]
        Router["Router: /v1/* & /api/v1/*"]
    end

    subgraph CoreEngine["Core Business Engine"]
        CreditSvc["CreditService (Atomic Slot & Allowance Lock)"]
        GenSvc["GenerationService"]
        PlanSvc["PlanService (Sandbox, Starter, Growth)"]
    end

    subgraph StorageQueues["Data & Queue Layer"]
        MongoDB[(MongoDB Replica Set rs0)]
        Redis[(Redis BullMQ & Distributed Locks)]
        MinIO[(MinIO S3 Audio Storage)]
    end

    subgraph Background["Worker & Dispatch Layer"]
        GenWorker["BullMQ Generation Worker"]
        Provider["MusicProvider (ElevenLabs / Mock Synthesis)"]
        WebhookSvc["Webhook Dispatcher (SSRF Firewall)"]
    end

    DevApp -->|POST /v1/generations| AuthMW
    DashUI -->|Dashboard Management| AuthMW
    AuthMW --> RateMW --> IdemMW --> Router
    Router --> GenSvc
    GenSvc --> CreditSvc
    CreditSvc -->|Atomic Reservation| MongoDB
    CreditSvc -->|Distributed Lock| Redis
    GenSvc -->|Dispatch Job| Redis
    Redis --> GenWorker
    GenWorker --> Provider
    Provider -->|WAV / MP3 Stream| MinIO
    GenWorker -->|Settle / Refund| CreditSvc
    GenWorker --> WebhookSvc
    WebhookSvc -->|Signed HTTP POST| DevApp
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript and Vite
- **Styling:** Tailwind CSS with Dark Charcoal / Navy palette (`#0B0F19`, `#111827`)
- **Routing:** React Router v7
- **State & Data Fetching:** TanStack React Query v5 & Axios interceptors (with automatic JWT refresh)
- **Charts:** Recharts for daily usage and throughput analytics
- **Icons:** Lucide React
- **Audio:** Custom HTML5 interactive waveform player with scrubbing & download

### Backend
- **Runtime:** Node.js v22+ with Express.js and TypeScript strict mode
- **Database:** MongoDB 7.0 (with replica set `rs0` for multi-document transaction support)
- **Object Modeling:** Mongoose with compound indexing and TTL cleanup
- **Distributed Coordination:** Redis 7.2 (locks, token bucket rate limits, BullMQ queues)
- **Audio Persistence:** MinIO S3-compatible object storage with presigned expiring URLs
- **Validation:** Zod schemas
- **Security:** HMAC-SHA256, bcrypt password hashing, `ipaddr.js` SSRF validator
- **API Documentation:** OpenAPI 3.1 & Swagger UI at `/docs`
- **Testing:** Vitest & Supertest with in-memory MongoDB replica support

---

## 4. Subscription Plans & Credit Rules

| Feature / Plan | SANDBOX | STARTER | GROWTH |
| :--- | :--- | :--- | :--- |
| **Monthly Price** | **$0 / mo** | **$29 / mo** | **$199 / mo** |
| **Monthly Allowance** | 0 credits (Free test mode) | 200 credits | 2,000 credits |
| **Parallel Generations** | 1 active job | 3 active jobs | 10 active jobs |
| **Hourly Rate Limit** | 60 requests/hr | 300 requests/hr | 2,000 requests/hr |
| **Daily Rate Limit** | 500 requests/day | 3,000 requests/day | 30,000 requests/day |
| **Permitted Licenses** | `royalty_free` | `royalty_free`, `sync` | `royalty_free`, `sync`, `full_ownership` |
| **API Key Modes** | Test keys only (`sf_test_`) | Test & Live (`sf_live_`) | Test & Live (`sf_live_`) |
| **Overage Billing** | No | No (Hard stop) | Supported |

### Duration & Credit Cost Formula
Every started 60-second window consumes an additional duration unit:
$$\text{durationUnits} = \left\lceil \frac{\text{durationSec}}{60} \right\rceil$$
$$\text{totalCredits} = \text{durationUnits} \times \text{licenseCreditCost}$$

- **Royalty-Free (`royalty_free`):** 1 credit / unit
- **Sync License (`sync`):** 6 credits / unit
- **Full Ownership (`full_ownership`):** 14 credits / unit

---

## 5. Quickstart & Installation

### Option A: Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbhinavY0318/Soundforge.git
   cd Soundforge
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Install workspace dependencies:**
   ```bash
   npm install
   ```

4. **Seed database with default plans and demo credentials:**
   ```bash
   npm run seed --workspace=backend
   ```

5. **Start backend and frontend development servers:**
   ```bash
   # Terminal 1: Backend Server & Worker
   npm run dev:backend

   # Terminal 2: Frontend Dashboard
   npm run dev:frontend
   ```

   - Frontend Dashboard: `http://localhost:5173`
   - Backend API: `http://localhost:4000`
   - OpenAPI / Swagger UI: `http://localhost:4000/docs`

### Option B: Docker Compose

Start the entire platform including MongoDB replica set, Redis, MinIO, Backend, Worker, and Frontend:
```bash
docker-compose up --build -d
```

Verify service status:
```bash
docker-compose ps
```

---

## 6. Seed Credentials & Test Data

If seeded with `npm run seed --workspace=backend`:
- **Dashboard Email:** `developer@soundforge.ai`
- **Dashboard Password:** `SoundForge2026!`
- **Plan:** Starter (200 credits allowance, 3 parallel limit)
- **Pre-generated Keys:** Visible in the API Keys console or generated on demand.

---

## 7. Developer API Reference

### Create Generation Job
```http
POST /v1/generations
Authorization: Bearer sf_live_0a91f4c781bc...
Idempotency-Key: client_order_8492
Content-Type: application/json

{
  "prompt": "Ethereal ambient soundscape with Tibetan singing bowls",
  "duration": 60,
  "license": "royalty_free",
  "instrumental": true
}
```

**Response (201 Created):**
```json
{
  "id": "67bb6c4839cf9e1039824bf2",
  "object": "generation",
  "status": "queued",
  "prompt": "Ethereal ambient soundscape with Tibetan singing bowls",
  "duration_sec": 60,
  "duration_units": 1,
  "license": "royalty_free",
  "instrumental": true,
  "credits_reserved": 1,
  "credits_charged": 0,
  "audio_url": null,
  "provider": "mock",
  "model": "soundforge-mock-v1",
  "progress": 0,
  "queued_at": "2026-11-24T14:00:00.000Z"
}
```

### Retrieve Generation (Polling)
```http
GET /v1/generations/67bb6c4839cf9e1039824bf2
Authorization: Bearer sf_live_0a91f4c781bc...
```

### Register Webhook Endpoint
```http
POST /v1/webhook_endpoints
Authorization: Bearer sf_live_0a91f4c781bc...
Content-Type: application/json

{
  "url": "https://my-app.com/api/soundforge-webhook",
  "events": ["generation.succeeded", "generation.failed"]
}
```

---

## 8. Automated Acceptance Test Results

Run backend automated tests:
```bash
npm run test --workspace=backend
```

```
Test Files  3 passed (3)
     Tests  26 passed (26)
  Duration  8.46s
```

### Mandatory Acceptance Criteria Status Table

| # | Acceptance Scenario | Status | Verified Behavior |
| :---: | :--- | :---: | :--- |
| **1** | Full API key secret cannot be retrieved after creation | **PASSED** | Only SHA-256 hash stored in DB; secret never returned on listing. |
| **2** | Revoked keys fail immediately | **PASSED** | Rejection with HTTP 401 `api_key_revoked` on subsequent request. |
| **3** | Key rotation does not cause unintended downtime | **PASSED** | 24h safe overlap period keeps old key valid until `rotatesAt`. |
| **4** | Starter account fires 20 simultaneous requests | **PASSED** | Max 3 parallel slots reserved; remaining 17 receive 429 `parallel_limit_reached`. |
| **5** | Starter with 5 credits fires 10 simultaneous requests | **PASSED** | Exactly available credits reserved; requests exceeding allowance get 429 `insufficient_credits`. |
| **6** | Three simultaneous requests with same Idempotency-Key | **PASSED** | Exactly 1 generation created and charged; duplicates return same payload without double charge. |
| **7** | Reusing Idempotency-Key with different payload | **PASSED** | Returns HTTP 409 `idempotency_conflict`. |
| **8** | Model timeout/failure releases reservations | **PASSED** | Credits refunded in `UsageLedger` and parallel slot freed. |
| **9** | Account B cannot access Account A's generation | **PASSED** | Returns HTTP 404 `resource_not_found` (strict tenant isolation). |
| **10** | Quickstart works with test API key without charge | **PASSED** | Sandbox test key queues jobs with 0 credits charged. |
| **11** | Webhooks recover after temporary downtime | **PASSED** | Manual retry endpoint increments attempt count and redelivers. |
| **12** | Captured old webhook payloads cannot be replayed | **PASSED** | Timestamp tolerance check (300s) rejects expired signatures. |
| **13** | SSRF requests to 169.254.169.254 are rejected | **PASSED** | Returns HTTP 400 `ssrf_blocked`. |
| **14** | Growth downgrade to Starter after 1,500 credits | **PASSED** | 1,500 historical credits preserved; new usage blocked under Starter limit (200). |
| **15** | Starter cannot request full_ownership | **PASSED** | Returns HTTP 422 `license_not_allowed`. |
| **16** | Polling running job does not consume slots/credits | **PASSED** | Read-only GET query does not touch reservations or parallel slots. |

---

## 9. Repository Structure

```
Soundforge/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment, MongoDB, Redis, MinIO, Logger
│   │   ├── controllers/      # Developer & Dashboard REST API controllers
│   │   ├── middleware/       # Auth, ApiKeyAuth, RateLimiter, Idempotency, ErrorHandler
│   │   ├── models/           # Mongoose schemas (User, Account, Plan, ApiKey, Generation...)
│   │   ├── providers/        # MusicProvider interface, MockProvider, ElevenLabs adapter
│   │   ├── queues/           # BullMQ generation & webhook queue definitions
│   │   ├── routes/           # Developer (/v1/*) & Dashboard (/api/v1/*) route trees
│   │   ├── scripts/          # Database seeder (seed.ts)
│   │   ├── services/         # CreditService, GenerationService, StorageService, WebhookService
│   │   ├── tests/            # Acceptance test suite (16 scenarios) & unit tests
│   │   ├── utils/            # Crypto, SSRF validator, Credit calculator, Error envelopes
│   │   ├── app.ts            # Express application configuration
│   │   ├── index.ts          # API server entrypoint
│   │   └── worker.ts         # BullMQ background worker entrypoint
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, AudioPlayer, Modal, Badge
│   │   ├── context/          # AuthContext (JWT session management)
│   │   ├── layouts/          # DashboardLayout, PublicLayout
│   │   ├── pages/            # LandingPage, Auth pages, Studio, API Keys, Usage, Webhooks, Docs
│   │   ├── services/         # Axios API client with automatic token rotation
│   │   ├── types/            # TypeScript data contracts
│   │   └── App.tsx           # Route declarations
│   └── Dockerfile
│
├── docs/
│   └── openapi.yaml          # OpenAPI 3.1 specification
├── docker-compose.yml        # Multi-container orchestration (Mongo rs0, Redis, MinIO, API, Worker, Web)
├── DECISIONS.md              # Architectural decisions, trade-offs, and assumptions
├── AI_USAGE.md               # AI tooling disclosure & corrected implementation mistakes
├── SECURITY.md               # Threat model, SSRF protection, HMAC signing, and auth audit
├── QUICKSTART.md             # 5-minute developer walkthrough
├── DEVELOPMENT_LOG.md        # Chronological development milestone tracking
├── TASKS.md                  # Comprehensive task checklist
└── .env.example              # Environment configuration template
```

---

## 10. License

SoundForge is open-source software licensed under the [MIT License](./LICENSE).
