# SoundForge — Environment Variables Master Reference & Setup Guide

This guide documents every environment variable utilized across the **SoundForge Enterprise AI Music Platform**. Use this reference to configure your local `.env` file and production environments on **Render**, **Vercel**, **MongoDB Atlas**, **Upstash**, and **Resend**.

---

## 1. Inventory Summary Table

| Variable Name | Required? | Service | Default (Local) | Production Value Example |
|---|---|---|---|---|
| `NODE_ENV` | Optional | Core Runtime | `development` | `production` |
| `PORT` | Optional | Express API | `4000` | Automatically assigned by Render (`10000`) |
| `APP_BASE_URL` | Required | Webhook & CORS | `http://localhost:5173` | `https://soundforge-portal.vercel.app` |
| `VITE_API_URL` | Required | Frontend React | `http://localhost:4000` | `https://soundforge-api.onrender.com` |
| `MONGODB_URI` | **Required** | MongoDB Atlas | `mongodb://localhost:27017/soundforge?replicaSet=rs0&directConnection=true` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/soundforge?retryWrites=true&w=majority` |
| `REDIS_URL` | **Required (Prod)** | Upstash Redis | *(Empty for local)* | `rediss://default:xxxx@xxxx.upstash.io:6379` |
| `REDIS_HOST` | Optional (Local) | Local Redis | `localhost` | *(Not used if REDIS_URL is set)* |
| `REDIS_PORT` | Optional (Local) | Local Redis | `6379` | *(Not used if REDIS_URL is set)* |
| `REDIS_PASSWORD` | Optional (Local) | Local Redis | *(Empty)* | *(Not used if REDIS_URL is set)* |
| `JWT_ACCESS_SECRET` | **Required** | Auth Security | `soundforge_super_secure_access_...` | High-entropy 64-char hex string |
| `JWT_REFRESH_SECRET` | **Required** | Auth Security | `soundforge_super_secure_refresh_...` | High-entropy 64-char hex string |
| `JWT_ACCESS_EXPIRY` | Optional | Auth Security | `15m` | `15m` |
| `JWT_REFRESH_EXPIRY` | Optional | Auth Security | `7d` | `7d` |
| `MINIO_ENDPOINT` | **Required** | Storage (MinIO/R2) | `localhost` | `<account_id>.r2.cloudflarestorage.com` |
| `MINIO_PORT` | Optional | Storage (MinIO/R2) | `9000` | `443` |
| `MINIO_USE_SSL` | Optional | Storage (MinIO/R2) | `false` | `true` |
| `MINIO_ACCESS_KEY` | **Required** | Storage (MinIO/R2) | `minioadmin` | `<r2_access_key_id>` |
| `MINIO_SECRET_KEY` | **Required** | Storage (MinIO/R2) | `minioadmin` | `<r2_secret_access_key>` |
| `MINIO_BUCKET_NAME` | Optional | Storage (MinIO/R2) | `soundforge-audio` | `soundforge-audio` |
| `MINIO_PUBLIC_URL` | Optional | Storage (MinIO/R2) | `http://localhost:9000` | Presigned URL domain or custom domain |
| `MUSIC_PROVIDER` | **Required** | Provider Engine | `mock` | `mock` (Free) or `elevenlabs` (Paid) |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs Music | *(Empty)* | `sk_xxxxxxxxxxxxxxxxxxxx` |
| `ELEVENLABS_MODEL_ID` | Optional | ElevenLabs Music | `music_v1` | `music_v1` |
| `MOCK_PROVIDER_LATENCY_MS` | Optional | Mock Engine | `1500` | `1500` |
| `EMAIL_SERVICE_PROVIDER` | Optional | Email Delivery | `mock` | `mock` or `resend` |
| `RESEND_API_KEY` | Optional | Resend Email | *(Empty)* | `re_xxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM` | Optional | Email Delivery | `SoundForge <no-reply@soundforge.ai>` | `SoundForge <no-reply@yourdomain.com>` |
| `WEBHOOK_TIMEOUT_MS` | Optional | Webhook Queue | `10000` | `10000` |
| `WEBHOOK_MAX_RETRIES` | Optional | Webhook Queue | `5` | `5` |

---

## 2. In-Depth Variable Breakdown

### 1. `MONGODB_URI`
* **Purpose**: Connection string for MongoDB database storing users, accounts, generation jobs, idempotency records, and credit ledger.
* **Required**: Yes (both local and production).
* **Service**: MongoDB Atlas (Production) / Docker container (Local).
* **Official Website**: [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
* **Account Creation**:
  1. Visit [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up for a free account.
  2. Select **M0 Free Cluster** (Shared, 512 MB storage).
  3. Choose an AWS or Google Cloud region close to your users (e.g., `us-east-1` or `eu-central-1`).
* **Credentials Generation**:
  1. Under **Database Access**, click **Add New Database User**.
  2. Select **Password Authentication**. Set username (e.g. `soundforge_admin`) and generate a secure password. Give **Read and write to any database** privilege.
  3. Under **Network Access**, click **Add IP Address**. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render web services can connect dynamically.
  4. In **Database Deployments**, click **Connect** &rarr; **Drivers** &rarr; select **Node.js**.
  5. Copy the connection string format:
     ```
     mongodb+srv://soundforge_admin:<password>@cluster0.xxxxx.mongodb.net/soundforge?retryWrites=true&w=majority
     ```
* **Where to Configure**:
  * Local: In `.env` as `mongodb://localhost:27017/soundforge?replicaSet=rs0&directConnection=true`
  * Production: Render Dashboard &rarr; Backend Service &rarr; **Environment** &rarr; `MONGODB_URI`
  * Production: Render Dashboard &rarr; Background Worker &rarr; **Environment** &rarr; `MONGODB_URI`
* **How to Test**:
  Run `npm run seed --workspace=backend` locally or test connection on Render startup. Logs will output: `MongoDB connected successfully`.

---

### 2. `REDIS_URL`
* **Purpose**: Single TLS connection string for Redis used by BullMQ background queue and sliding-window rate limiting.
* **Required**: Required in Production (Local uses default `REDIS_HOST`/`PORT`).
* **Service**: Upstash Redis (Serverless).
* **Official Website**: [https://upstash.com](https://upstash.com)
* **Account Creation**:
  1. Visit [upstash.com](https://upstash.com) and click **Start for Free** (supports GitHub login).
  2. In the Upstash console, click **Create Database**.
  3. Name your database (e.g., `soundforge-redis`).
  4. Select **Regional** and pick the same cloud region as your Render services (e.g., `US-East / N. Virginia`).
  5. Keep TLS enabled. Click **Create**.
* **Credentials Generation**:
  1. In the database overview, scroll down to the **Connect to your database** panel.
  2. Click the **ioredis** or **Node** tab.
  3. Copy the `rediss://...` connection URL:
     ```
     rediss://default:AbCdEf123456@us1-quick-example-32456.upstash.io:6379
     ```
* **Where to Configure**:
  * Local: Leave empty (app uses local Docker Redis on `localhost:6379`).
  * Production: Render Backend Web Service &rarr; **Environment** &rarr; `REDIS_URL`
  * Production: Render Background Worker &rarr; **Environment** &rarr; `REDIS_URL`
* **How to Test**:
  When the backend boots, logs will output: `Connected to Redis server`.

---

### 3. `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`
* **Purpose**: Cryptographic secrets for signing HMAC-SHA256 JWT access and refresh tokens.
* **Required**: Yes.
* **Service**: Internal authentication service.
* **Key Generation**:
  Generate two separate cryptographically secure random 32-byte hex strings in terminal:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
* **Where to Configure**:
  * Local: `.env`
  * Production: Render Backend Web Service &rarr; **Environment**
* **How to Test**:
  Register a user on the dashboard. Inspect the returned JWT format. Verification tests pass in `npm run test --workspace=backend`.

---

### 4. `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` (Audio Storage)
* **Purpose**: S3-compatible object storage for generated WAV audio files and presigned expiring download URLs.
* **Required**: Yes.
* **Service**:
  * Local Development: Local **MinIO** container (preconfigured in Docker Compose).
  * Production: **Cloudflare R2** (Recommended: 10 GB free, **$0 egress bandwidth**) or **Supabase Storage**.
* **Cloudflare R2 Setup (Recommended Free Tier)**:
  1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and create an account.
  2. In the sidebar, navigate to **R2 Object Storage**.
  3. Click **Create Bucket**, name it `soundforge-audio`.
  4. Click **Manage R2 API Tokens** &rarr; **Create API Token**.
  5. Permissions: **Object Read & Write**.
  6. Copy:
     * Access Key ID &rarr; `MINIO_ACCESS_KEY`
     * Secret Access Key &rarr; `MINIO_SECRET_KEY`
     * Endpoint (`<account_id>.r2.cloudflarestorage.com`) &rarr; `MINIO_ENDPOINT`
* **Where to Configure**:
  * Local:
    ```env
    MINIO_ENDPOINT=localhost
    MINIO_PORT=9000
    MINIO_USE_SSL=false
    MINIO_ACCESS_KEY=minioadmin
    MINIO_SECRET_KEY=minioadmin
    MINIO_BUCKET_NAME=soundforge-audio
    ```
  * Production (Render Backend & Worker):
    ```env
    MINIO_ENDPOINT=<your_account_id>.r2.cloudflarestorage.com
    MINIO_PORT=443
    MINIO_USE_SSL=true
    MINIO_ACCESS_KEY=<r2_access_key_id>
    MINIO_SECRET_KEY=<r2_secret_access_key>
    MINIO_BUCKET_NAME=soundforge-audio
    ```
* **How to Test**:
  Queue a generation via the UI or API. The audio file appears in bucket `soundforge-audio`, and clicking "Play" or "Download" loads the track via presigned URL.

---

### 5. `MUSIC_PROVIDER` & `ELEVENLABS_API_KEY`
* **Purpose**: Controls whether AI music generation runs in free deterministic mock mode or dispatches to ElevenLabs Music API.
* **Required**: `MUSIC_PROVIDER` is required (`mock` or `elevenlabs`).
* **Service**: ElevenLabs API (Optional, for real commercial AI generation).
* **Official Website**: [https://elevenlabs.io](https://elevenlabs.io)
* **Registration & API Key Generation**:
  1. Visit [elevenlabs.io](https://elevenlabs.io) and create an account.
  2. Click on your profile picture in the bottom-left corner &rarr; select **Profile + API Key**.
  3. Click the eye icon to view your API key or click **Create New Key**.
  4. Copy the key (`sk_...`).
* **Where to Configure**:
  * Free / Sandbox mode:
    ```env
    MUSIC_PROVIDER=mock
    ```
  * Real ElevenLabs mode:
    ```env
    MUSIC_PROVIDER=elevenlabs
    ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxx
    ELEVENLABS_MODEL_ID=music_v1
    ```
* **How to Test**:
  Generate a song through `/dashboard/generations`. In mock mode, an audible synthesized 44.1kHz WAV track is produced in ~1.5s. In ElevenLabs mode, the real model generates external music.

---

### 6. `VITE_API_URL` (Frontend)
* **Purpose**: Points the React SPA frontend to the Express REST API backend server.
* **Required**: Yes.
* **Service**: Vercel Frontend Deployment.
* **Where to Configure**:
  * Local: `http://localhost:4000` (in `frontend/.env.local` or defaults).
  * Production: Vercel Dashboard &rarr; Project Settings &rarr; **Environment Variables** &rarr;
    ```
    VITE_API_URL=https://<your-render-backend-name>.onrender.com
    ```
* **How to Test**:
  Open the deployed Vercel frontend URL in browser. Network requests in Chrome DevTools should target your Render backend URL.

---

### 7. `RESEND_API_KEY` (Transactional Email - Optional)
* **Purpose**: Sends email verification tokens and password reset instructions to users.
* **Required**: Optional (Mock mode auto-returns tokens for instant developer verification).
* **Service**: Resend.
* **Official Website**: [https://resend.com](https://resend.com)
* **Account Creation & Key Generation**:
  1. Go to [resend.com](https://resend.com) and sign up with GitHub or email.
  2. In the Resend dashboard, click **API Keys** in the sidebar.
  3. Click **Create API Key**, name it `SoundForge Production`, select **Full access**.
  4. Copy key (`re_...`).
* **Where to Configure**:
  * Local: Keep `EMAIL_SERVICE_PROVIDER=mock`.
  * Production: Render Backend Web Service &rarr; `RESEND_API_KEY=re_...` and `EMAIL_SERVICE_PROVIDER=resend`.
* **How to Test**:
  Register an account with your personal email. Check your inbox for the verification email.
