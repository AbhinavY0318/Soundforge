# SoundForge — Simple, Low-Cost Cloud Deployment Guide

This guide details a **beginner-friendly, low-cost cloud deployment architecture** for SoundForge.

> **Zero Complex Cloud Infrastructure:** No AWS IAM, no Kubernetes, no Terraform, and no complex VPC networking. Every service runs on managed, developer-first platforms with generous free tiers.

---

## 1. Production Architecture Overview

```mermaid
flowchart TD
    Client["User Browser"] --> Vercel["Vercel (React Frontend SPA)"]
    Vercel --> RenderAPI["Render Web Service (Express REST API)"]
    
    RenderAPI --> Atlas["MongoDB Atlas (Free M0 Cluster)"]
    RenderAPI --> Upstash["Upstash Redis (Serverless TLS Queue)"]
    
    Upstash --> RenderWorker["Render Background Worker (BullMQ Processor)"]
    RenderWorker --> Atlas
    RenderWorker --> Storage["Cloudflare R2 / S3 Object Storage"]
    RenderWorker --> AI["ElevenLabs Music API / Mock Engine"]
    
    RenderAPI -.-> Resend["Resend (Transactional Email)"]
    RenderWorker -.-> WebhookDst["Customer Webhook Endpoints"]
```

---

## 2. Service Cost & Free Tier Breakdown

| Component | Platform | Free Tier Allowance | Est. Monthly Cost |
|---|---|---|---|
| **Database** | MongoDB Atlas | 512 MB storage, shared RAM, replica set transactions included | **$0 / month** |
| **Queue / Cache** | Upstash Redis | 10,000 commands / day, TLS encryption | **$0 / month** |
| **Audio Storage** | Cloudflare R2 | 10 GB storage, **$0 egress bandwidth fees** | **$0 / month** |
| **REST API Server** | Render (Web Service) | Free tier (512 MB RAM, sleeps on inactivity) or $7/mo Starter | **$0 to $7 / mo** |
| **Queue Worker** | Render (Background Worker) | Dedicated worker instance | **$7 / mo** (Render requires Starter for persistent workers) |
| **Frontend Portal** | Vercel | 100 GB bandwidth, unlimited preview deployments, global CDN | **$0 / month** |
| **Transactional Email** | Resend | 3,000 emails / month (100 emails / day) | **$0 / month** |
| **AI Music Synthesis** | Mock Engine / ElevenLabs | Mock: **100% Free**; ElevenLabs: Free trial then pay-as-you-go | **$0** (Mock) |

*Total Minimum Monthly Cost:* **$0 to $14 / month** depending on whether free or continuous 24/7 worker tiers are chosen.

---

## 3. Step-by-Step Deployment Instructions

### Stage A: Create MongoDB Atlas Database
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and log in.
2. Click **Create a Deployment**.
3. Choose the **M0 Free** cluster tier.
4. Select a cloud provider region (e.g. `AWS us-east-1` or `Google Cloud us-central1`).
5. Name cluster `soundforge-cluster` and click **Create**.
6. **Set Database User**:
   * Navigate to **Security** &rarr; **Database Access**.
   * Click **Add New Database User**.
   * Username: `soundforge_user`
   * Password: Click **Autogenerate Secure Password** and copy it.
   * Privileges: **Read and write to any database**.
7. **Configure Network Access**:
   * Navigate to **Security** &rarr; **Network Access**.
   * Click **Add IP Address**.
   * Click **Allow Access from Anywhere** (`0.0.0.0/0`). (Required for dynamic cloud servers like Render).
8. **Get Connection String**:
   * Under **Deployments**, click **Connect** &rarr; **Drivers** (Node.js).
   * Copy connection string:
     ```
     mongodb+srv://soundforge_user:<password>@cluster0.xxxxx.mongodb.net/soundforge?retryWrites=true&w=majority
     ```
   * Replace `<password>` with your database password.

---

### Stage B: Create Upstash Redis Database
1. Go to [upstash.com](https://upstash.com) and log in with GitHub or email.
2. Click **Create Database**.
3. Name: `soundforge-redis`.
4. Type: **Regional** (pick the same region as your backend, e.g. `us-east-1`).
5. TLS: **Enabled**.
6. Click **Create**.
7. In the database dashboard, scroll to **Connect to your database** &rarr; select **ioredis** or **Node.js**.
8. Copy the single `rediss://...` connection string:
   ```
   rediss://default:AbCdEf123456@us1-quick-example-32456.upstash.io:6379
   ```

---

### Stage C: Configure Audio Storage (Cloudflare R2 vs Cloudinary)

#### Why Cloudflare R2 is the Recommended Audio Storage:
* **Audio Characteristics**: SoundForge generates high-fidelity 44.1kHz 16-bit PCM RIFF WAV audio (~10 MB per minute). Cloudinary classifies audio as raw assets, and its 25 monthly free transformation credits are quickly depleted by audio streaming.
* **Cost**: Cloudflare R2 provides **10 GB free storage** and **ZERO bandwidth egress charges**. You pay nothing for downloads.
* **Compatibility**: Cloudflare R2 implements the exact standard S3 API, meaning SoundForge's MinIO storage client works with **0 code changes**.

#### Setting Up Cloudflare R2:
1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com).
2. In the left navigation, click **R2 Object Storage**.
3. Click **Create Bucket**, name it `soundforge-audio`.
4. In the top right, click **Manage R2 API Tokens** &rarr; **Create API Token**.
5. Token Name: `soundforge-token`.
6. Permissions: **Object Read & Write**.
7. Click **Create API Token**.
8. Record the following values:
   * **Endpoint**: `<your_account_id>.r2.cloudflarestorage.com` (Do not include `https://` in `MINIO_ENDPOINT`)
   * **Access Key ID**: `MINIO_ACCESS_KEY`
   * **Secret Access Key**: `MINIO_SECRET_KEY`

---

### Stage D: Configure Music Provider (ElevenLabs or Free Mock)

#### Option 1: Free Mock Provider (Default)
Keep `MUSIC_PROVIDER=mock`. Generates synthesized 44.1kHz WAV harmonic chords without needing any external paid API key or subscription.

#### Option 2: ElevenLabs Commercial Music Generation
1. Visit [elevenlabs.io](https://elevenlabs.io) and create an account.
2. Open profile menu (bottom-left) &rarr; **Profile + API Key**.
3. Copy API Key (`sk_...`).
4. Set in Render:
   * `MUSIC_PROVIDER=elevenlabs`
   * `ELEVENLABS_API_KEY=sk_...`
   * `ELEVENLABS_MODEL_ID=music_v1`

---

### Stage E: Configure Resend Transactional Email (Optional)
1. Go to [resend.com](https://resend.com) and sign in.
2. Click **API Keys** in sidebar &rarr; **Create API Key**.
3. Name: `SoundForge Production`, Permission: **Full Access**.
4. Copy key (`re_...`).
5. (Optional) Under **Domains**, add your custom domain to send emails from your own address (e.g. `support@yourdomain.com`).

---

### Stage F: Deploy Express REST Backend on Render
1. Push your repository to GitHub: `https://github.com/AbhinavY0318/Soundforge`.
2. Go to [render.com](https://render.com) and sign in with GitHub.
3. In the Render dashboard, click **New +** &rarr; **Web Service**.
4. Select your **SoundForge** GitHub repository.
5. Configure the Web Service:
   * **Name**: `soundforge-api`
   * **Region**: Same region as MongoDB Atlas & Upstash (e.g. `Ohio` or `Oregon` or `Frankfurt`)
   * **Branch**: `main`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start` (runs `node dist/index.js`)
   * **Instance Type**: `Free` (or `Starter` $7/mo for 24/7 non-sleeping uptime)
6. Scroll down to **Environment Variables** and add:
   * `NODE_ENV`: `production`
   * `PORT`: `10000`
   * `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   * `REDIS_URL`: `<Your Upstash rediss://... Connection String>`
   * `JWT_ACCESS_SECRET`: `<Generate a random 64-char string>`
   * `JWT_REFRESH_SECRET`: `<Generate a separate random 64-char string>`
   * `MINIO_ENDPOINT`: `<account_id>.r2.cloudflarestorage.com`
   * `MINIO_PORT`: `443`
   * `MINIO_USE_SSL`: `true`
   * `MINIO_ACCESS_KEY`: `<R2 Access Key>`
   * `MINIO_SECRET_KEY`: `<R2 Secret Key>`
   * `MINIO_BUCKET_NAME`: `soundforge-audio`
   * `MUSIC_PROVIDER`: `mock` (or `elevenlabs`)
   * `APP_BASE_URL`: `https://your-soundforge-portal.vercel.app` (updated after Vercel step)
7. Click **Create Web Service**.
8. Once deployed, Render provides your public URL:
   ```
   https://soundforge-api.onrender.com
   ```

---

### Stage G: Deploy BullMQ Queue Worker on Render
1. In Render Dashboard, click **New +** &rarr; **Background Worker**.
2. Select your **SoundForge** GitHub repository.
3. Configure the Background Worker:
   * **Name**: `soundforge-worker`
   * **Region**: Same region as API
   * **Branch**: `main`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:worker` (runs `node dist/worker.js`)
   * **Instance Type**: `Starter` ($7/mo)
4. Add the **exact same environment variables** as the Web Service (`MONGODB_URI`, `REDIS_URL`, `MINIO_*`, `MUSIC_PROVIDER`, `JWT_*`).
5. Click **Create Background Worker**.

---

### Stage H: Deploy React Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** &rarr; **Project**.
3. Import the `Soundforge` repository.
4. In project configuration:
   * **Framework Preset**: `Vite`
   * **Root Directory**: Click **Edit** &rarr; select `frontend` &rarr; click **Continue**.
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Install Command**: `npm install`
5. Expand **Environment Variables** and add:
   * `VITE_API_URL`: `https://soundforge-api.onrender.com` (Your Render API URL from Stage F)
6. Click **Deploy**.
7. Vercel builds the SPA in ~30 seconds and assigns your live URL:
   ```
   https://soundforge-portal.vercel.app
   ```

---

### Stage I: Wire URLs and CORS
1. In your **Render Web Service** settings:
   * Update `APP_BASE_URL` to your Vercel URL (`https://soundforge-portal.vercel.app`).
   * Save changes. Render redeploys automatically.
2. In your **MongoDB Atlas** database:
   * Connect with MongoDB Compass or Render shell and run the seed script:
     ```bash
     npm run seed --workspace=backend
     ```
   * This populates standard subscription tiers (**Sandbox**, **Starter**, **Growth**) and demo account `developer@soundforge.ai`.

---

## 4. End-to-End Production Verification

1. **Access Web App**: Open your Vercel URL in your browser.
2. **Log In**: Use demo account `developer@soundforge.ai` / `SoundForge2026!` or register a new workspace.
3. **Generate Music**: Go to **Music Studio** &rarr; submit a prompt.
4. **Inspect BullMQ Worker**: Check Render worker logs &rarr; observe job picked up, synthesized, and uploaded to storage.
5. **Verify Audio Player**: Click play in the dashboard &rarr; verify the waveform equalizer animates and the audio streams cleanly.
6. **Test API Keys**: Go to **API Keys** &rarr; copy test key &rarr; run a cURL command from your terminal against your Render backend endpoint.
