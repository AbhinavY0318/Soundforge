import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  Webhook,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Terminal,
  Play,
  Pause,
  Copy,
  Check,
  Cpu,
  Layers,
  Lock,
  Clock,
  Radio,
  Sliders,
} from 'lucide-react';
import { SoundForgeLogo } from '../components/SoundForgeLogo.js';

export const LandingPage: React.FC = () => {
  const [codeTab, setCodeTab] = useState<'curl' | 'typescript' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  // Interactive Product Demo State
  const [demoPrompt, setDemoPrompt] = useState('Cyberpunk synthwave arpeggio with 80s analog chorus');
  const [demoDuration, setDemoDuration] = useState(60);
  const [demoLicense, setDemoLicense] = useState<'royalty_free' | 'sync' | 'full_ownership'>('royalty_free');
  const [demoInstrumental, setDemoInstrumental] = useState(true);
  const [isDemoGenerating, setIsDemoGenerating] = useState(false);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  const codeSnippets = {
    curl: `curl -X POST https://api.soundforge.ai/v1/generations \\
  -H "Authorization: Bearer sf_live_0a91f4c781bc..." \\
  -H "Idempotency-Key: client_job_4981" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "${demoPrompt}",
    "duration": ${demoDuration},
    "license": "${demoLicense}",
    "instrumental": ${demoInstrumental}
  }'`,
    typescript: `import { SoundForge } from '@soundforge/sdk';

const soundforge = new SoundForge({
  apiKey: process.env.SOUNDFORGE_API_KEY,
});

const generation = await soundforge.generations.create({
  prompt: '${demoPrompt}',
  duration: ${demoDuration},
  license: '${demoLicense}',
  instrumental: ${demoInstrumental},
});

console.log('Status:', generation.status);
console.log('Audio URL:', generation.audio_url);`,
    python: `import soundforge

client = soundforge.Client(api_key="sf_live_...")

song = client.generations.create(
    prompt="${demoPrompt}",
    duration=${demoDuration},
    license="${demoLicense}",
    instrumental=${demoInstrumental},
)

print("Status:", song.status)
print("Signed Download:", song.audio_url)`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(codeSnippets[codeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSimulateGeneration = () => {
    setIsDemoGenerating(true);
    setIsDemoPlaying(false);
    setTimeout(() => {
      setIsDemoGenerating(false);
      setIsDemoPlaying(true);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#08090D] text-text-primary selection:bg-accent-violet selection:text-white">
      {/* SECTION 1: NAVIGATION */}
      <nav className="h-20 border-b border-white/8 bg-[#08090D]/80 backdrop-blur-xl sticky top-0 z-50 px-6 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <SoundForgeLogo size="md" showText={true} />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-text-secondary">
          <a href="#product" className="hover:text-white transition-colors">Product</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#code" className="hover:text-white transition-colors">API</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <Link to="/auth/login" className="hover:text-white transition-colors">Docs</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/auth/login"
            className="text-xs font-medium text-text-secondary hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth/register"
            className="btn-primary-gradient text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5"
          >
            <span>Start Building</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* SECTION 2: HERO SECTION */}
      <section className="pt-24 pb-20 px-6 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Ambient Hero Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-radial-hero pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-accent-violet font-medium mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-violet animate-pulse" />
          <span className="tracking-wide">SOUNDFORGE ENTERPRISE 2.0</span>
          <span className="text-white/20">•</span>
          <span className="text-text-secondary">Next-Gen Audio Synthesis</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6"
        >
          Turn ideas into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-violet via-accent-indigo to-accent-cyan">
            extraordinary sound.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          An enterprise-grade AI music generation API built for developers, creators,
          and the next generation of creative applications.
        </motion.p>

        {/* CTA Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link
            to="/auth/register"
            className="btn-primary-gradient w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <span>Start Building</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#code"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-card hover:bg-card-hover text-white border border-white/8 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-accent-indigo" />
            <span>Explore API Docs</span>
          </a>
        </motion.div>

        {/* Trust Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-text-muted select-none">
          <ShieldCheck className="w-4 h-4 text-accent-emerald" />
          <span>Built for developers. Designed for creativity.</span>
        </div>

        {/* Centerpiece: Animated Audio Waveform & Equalizer Display */}
        <div className="mt-14 max-w-3xl mx-auto relative">
          <div className="surface-card p-4 rounded-2xl flex items-center justify-center gap-1.5 h-24 overflow-hidden border border-white/10 bg-[#0D1018]/80 backdrop-blur-md">
            {[40, 65, 85, 30, 95, 70, 50, 80, 40, 60, 90, 35, 75, 85, 60, 45, 95, 70, 40, 80, 60, 30, 75, 90, 50, 40, 65, 85, 55, 70, 90, 45, 60, 35].map((height, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-accent-violet via-accent-indigo to-accent-cyan animate-pulse"
                style={{
                  height: `${height}%`,
                  animationDuration: `${0.6 + (i % 5) * 0.25}s`,
                  animationDelay: `${(i % 7) * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: PRODUCT DEMONSTRATION PREVIEW */}
      <section id="product" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5" />
            <span>Interactive Studio Preview</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            Real-Time Synthesis Orchestration
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Test prompt parameters, licensing tags, and audio synthesis in the developer sandbox.
          </p>
        </div>

        <div className="surface-card p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Input Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Audio Prompt
                </label>
                <textarea
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-[#08090D] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-accent-violet transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Duration (Seconds)
                  </label>
                  <select
                    value={demoDuration}
                    onChange={(e) => setDemoDuration(Number(e.target.value))}
                    className="w-full bg-[#08090D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                  >
                    <option value={30}>30s (1 unit)</option>
                    <option value={60}>60s (1 unit)</option>
                    <option value={120}>120s (2 units)</option>
                    <option value={180}>180s (3 units)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Commercial License
                  </label>
                  <select
                    value={demoLicense}
                    onChange={(e) => setDemoLicense(e.target.value as any)}
                    className="w-full bg-[#08090D] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent-violet"
                  >
                    <option value="royalty_free">Royalty-Free (1 cr)</option>
                    <option value="sync">Sync License (6 cr)</option>
                    <option value="full_ownership">Full Ownership (14 cr)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary select-none">
                  <input
                    type="checkbox"
                    checked={demoInstrumental}
                    onChange={(e) => setDemoInstrumental(e.target.checked)}
                    className="rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
                  />
                  <span>Instrumental Only</span>
                </label>

                <button
                  type="button"
                  onClick={handleSimulateGeneration}
                  disabled={isDemoGenerating}
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isDemoGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Generate Sample</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Audio Preview Mockup */}
            <div className="surface-elevated p-6 rounded-xl border border-white/8 flex flex-col justify-between h-full min-h-[220px]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-text-muted uppercase">Output Stream</span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${isDemoGenerating ? 'text-accent-violet animate-pulse' : 'text-accent-emerald'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDemoGenerating ? 'bg-accent-violet animate-ping' : 'bg-accent-emerald'}`} />
                  {isDemoGenerating ? 'SYNTHESIZING_PCM' : 'COMPLETED'}
                </span>
              </div>

              {/* Dynamic Waveform Player */}
              <div className="py-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                    disabled={isDemoGenerating}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-violet to-accent-indigo text-white flex items-center justify-center flex-shrink-0 shadow-glow-sm"
                  >
                    {isDemoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <div className="flex-1">
                    <div className="h-10 flex items-center justify-between gap-1 bg-[#08090D] p-2 rounded-lg border border-white/5">
                      {[30, 60, 80, 45, 90, 75, 40, 85, 95, 60, 40, 70, 85, 50, 65, 90, 35, 75, 80].map((h, i) => (
                        <div
                          key={i}
                          className={`w-full rounded-full transition-all duration-150 ${
                            isDemoPlaying
                              ? 'bg-gradient-to-t from-accent-indigo to-accent-cyan animate-pulse'
                              : 'bg-white/10'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-2 border-t border-white/5">
                <span>RIFF WAV 44.1kHz • 16-bit</span>
                <span>{demoDuration}s</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURES */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-violet uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Architecture</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
            Architected for Mission-Critical Production
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Designed for developer platforms where billing accuracy, concurrency controls,
            and licensing integrity cannot fail.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center mb-5 text-accent-violet">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Atomic Credit Metering</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Credits are reserved atomically before jobs are queued. Zero race conditions, zero overspending,
              and automatic releases on provider timeouts.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center mb-5 text-accent-cyan">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Asynchronous Processing</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Distributed Redis and BullMQ queues ensure worker restart survivability, parallel concurrency slots,
              and sub-second task assignment.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center mb-5 text-accent-indigo">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Secure API Keys</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Dual-mode test and live keys with SHA-256 hash storage, one-time secret reveals, instant revocation,
              and zero-downtime 24h rotation.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center mb-5 text-accent-emerald">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Enterprise Licensing</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Enforce Royalty-Free, Sync, and Full Ownership rights at the backend API layer. Real provider models
              are recorded and logged explicitly.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center mb-5 text-accent-rose">
              <Webhook className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Signed SSRF-Safe Webhooks</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              HMAC-SHA256 signatures with 300s replay defense. DNS inspection blocks AWS metadata (169.254.169.254)
              and RFC 1918 private subnets.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center mb-5 text-accent-amber">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Canonical Idempotency</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Deduplicate concurrent POST requests via Idempotency-Key. Same payload returns original job without
              duplicate charges; mismatched payloads return 409.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 5: HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-indigo uppercase tracking-wider mb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Developer Flow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            From Request to Audio in 3 Steps
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Simple integration lifecycle designed for microservices, mobile backends, and creative web apps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="surface-card p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-accent-violet text-white font-bold text-xs flex items-center justify-center mb-4 shadow-glow-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Create Your API Key</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Generate a test or live API key from the developer console. Secrets are hashed with SHA-256 immediately.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-accent-indigo text-white font-bold text-xs flex items-center justify-center mb-4 shadow-glow-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Send Music Prompt</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              POST /v1/generations with your prompt, duration, license, and an optional Idempotency-Key.
            </p>
          </div>

          <div className="surface-card p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-accent-cyan text-white font-bold text-xs flex items-center justify-center mb-4 shadow-glow-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-white mb-2">Receive Generated Audio</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Listen for HMAC signed webhooks or poll the job endpoint for expiring presigned MinIO S3 download URLs.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: DEVELOPER EXPERIENCE (CODE EDITOR) */}
      <section id="code" className="py-20 px-6 max-w-5xl mx-auto">
        <div className="surface-card rounded-2xl overflow-hidden border border-white/10 shadow-card">
          {/* Code Window Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0D1018]/90">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent-rose/80" />
              <span className="w-3 h-3 rounded-full bg-accent-amber/80" />
              <span className="w-3 h-3 rounded-full bg-accent-emerald/80" />
              <span className="text-xs text-text-muted font-mono ml-2">POST /v1/generations</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-xl border border-white/8">
                {(['curl', 'typescript', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setCodeTab(lang)}
                    className={`text-xs font-mono uppercase px-3 py-1 rounded-lg transition-colors ${
                      codeTab === lang
                        ? 'bg-accent-violet text-white font-semibold'
                        : 'text-text-muted hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                title="Copy snippet"
              >
                {copiedCode ? <Check className="w-4 h-4 text-accent-emerald" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="p-6 font-mono text-xs leading-relaxed text-indigo-200 overflow-x-auto bg-[#08090D]">
            <pre>{codeSnippets[codeTab]}</pre>
          </div>
        </div>
      </section>

      {/* SECTION 7: PRICING */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-violet uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Predictable Pricing</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-4">
            Transparent Subscription Plans
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Start in sandbox mode for free, scale to Starter or Growth with commercial licensing rights.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Sandbox */}
          <div className="surface-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Sandbox</div>
              <div className="text-3xl font-bold text-white mb-4">$0 <span className="text-xs text-text-muted font-normal">/ month</span></div>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                Ideal for local testing, integration validation, and developer quickstarts.
              </p>
              <ul className="space-y-3 text-xs text-text-secondary mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" /> Test mode API keys only</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" /> 1 Parallel generation slot</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" /> 60 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-emerald flex-shrink-0" /> Royalty-Free license</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/8 transition-colors"
            >
              Start Free
            </Link>
          </div>

          {/* Starter */}
          <div className="surface-card p-8 rounded-2xl flex flex-col justify-between relative border-accent-violet/40 shadow-glow-sm">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-violet to-accent-indigo text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="text-xs font-semibold text-accent-violet uppercase tracking-wider mb-2">Starter</div>
              <div className="text-3xl font-bold text-white mb-4">$29 <span className="text-xs text-text-muted font-normal">/ month</span></div>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                For indie developers, mobile creators, and early-stage commercial applications.
              </p>
              <ul className="space-y-3 text-xs text-text-secondary mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-violet flex-shrink-0" /> 200 Monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-violet flex-shrink-0" /> 3 Parallel generation slots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-violet flex-shrink-0" /> 300 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-violet flex-shrink-0" /> Royalty-Free & Sync licenses</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="btn-primary-gradient w-full py-2.5 text-center text-xs font-semibold rounded-xl"
            >
              Get Started
            </Link>
          </div>

          {/* Growth */}
          <div className="surface-card p-8 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-accent-cyan uppercase tracking-wider mb-2">Growth</div>
              <div className="text-3xl font-bold text-white mb-4">$199 <span className="text-xs text-text-muted font-normal">/ month</span></div>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                For high-throughput applications, game studios, and streaming platforms.
              </p>
              <ul className="space-y-3 text-xs text-text-secondary mb-8">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" /> 2,000 Monthly credits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" /> 10 Parallel generation slots</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" /> 2,000 Requests / hour</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" /> Full Ownership rights</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent-cyan flex-shrink-0" /> Overage billing supported</li>
              </ul>
            </div>
            <Link
              to="/auth/register"
              className="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/8 transition-colors"
            >
              Upgrade to Growth
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 8: FINAL CTA */}
      <section className="py-24 px-6 max-w-5xl mx-auto text-center relative overflow-hidden">
        <div className="surface-card p-12 rounded-3xl border border-white/10 relative overflow-hidden bg-gradient-to-b from-card to-[#08090D]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/50 to-transparent" />
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
            Your next great product needs a soundtrack.
          </h2>
          <p className="text-sm text-text-secondary max-w-xl mx-auto mb-8 leading-relaxed">
            Integrate enterprise AI music synthesis in minutes with predictable billing and commercial licensing.
          </p>

          <Link
            to="/auth/register"
            className="btn-primary-gradient inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold"
          >
            <span>Start Building with SoundForge</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SECTION 9: FOOTER */}
      <footer className="border-t border-white/8 py-12 px-6 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-4">
        <div className="flex items-center gap-2">
          <SoundForgeLogo size="sm" showText={false} />
          <span>&copy; {new Date().getFullYear()} SoundForge AI Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/dashboard/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a href="#code" className="hover:text-white transition-colors">API Reference</a>
          <a
            href="https://github.com/AbhinavY0318/Soundforge"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
          <Link to="/auth/login" className="hover:text-white transition-colors">Security</Link>
          <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
        </div>
      </footer>
    </div>
  );
};
