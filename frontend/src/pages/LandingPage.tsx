import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Waves,
  Zap,
  ShieldCheck,
  Webhook,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [codeTab, setCodeTab] = useState<'curl' | 'typescript' | 'python'>('curl');

  const codeSnippets = {
    curl: `curl -X POST https://api.soundforge.ai/v1/generations \\
  -H "Authorization: Bearer sf_live_0a91f4c781bc..." \\
  -H "Idempotency-Key: client_job_4981" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Cyberpunk synthwave arpeggio with 80s analog chorus",
    "duration": 60,
    "license": "royalty_free",
    "instrumental": true
  }'`,
    typescript: `import { SoundForge } from '@soundforge/sdk';

const soundforge = new SoundForge({
  apiKey: process.env.SOUNDFORGE_API_KEY,
});

const generation = await soundforge.generations.create({
  prompt: 'Cinematic orchestral soundtrack with aggressive brass',
  duration: 90,
  license: 'sync',
  instrumental: true,
});

console.log('Audio URL:', generation.audio_url);`,
    python: `import soundforge

client = soundforge.Client(api_key="sf_live_...")

song = client.generations.create(
    prompt="Lo-fi hip hop study beat with vinyl crackle",
    duration=60,
    license="royalty_free",
)

print("Status:", song.status)
print("Signed Download:", song.audio_url)`,
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="h-20 border-b border-gray-800/80 max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            SoundForge
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#code" className="hover:text-white transition">API</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <Link to="/auth/login" className="hover:text-white transition">Docs</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-800/50 transition"
          >
            Log in
          </Link>
          <Link
            to="/auth/register"
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-600/15 via-purple-600/10 to-cyan-600/15 blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Enterprise Developer Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Generate AI Music through{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Predictable REST APIs
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          SoundForge provides self-service enterprise infrastructure for AI music generation.
          Enforce atomic billing, license validation, and idempotency with sub-second API coordination.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/auth/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2"
          >
            <span>Create Free Developer Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/auth/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 font-semibold text-base transition flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-gray-400" />
            <span>Explore Dashboard</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="p-4 rounded-xl border border-gray-800 bg-[#111827]/60">
            <div className="text-2xl font-bold text-gray-100 mb-1">&lt;1.5s</div>
            <div className="text-xs text-gray-400">Queue Latency</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-[#111827]/60">
            <div className="text-2xl font-bold text-gray-100 mb-1">100%</div>
            <div className="text-xs text-gray-400">Atomic Reservation</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-[#111827]/60">
            <div className="text-2xl font-bold text-gray-100 mb-1">SSRF</div>
            <div className="text-xs text-gray-400">Protected Webhooks</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-800 bg-[#111827]/60">
            <div className="text-2xl font-bold text-gray-100 mb-1">HMAC</div>
            <div className="text-xs text-gray-400">SHA-256 Signatures</div>
          </div>
        </div>
      </section>

      {/* Code Demo Section */}
      <section id="code" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Code Window Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0B0F19]/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-gray-500 font-mono ml-2">POST /v1/generations</span>
            </div>

            <div className="flex items-center gap-1 bg-[#1F2937] p-1 rounded-lg">
              {(['curl', 'typescript', 'python'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setCodeTab(lang)}
                  className={`text-xs font-mono uppercase px-3 py-1 rounded transition ${
                    codeTab === lang
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Code Content */}
          <div className="p-6 font-mono text-sm leading-relaxed text-indigo-200 overflow-x-auto bg-[#0E1322]">
            <pre>{codeSnippets[codeTab]}</pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-100 mb-4">
            Architected for Mission-Critical Production
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Designed for developer platforms where billing accuracy, concurrency controls, and licensing integrity cannot fail.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">Atomic Credit Metering</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Credits are reserved atomically before jobs are queued. Zero race conditions, zero overspending, and automatic refunds on provider timeout.
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">Multi-Tier Licensing</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Enforce Royalty-Free, Sync, and Full Ownership rights at the backend API layer. Real provider models are tracked and logged explicitly.
            </p>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 text-purple-400">
              <Webhook className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-100 mb-2">SSRF-Hardened Webhooks</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              HMAC-SHA256 signatures with replay protection. DNS resolution checks prevent access to internal IPs, metadata addresses, and link-local ranges.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-gray-800/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-100 mb-4">
            Transparent, Predictable Pricing
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Start in sandbox mode for free, scale to Starter or Growth with commercial licensing rights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Sandbox */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Sandbox</div>
              <div className="text-3xl font-bold text-gray-100 mb-4">$0 <span className="text-sm text-gray-500 font-normal">/ month</span></div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Ideal for local testing, CI pipelines, and developer evaluation.
              </p>
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Test mode API keys</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> 1 Parallel generation slot</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> 60 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Royalty-Free license</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              Start Free
            </Link>
          </div>

          {/* Starter */}
          <div className="bg-[#111827] border-2 border-indigo-500 rounded-2xl p-8 flex flex-col justify-between relative shadow-xl shadow-indigo-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-2">Starter</div>
              <div className="text-3xl font-bold text-gray-100 mb-4">$29 <span className="text-sm text-gray-500 font-normal">/ month</span></div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                For indie hackers, mobile apps, and early-stage production products.
              </p>
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> 200 Monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> 3 Parallel generation slots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> 300 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> Royalty-Free & Sync licenses</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-500/25"
            >
              Get Started
            </Link>
          </div>

          {/* Growth */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2">Growth</div>
              <div className="text-3xl font-bold text-gray-100 mb-4">$199 <span className="text-sm text-gray-500 font-normal">/ month</span></div>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                For enterprise scale, high-throughput games, and content platforms.
              </p>
              <ul className="space-y-3 text-sm text-gray-300 mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /> 2,000 Monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /> 10 Parallel generation slots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /> 2,000 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /> Full Ownership rights</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" /> Overage billing supported</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <div>&copy; {new Date().getFullYear()} SoundForge AI Platform. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/auth/login" className="hover:text-gray-300 transition">Dashboard</Link>
          <a href="#code" className="hover:text-gray-300 transition">API Reference</a>
          <a href="https://github.com/AbhinavY0318/Soundforge" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};
