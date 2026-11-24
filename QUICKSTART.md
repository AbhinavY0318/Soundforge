# SoundForge Developer Quickstart Guide (QUICKSTART.md)

Generate your first studio-quality AI music track in under 5 minutes using the SoundForge REST API.

---

## Prerequisites

- Node.js v22+ or cURL installed.
- SoundForge server running locally at `http://localhost:4000` (or your production URL).

---

## Step 1: Create Your Account & Generate an API Key

1. Open the SoundForge Developer Dashboard at `http://localhost:5173`.
2. Sign up or log in with default demo credentials:
   - **Email:** `developer@soundforge.ai`
   - **Password:** `SoundForge2026!`
3. Navigate to **API Keys** (`/dashboard/api-keys`).
4. Click **Generate New Key**:
   - Choose **Test Mode** (`sf_test_...`) for free experimentation, or **Live Mode** (`sf_live_...`) for commercial synthesis.
   - Click **Create Key**.
5. **Copy your secret key immediately.** It will not be shown again!

Export your key in your terminal:
```bash
export SOUNDFORGE_API_KEY="sf_test_YOUR_GENERATED_KEY"
```

---

## Step 2: Queue a Music Generation Job

Send a `POST` request to `/v1/generations`. Always supply an `Idempotency-Key` header to safely retry requests without double-billing:

```bash
curl -X POST http://localhost:4000/v1/generations \
  -H "Authorization: Bearer $SOUNDFORGE_API_KEY" \
  -H "Idempotency-Key: my_unique_track_001" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Uplifting futuristic synthwave track with warm analog arpeggios and punchy drums",
    "duration": 60,
    "license": "royalty_free",
    "instrumental": true
  }'
```

### Response (HTTP 201 Created)
```json
{
  "id": "67bb6c4839cf9e1039824bf2",
  "object": "generation",
  "status": "queued",
  "prompt": "Uplifting futuristic synthwave track with warm analog arpeggios and punchy drums",
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

---

## Step 3: Monitor Generation Status

Poll the generation using its ID. Polling running jobs is **free** and does not consume concurrency slots:

```bash
curl -X GET http://localhost:4000/v1/generations/67bb6c4839cf9e1039824bf2 \
  -H "Authorization: Bearer $SOUNDFORGE_API_KEY"
```

When generation succeeds:
```json
{
  "id": "67bb6c4839cf9e1039824bf2",
  "object": "generation",
  "status": "succeeded",
  "prompt": "Uplifting futuristic synthwave track with warm analog arpeggios and punchy drums",
  "duration_sec": 60,
  "duration_units": 1,
  "license": "royalty_free",
  "instrumental": true,
  "credits_reserved": 1,
  "credits_charged": 1,
  "audio_url": "http://localhost:9000/soundforge-audio/accounts/.../67bb6c4839cf9e1039824bf2.wav?X-Amz-Signature=...",
  "provider": "mock",
  "model": "soundforge-mock-v1",
  "progress": 100,
  "queued_at": "2026-11-24T14:00:00.000Z",
  "completed_at": "2026-11-24T14:00:02.000Z"
}
```

---

## Step 4: Stream or Download Generated Audio

Use the `audio_url` from the response to stream or download your generated audio file:
```bash
curl -O "http://localhost:9000/soundforge-audio/accounts/.../67bb6c4839cf9e1039824bf2.wav?X-Amz-Signature=..."
```

---

## Step 5: (Optional) Set Up Asynchronous Webhooks

Instead of polling, configure a webhook endpoint to receive immediate notifications when jobs complete:

```bash
curl -X POST http://localhost:4000/v1/webhook_endpoints \
  -H "Authorization: Bearer $SOUNDFORGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/webhooks/soundforge",
    "events": ["generation.succeeded", "generation.failed"]
  }'
```

---

## Step 6: Check Your Remaining Allowance

Check your monthly allowance, current credit balance, and active concurrency slots:

```bash
curl -X GET http://localhost:4000/v1/usage \
  -H "Authorization: Bearer $SOUNDFORGE_API_KEY"
```

### Response
```json
{
  "object": "usage",
  "plan": {
    "name": "STARTER",
    "display_name": "Starter",
    "monthly_allowance": 200,
    "parallel_limit": 3,
    "requests_per_hour": 300
  },
  "credits": {
    "monthly_allowance": 200,
    "credits_used": 1,
    "credits_reserved": 0,
    "total_consumed": 1,
    "credits_remaining": 199,
    "overage_used": 0,
    "overage_enabled": false
  },
  "concurrency": {
    "active_jobs": 0,
    "parallel_limit": 3,
    "slots_available": 3
  }
}
```

Congratulations! You have successfully integrated SoundForge into your application.
