# SoundForge — Environment Setup & Deployment Checklist

Use this checklist to track your progress as you set up SoundForge locally and deploy to production.

---

## Phase 1: Local Development Setup
- [ ] **Node.js & Docker Verified**: Node.js v20+ and Docker Desktop installed.
- [ ] **Repository Cloned**: `git clone https://github.com/AbhinavY0318/Soundforge.git`
- [ ] **Local .env Created**: Copied from `.env.example`.
- [ ] **Docker Containers Running**: `docker-compose up -d --build` (MongoDB, Redis, MinIO, Backend, Worker, Frontend).
- [ ] **Database Seeded**: `docker-compose exec backend npm run seed` successfully executed.
- [ ] **Local Test Suite Passed**: `npm run test --workspace=backend` passes all 26 tests in Vitest.
- [ ] **Dashboard Verified**: Accessible on `http://localhost:3000` with login `developer@soundforge.ai`.
- [ ] **Mock Audio Verified**: Tested track generation in Studio; audio plays in browser.

---

## Phase 2: MongoDB Atlas Database (Free Tier)
- [ ] **MongoDB Atlas Account Created**: Registered at [mongodb.com/atlas](https://www.mongodb.com/atlas).
- [ ] **M0 Free Cluster Deployed**: Selected region close to Render servers (e.g. `AWS us-east-1`).
- [ ] **Database User Configured**: Created user with password and read/write privileges.
- [ ] **IP Whitelist Set to 0.0.0.0/0**: Configured in Network Access to allow dynamic cloud connections.
- [ ] **Connection String Saved**: Copied `mongodb+srv://...` URI.

---

## Phase 3: Upstash Redis (Serverless TLS)
- [ ] **Upstash Account Created**: Registered at [upstash.com](https://upstash.com).
- [ ] **Redis Database Created**: Selected Regional database with TLS enabled.
- [ ] **Rediss Connection String Copied**: Copied `rediss://default:...@...upstash.io:6379`.

---

## Phase 4: Audio Object Storage (Cloudflare R2)
- [ ] **Cloudflare Account Created**: Registered at [dash.cloudflare.com](https://dash.cloudflare.com).
- [ ] **R2 Bucket Created**: Bucket named `soundforge-audio`.
- [ ] **R2 API Token Generated**: Created token with Object Read & Write permissions.
- [ ] **S3 Credentials Saved**:
  - [ ] Endpoint URL (`<account_id>.r2.cloudflarestorage.com`)
  - [ ] Access Key ID
  - [ ] Secret Access Key

---

## Phase 5: AI Music Generation Provider
- [ ] **Provider Selected**:
  - [ ] **Option A (Free)**: `MUSIC_PROVIDER=mock` (Zero external cost, synthetic PCM audio).
  - [ ] **Option B (Paid)**: `MUSIC_PROVIDER=elevenlabs` with `ELEVENLABS_API_KEY`.
- [ ] **ElevenLabs API Key Verified** (If using Option B).

---

## Phase 6: Render Express REST API (Web Service)
- [ ] **Render Account Created**: Connected GitHub account at [render.com](https://render.com).
- [ ] **Web Service Created**: Pointed to `Soundforge` repository.
- [ ] **Root Directory Configured**: Set to `backend`.
- [ ] **Build Command Set**: `npm install && npm run build`
- [ ] **Start Command Set**: `npm run start`
- [ ] **Environment Variables Added**:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000`
  - [ ] `MONGODB_URI`
  - [ ] `REDIS_URL`
  - [ ] `JWT_ACCESS_SECRET` (64 hex characters)
  - [ ] `JWT_REFRESH_SECRET` (64 hex characters)
  - [ ] `MINIO_ENDPOINT`, `MINIO_PORT=443`, `MINIO_USE_SSL=true`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
  - [ ] `MUSIC_PROVIDER`
- [ ] **Deployment Succeeded**: Backend logs display `Server listening on port 10000` and `Connected to Redis`.
- [ ] **Public URL Saved**: `https://<service-name>.onrender.com`

---

## Phase 7: Render BullMQ Background Worker
- [ ] **Background Worker Created**: Clicked **New +** &rarr; **Background Worker** on Render.
- [ ] **Root Directory Configured**: `backend`.
- [ ] **Start Command Set**: `npm run start:worker`
- [ ] **Environment Variables Synchronized**: Exact same variables as Web Service.
- [ ] **Worker Active**: Logs display `Generation worker successfully registered to "generation-jobs" queue`.

---

## Phase 8: Vercel Frontend Deployment
- [ ] **Vercel Account Created**: Registered at [vercel.com](https://vercel.com).
- [ ] **Project Imported**: Connected `Soundforge` repository.
- [ ] **Framework Preset**: Selected `Vite`.
- [ ] **Root Directory Set**: `frontend`.
- [ ] **Environment Variable Set**:
  - [ ] `VITE_API_URL=https://<your-render-backend>.onrender.com`
- [ ] **Deployment Succeeded**: Assigned live URL `https://<your-project>.vercel.app`.

---

## Phase 9: URL Wiring & Database Seeding
- [ ] **Render APP_BASE_URL Updated**: Set `APP_BASE_URL=https://<your-project>.vercel.app` in Render Web Service.
- [ ] **Production Database Seeded**: Executed `npm run seed` to insert plans and default admin account.

---

## Phase 10: Live Production Verification
- [ ] **Frontend Loads**: Home page and navigation render smoothly.
- [ ] **User Registration / Login**: Successfully authenticate into developer dashboard.
- [ ] **Create Test API Key**: Reveal and copy test key.
- [ ] **Dispatch Music Generation**: Submit track prompt via studio; job transitions: `queued` &rarr; `running` &rarr; `succeeded`.
- [ ] **Audio Playback Verified**: Waveform visualizer animates and audio streams from cloud storage.
- [ ] **API Endpoint Verified**: cURL `POST /v1/generations` from terminal with test API key returns HTTP 201.
