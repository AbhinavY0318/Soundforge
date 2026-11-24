# Architectural Decisions & Technical Trade-offs (DECISIONS.md)

This document records the core architectural decisions, alternatives evaluated, technical trade-offs, and operational assumptions made while designing and building the SoundForge platform.

---

## 1. Decision 1: Two-Phase Distributed Locking for Atomic Credit Reservations & Parallel Concurrency

### Context
In high-throughput developer platforms, multiple API generation requests can arrive simultaneously for the same account. A naive `find` followed by `save` check suffers from a classic Time-of-Check to Time-of-Use (TOCTOU) race condition, resulting in concurrent overspending beyond plan allowances and parallel job flooding.

### Alternatives Considered
1. **Pessimistic MongoDB Transactions with Isolation Level Snapshot:** Requires replica set configuration everywhere and can result in `WriteConflict` retry storms under high load.
2. **Simple MongoDB Conditional Updates (`$inc` with `$lt` condition):** Insufficient on its own because parallel limits require counting active records across the `Generation` collection while simultaneously verifying net credit balance from the `UsageLedger`.
3. **Redis Token Bucket Alone:** Separates state from the database of record, risking drift if Redis restarts or crashes.

### Decision
Implement a **hybrid two-phase lock** in `CreditService`:
1. Intra-process async mutex queue per `accountId` to guarantee serial request evaluation inside each Node process.
2. Distributed Redis lock (`SET lock:account:{id} {token} NX PX {ttl}`) with safe Lua release script for multi-instance cluster coordination.
3. Inside the lock:
   - Count active parallel generations (`queued` + `running`) against `plan.parallelLimit`.
   - Calculate consumed credits from `UsageLedger` against `plan.monthlyAllowance`.
   - Atomically create the `Generation` record and write a `reservation` entry into `UsageLedger`.

### Trade-offs & Consequences
- **Positive:** Guarantees zero duplicate billing and exact parallel slot enforcement, verified in Acceptance Test 4 (20 simultaneous requests) and Acceptance Test 5 (10 simultaneous requests with 5 credits).
- **Negative:** Adds a slight serialization delay (~10–25ms) per account when concurrent requests hit simultaneously. Acceptable because requests for *different* accounts remain completely independent and parallel.

---

## 2. Decision 2: API Key Architecture: Hashing, Prefixes & Zero-Downtime Rotation

### Context
API keys are long-lived machine-to-machine credentials. Plaintext storage exposes accounts to credential leaks if database snapshots or logs are compromised. Furthermore, revoking keys during key rotation breaks live integrations.

### Alternatives Considered
1. **Bcrypt Hashing for API Keys:** While standard for user passwords, bcrypt requires ~100–300ms of CPU compute per request. For developer APIs processing hundreds of requests per second, bcrypt introduces unacceptable latency.
2. **Reversible Encryption (AES-GCM):** If the application key is leaked, all API secrets can be decrypted.

### Decision
1. Generate cryptographically random 24-byte keys with distinctive prefixes: `sf_test_...` and `sf_live_...`.
2. Compute a SHA-256 hash (`hashSha256(fullKey)`) upon creation. Store **only** `hashedSecret` in MongoDB.
3. Expose only safe prefix `sf_live_xxxx...` on subsequent reads. The full key is returned **strictly once** in the creation response.
4. Support **Zero-Downtime Safe Rotation:**
   - When rotating, the existing key is marked as `status: 'rotating'` with a configurable `rotatesAt` timestamp (default: 24 hours).
   - A new key is generated and returned.
   - During the overlap period, both keys authenticate requests. After `rotatesAt`, the old key is automatically revoked.

---

## 3. Decision 3: Idempotency Semantics with Canonical JSON Hashing

### Context
Network retries by automated clients can cause duplicate payments and double-charging if requests are processed more than once.

### Alternatives Considered
1. **Key-only Deduplication (without body validation):** If a client accidentally reuses an `Idempotency-Key` with different music parameters, returning the previous cached result would silently drop the new track request.

### Decision
1. Extract `Idempotency-Key` header on `POST /v1/generations`.
2. Canonicalize JSON payload (recursive alphabetical key sorting) and compute SHA-256 hash.
3. Atomically upsert an `IdempotencyRecord` with compound unique index `{ accountId: 1, idempotencyKey: 1 }`.
4. Enforce strict behavior:
   - **Same key + Same payload:** Returns the original generation record (HTTP 201/200) with header `Idempotent-Replay: true` without double billing.
   - **Same key + Different payload:** Rejects immediately with **HTTP 409 Conflict** (`idempotency_conflict`).
   - **Concurrent duplicate in-flight:** Waits briefly for the initial request to complete or returns 409 in-flight notice.
5. MongoDB TTL index automatically cleans up records after 24 hours.

---

## 4. Decision 4: Multi-Layer SSRF Firewall for Webhook Deliveries

### Context
Allowing users to specify arbitrary webhook destination URLs introduces Server-Side Request Forgery (SSRF) vulnerabilities, potentially exposing internal services, Docker networks, cloud instance metadata, and Kubernetes APIs.

### Alternatives Considered
1. **RegEx Domain Whitelist:** Inflexible for public developer platforms.
2. **Simple Hostname Blacklist (`localhost`):** Trivial to bypass via DNS rebinding, decimal/hex IP encodings, IPv6 loopbacks, or custom domains resolving to `127.0.0.1` or `169.254.169.254`.

### Decision
Implement multi-layer SSRF validation in `backend/src/utils/ssrf.ts`:
1. Parse URL protocol: Only `http:` and `https:` permitted.
2. Resolve DNS hostnames to **all** underlying IPv4 and IPv6 addresses before opening socket connections.
3. Parse resolved IPs using `ipaddr.js` and reject any address matching:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`)
   - Link-local and cloud metadata (`169.254.0.0/16`, `fe80::/10`, specifically `169.254.169.254`)
   - Carrier-grade NAT (`100.64.0.0/10`)
   - Broadcast and unspecified addresses (`0.0.0.0`, `255.255.255.255`)

---

## 5. Decision 5: Presigned S3 Audio Storage with Configurable Expiration

### Context
Streaming multi-megabyte audio files directly through the Node.js API server consumes server bandwidth and ties up event-loop worker sockets.

### Alternatives Considered
1. **Direct Public S3 Buckets:** Allows anyone with the URL to access tracks without tenant isolation.
2. **Proxying Audio via Express Streaming:** Unnecessary load on application servers.

### Decision
1. Persist generated audio directly into MinIO S3 object storage under tenant-isolated paths: `accounts/{accountId}/generations/{generationId}.wav`.
2. Generate **presigned URLs with configurable expiration** (default: 15 minutes / 900 seconds) using `StorageService.getSignedAudioUrl`.
3. When clients fetch generation details via `GET /v1/generations/:id`, the presigned URL is dynamically refreshed if expired.

---

## 6. Decision 6: Plan Downgrade & Historical Ledger Policy

### Context
What happens when a Growth customer consumes 1,500 credits and then downgrades to Starter (which has a 200 credit monthly allowance)?

### Decision (Acceptance Test 14 Policy)
1. **Never erase historical usage:** All `UsageLedger` entries remain immutable.
2. **Enforce allowance boundary on downgrade:** Because 1,500 credits consumed $\ge$ 200 credits allowance, the new plan's allowance is treated as exhausted for the remainder of the active billing period.
3. New generation requests will return **HTTP 429 Insufficient Credits** until the next monthly billing cycle resets (or until overage is enabled if supported).

---

## 7. Features Intentionally Not Implemented

1. **Credit Card Payment Gateway (Stripe Live Webhook Hookup):** Real credit card charging was omitted to keep setup frictionless in testing and sandbox environments; the platform manages credit ledger and plan tiers internally.
2. **Continuous Music Streaming Protocol (RTSP/HLS Chunking):** Generations produce complete audio tracks (30s to 180s) rather than live audio streaming protocols.
