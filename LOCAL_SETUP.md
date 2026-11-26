# SoundForge — Local Development Setup Guide

This guide walks you through running the complete **SoundForge Enterprise AI Music Platform** entirely on your local machine using **Docker Compose** or local Node.js processes.

> **Zero External Cloud Dependencies:** In local development mode, SoundForge requires **no external cloud accounts**, **no paid API keys**, and **no third-party cloud services**. Everything runs inside local containers.

---

## 1. Prerequisites

Ensure you have installed:
* **Node.js**: v20 or v22+
* **npm**: v10+
* **Docker & Docker Compose**: (Docker Desktop on Windows/macOS or Docker Engine on Linux)
* **Git**

---

## 2. Quickstart with Docker Compose (Recommended)

Docker Compose starts all 6 core services with a single command:
1. **MongoDB 7.0 (Replica Set `rs0`)** — Supports multi-document transactions.
2. **Redis 7.2** — Distributed locks, BullMQ queue, and sliding-window rate limiting.
3. **MinIO Object Storage** — S3-compatible audio storage on port 9000 with bucket auto-initialization.
4. **Backend API Service** — Express REST API on `http://localhost:4000`.
5. **Background Queue Worker** — BullMQ generation worker.
6. **Frontend Portal** — React + Vite SPA on `http://localhost:3000`.

### Step 1: Clone and Configure Environment
```bash
# 1. Clone repository
git clone https://github.com/AbhinavY0318/Soundforge.git
cd Soundforge

# 2. Copy environment template
cp .env.example .env
```

### Step 2: Launch All Services
```bash
docker-compose up -d --build
```

### Step 3: Seed Database Plans & Demo Accounts
Wait ~10 seconds for MongoDB replica set to initialize, then run:
```bash
docker-compose exec backend npm run seed
```

### Step 4: Access Local Services
* **Developer Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:4000](http://localhost:4000)
* **Swagger API Documentation**: [http://localhost:4000/docs](http://localhost:4000/docs)
* **MinIO Storage Console**: [http://localhost:9001](http://localhost:9001) (User: `minioadmin` / Pass: `minioadmin`)

### Pre-Seeded Demo Account
* **Email**: `developer@soundforge.ai`
* **Password**: `SoundForge2026!`
* **Tier**: STARTER (200 credits, 3 parallel slots, test & live keys ready)

---

## 3. Alternative: Running Natively with Node.js (Fast Development)

If you prefer hot-reloading code directly on your host machine while keeping infrastructure (MongoDB, Redis, MinIO) in Docker:

### Step 1: Start Supporting Infrastructure Only
```bash
# If using MongoDB Atlas, simply start Redis and MinIO:
docker-compose up -d redis minio

# If running local MongoDB as well:
docker-compose up -d mongodb redis minio
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Seed Database
```bash
npm run seed --workspace=backend
```

### Step 4: Start Backend & Queue Worker (Terminal 1)
```bash
npm run dev --workspace=backend
```
* Backend starts on `http://localhost:4000` with automatic TypeScript watch reloading.
* In a separate tab, you can also start the dedicated worker process:
```bash
npm run dev:worker --workspace=backend
```

### Step 5: Start Frontend Portal (Terminal 2)
```bash
npm run dev --workspace=frontend
```
* Frontend starts on `http://localhost:5173`. Open your browser and log in with `developer@soundforge.ai`.

---

## 4. Running Automated Tests

Run the test suites locally to verify concurrency controls, credit reservations, and security protections:

```bash
# Run backend test suite (26 tests covering all 16 acceptance criteria)
npm run test --workspace=backend

# Run frontend test suite (2 unit tests)
npm run test --workspace=frontend

# Verify full production builds
npm run build --workspace=backend
npm run build --workspace=frontend
```

---

## 5. Local Mock Music Generation

In local development, `MUSIC_PROVIDER=mock` is enabled by default.
* Synthesizes genuine 44.1kHz 16-bit mono PCM RIFF WAV audio with audible musical chords.
* Does not call external APIs.
* Uploads the generated `.wav` to local MinIO storage.
* Produces expiring signed URLs (`http://localhost:9000/soundforge-audio/...`).
* Perfect for offline development, automated tests, and UI demos.
