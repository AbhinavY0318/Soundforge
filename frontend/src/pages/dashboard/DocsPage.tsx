import React, { useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const quickstartCurl = `curl -X POST http://localhost:4000/v1/generations \\
  -H "Authorization: Bearer sf_test_YOUR_API_KEY" \\
  -H "Idempotency-Key: client_order_1001" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Cinematic lo-fi hip hop study beat with warm piano chords",
    "duration": 60,
    "license": "royalty_free",
    "instrumental": true
  }'`;

  const pollCurl = `curl -X GET http://localhost:4000/v1/generations/GEN_ID \\
  -H "Authorization: Bearer sf_test_YOUR_API_KEY"`;

  const webhookVerifyNode = `import crypto from 'crypto';

function verifySoundForgeWebhook(payloadString, signatureHeader, secret) {
  // Format: t=1700000000,v1=9f86d081884c7d659a...
  const parts = signatureHeader.split(',');
  const t = parts.find(p => p.startsWith('t=')).substring(2);
  const v1 = parts.find(p => p.startsWith('v1=')).substring(3);

  // Guard against replay attacks (5 minutes tolerance)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-100">API Documentation & Quickstart</h1>
        <p className="text-xs text-gray-400 mt-1">
          Complete developer reference for music generation, idempotency, webhook security, and rate limiting
        </p>
      </div>

      {/* 5-Minute Quickstart */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-100">5-Minute Developer Quickstart</h2>
            <p className="text-xs text-gray-400">Generate your first AI track in under 5 minutes</p>
          </div>
        </div>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">1</span>
            <h3 className="text-sm font-semibold text-gray-200">Create a Test API Key</h3>
          </div>
          <p className="text-xs text-gray-400 pl-8 leading-relaxed">
            Navigate to the <a href="/dashboard/api-keys" className="text-indigo-400 underline">API Keys</a> tab in this console and create a new key in <strong>Test mode</strong>. Test keys never consume paid credits.
          </p>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">2</span>
            <h3 className="text-sm font-semibold text-gray-200">Dispatch Generation Request</h3>
          </div>
          <p className="text-xs text-gray-400 pl-8 leading-relaxed">
            Send an HTTP POST request to <code className="text-indigo-300 font-mono">/v1/generations</code>. Use an <code className="text-indigo-300 font-mono">Idempotency-Key</code> header to prevent duplicate billing:
          </p>
          <div className="pl-8">
            <div className="relative bg-[#0B0F19] border border-gray-800 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
              <button
                onClick={() => copyCode(quickstartCurl, 'quickstart')}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] flex items-center gap-1.5 transition"
              >
                {copiedSection === 'quickstart' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
            <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 text-xs font-bold flex items-center justify-center">3</span>
            <h3 className="text-sm font-semibold text-gray-200">Poll for Completion</h3>
          </div>
          <p className="text-xs text-gray-400 pl-8 leading-relaxed">
            Poll <code className="text-indigo-300 font-mono">GET /v1/generations/:id</code> until the status turns to <code className="text-emerald-400 font-mono">succeeded</code>. Polling running jobs is free and consumes zero concurrency slots:
          </p>
          <div className="pl-8">
            <div className="relative bg-[#0B0F19] border border-gray-800 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
              <button
                onClick={() => copyCode(pollCurl, 'poll')}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] flex items-center gap-1.5 transition"
              >
                {copiedSection === 'poll' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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

      {/* Credit & Duration Calculation Rules */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span>Credit & Duration Formulas</span>
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Credits are charged per started 60-second duration unit. Duration is rounded up to the nearest unit:
        </p>

        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#0B0F19] border border-gray-800 space-y-2">
            <div className="text-indigo-400 font-bold">Duration Units Formula</div>
            <div className="text-gray-300">durationUnits = Math.ceil(durationSec / 60)</div>
            <div className="text-gray-500 text-[11px]">• 30s = 1 unit<br />• 60s = 1 unit<br />• 61s = 2 units<br />• 120s = 2 units<br />• 121s = 3 units</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B0F19] border border-gray-800 space-y-2">
            <div className="text-cyan-400 font-bold">License Credit Multipliers</div>
            <div className="text-gray-300">totalCredits = durationUnits * licenseCost</div>
            <div className="text-gray-500 text-[11px]">• royalty_free = 1 credit / unit<br />• sync = 6 credits / unit<br />• full_ownership = 14 credits / unit</div>
          </div>
        </div>
      </div>

      {/* Webhook Signature Verification */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 lg:p-8 space-y-4 shadow-xl">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Webhook Signature Verification (Node.js)</span>
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          SoundForge signs every webhook event using HMAC-SHA256 with header <code className="text-indigo-300 font-mono">SoundForge-Signature: t=...,v1=...</code>. Verify signatures to protect against forgery and replay attacks:
        </p>

        <div className="relative bg-[#0B0F19] border border-gray-800 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto">
          <button
            onClick={() => copyCode(webhookVerifyNode, 'webhookVerify')}
            className="absolute top-3 right-3 px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 text-[11px] flex items-center gap-1.5 transition"
          >
            {copiedSection === 'webhookVerify' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
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
    </div>
  );
};
