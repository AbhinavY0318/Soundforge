import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Zap,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('quickstart');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const quickstartCurl = `curl -X POST https://api.soundforge.ai/v1/generations \\
  -H "Authorization: Bearer sf_test_5190fde4..." \\
  -H "Idempotency-Key: client_order_1001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Cinematic lo-fi hip hop study beat with warm piano chords",
    "duration": 60,
    "license": "royalty_free",
    "instrumental": true
  }'`;

  const pollCurl = `curl -X GET https://api.soundforge.ai/v1/generations/6b059e111d33b7d16ae93f34 \\
  -H "Authorization: Bearer sf_test_5190fde4..."`;

  const webhookVerifyNode = `import crypto from 'crypto';

function verifySoundForgeWebhook(payloadString, signatureHeader, secret) {
  // SoundForge-Signature: t=1700000000,v1=9f86d081884c7d659a...
  const parts = signatureHeader.split(',');
  const t = parts.find(p => p.startsWith('t=')).substring(2);
  const v1 = parts.find(p => p.startsWith('v1=')).substring(3);

  // Guard against replay attacks (5 minutes tolerance window)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(t, 10)) > 300) {
    throw new Error('Webhook timestamp outside acceptable tolerance window');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${t}.\${payloadString}\`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}`;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">API Documentation & Quickstart</h1>
          <p className="text-xs text-text-secondary mt-1">
            Complete developer reference for music generation, idempotency, webhook security, and rate limiting.
          </p>
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-accent-indigo border border-white/8 rounded-xl text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Interactive Swagger UI (/docs)</span>
        </a>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs border-b border-white/5">
        {[
          { id: 'quickstart', label: 'Quickstart' },
          { id: 'generations', label: 'Generations API' },
          { id: 'formulas', label: 'Credit Formulas' },
          { id: 'webhooks', label: 'Webhook Verification' },
          { id: 'errors', label: 'Error Codes' },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              activeSection === sec.id
                ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* 5-Minute Developer Quickstart */}
      {(activeSection === 'quickstart' || activeSection === 'all') && (
        <div className="surface-card p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">5-Minute Developer Quickstart</h2>
              <p className="text-xs text-text-secondary">Generate and stream your first AI track in under 5 minutes</p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent-violet/20 text-accent-violet text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-semibold text-white">Obtain Test API Key</h3>
            </div>
            <p className="text-xs text-text-secondary pl-7 leading-relaxed">
              Navigate to the <a href="/dashboard/api-keys" className="text-accent-violet underline">API Keys</a> tab in this console and create a new key in <strong>Test mode</strong>. Test keys never consume paid credits.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent-violet/20 text-accent-violet text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-semibold text-white">Dispatch Generation Request</h3>
            </div>
            <p className="text-xs text-text-secondary pl-7 leading-relaxed">
              Send an HTTP POST request to <code className="text-accent-violet font-mono">/v1/generations</code>. Use an <code className="text-accent-violet font-mono">Idempotency-Key</code> header to prevent duplicate billing:
            </p>
            <div className="pl-7">
              <div className="relative bg-[#08090D] border border-white/8 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => copyCode(quickstartCurl, 'quickstart')}
                  className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'quickstart' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-accent-emerald" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <pre>{quickstartCurl}</pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent-violet/20 text-accent-violet text-[11px] font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-semibold text-white">Poll for Job Completion</h3>
            </div>
            <p className="text-xs text-text-secondary pl-7 leading-relaxed">
              Poll <code className="text-accent-violet font-mono">GET /v1/generations/:id</code> until the status turns to <code className="text-accent-emerald font-mono">succeeded</code>. Polling running jobs is free and consumes zero concurrency slots:
            </p>
            <div className="pl-7">
              <div className="relative bg-[#08090D] border border-white/8 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => copyCode(pollCurl, 'poll')}
                  className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  {copiedSection === 'poll' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-accent-emerald" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <pre>{pollCurl}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit & Duration Calculation Rules */}
      {(activeSection === 'formulas' || activeSection === 'all') && (
        <div className="surface-card p-6 lg:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-violet" />
            <span>Credit & Duration Metering Formulas</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Credits are reserved and charged per started 60-second duration unit. Duration is rounded up to the nearest unit:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#08090D] border border-white/8 space-y-2">
              <div className="text-accent-violet font-bold">Duration Units Formula</div>
              <div className="text-white">durationUnits = Math.ceil(durationSec / 60)</div>
              <div className="text-text-muted text-[11px] leading-relaxed">
                • 30s = 1 unit<br />
                • 60s = 1 unit<br />
                • 61s = 2 units<br />
                • 120s = 2 units<br />
                • 121s = 3 units
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#08090D] border border-white/8 space-y-2">
              <div className="text-accent-cyan font-bold">License Multipliers</div>
              <div className="text-white">totalCredits = durationUnits * licenseCost</div>
              <div className="text-text-muted text-[11px] leading-relaxed">
                • royalty_free = 1 credit / unit<br />
                • sync = 6 credits / unit<br />
                • full_ownership = 14 credits / unit
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Signature Verification */}
      {(activeSection === 'webhooks' || activeSection === 'all') && (
        <div className="surface-card p-6 lg:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-emerald" />
            <span>Webhook Signature Verification (Node.js)</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            SoundForge signs every webhook event using HMAC-SHA256 with header{' '}
            <code className="text-accent-violet font-mono">SoundForge-Signature: t=...,v1=...</code>. Verify signatures
            to protect against payload tampering and replay attacks:
          </p>

          <div className="relative bg-[#08090D] border border-white/8 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => copyCode(webhookVerifyNode, 'webhookVerify')}
              className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted text-[11px] flex items-center gap-1.5 transition-colors"
            >
              {copiedSection === 'webhookVerify' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-accent-emerald" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <pre>{webhookVerifyNode}</pre>
          </div>
        </div>
      )}

      {/* Error Codes Reference */}
      {(activeSection === 'errors' || activeSection === 'all') && (
        <div className="surface-card p-6 lg:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-rose" />
            <span>Standard API Error Envelopes</span>
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            All SoundForge API errors adhere to a structured JSON error envelope:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#08090D] text-text-muted border-b border-white/8">
                <tr>
                  <th className="py-2.5 px-4 font-sans font-semibold">HTTP Status</th>
                  <th className="py-2.5 px-4 font-sans font-semibold">Error Code</th>
                  <th className="py-2.5 px-4 font-sans font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-text-secondary">
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">400</td>
                  <td className="py-2.5 px-4 text-accent-violet">invalid_request</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Malformed JSON payload or invalid parameters</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">401</td>
                  <td className="py-2.5 px-4 text-accent-violet">unauthorized</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Missing, invalid, or revoked API key secret</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">402</td>
                  <td className="py-2.5 px-4 text-accent-violet">insufficient_credits</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Account monthly credit allowance exhausted</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">404</td>
                  <td className="py-2.5 px-4 text-accent-violet">not_found</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Requested resource or cross-tenant ID does not exist</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">409</td>
                  <td className="py-2.5 px-4 text-accent-violet">idempotency_conflict</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Idempotency-Key reused with a mismatched body</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">422</td>
                  <td className="py-2.5 px-4 text-accent-violet">license_not_allowed</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Plan tier does not permit requested license (e.g. full_ownership on Starter)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-accent-rose font-bold">429</td>
                  <td className="py-2.5 px-4 text-accent-violet">parallel_limit_exceeded</td>
                  <td className="py-2.5 px-4 font-sans text-text-muted">Maximum concurrent generation jobs running for account tier</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
