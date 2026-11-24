import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Download,
  XCircle,
  RefreshCw,
  Coins,
  Search,
  Music2,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { AudioPlayer } from '../../components/AudioPlayer.js';
import { Generation, LicenseType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const GenerationsPage: React.FC = () => {
  const { refreshUser } = useAuth();

  const [prompt, setPrompt] = useState<string>(
    'Futuristic cinematic cyberpunk synthwave with analog bassline and ethereal pads'
  );
  const [durationSec, setDurationSec] = useState<number>(60);
  const [license, setLicense] = useState<LicenseType>('royalty_free');
  const [instrumental, setInstrumental] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // History & Filters
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Credit calculation
  const licenseCostMap: Record<LicenseType, number> = {
    royalty_free: 1,
    sync: 6,
    full_ownership: 14,
  };
  const durationUnits = Math.ceil(durationSec / 60);
  const requiredCredits = durationUnits * (licenseCostMap[license] || 1);

  const samplePrompts = [
    'Futuristic cinematic cyberpunk synthwave with analog bassline and ethereal pads',
    'Chilled lo-fi hip hop study beat with warm vinyl crackle and mellow electric piano',
    'Epic orchestral battle theme with aggressive brass swells and thunderous percussion',
    'Ambient meditation soundscape with Tibetan singing bowls and rainfall atmosphere',
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.get('/api/v1/generations');
      setGenerations(res.data.generations || res.data);
    } catch {
      // Ignored
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/api/v1/generations', {
        prompt,
        durationSec,
        license,
        instrumental,
      });
      await fetchHistory();
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to dispatch generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.post(`/api/v1/generations/${id}/cancel`);
      await fetchHistory();
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to cancel job');
    }
  };

  // Filtered generations list
  const filteredGenerations = generations.filter((gen) => {
    const matchesSearch =
      !searchQuery || gen.prompt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || gen.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Music Generation Studio</h1>
        <p className="text-xs text-text-secondary mt-1">
          Compose custom AI audio with atomic credit metering, license tracking, and S3 audio persistence.
        </p>
      </div>

      {/* Generation Studio Form Card */}
      <div className="surface-card p-6 lg:p-8 rounded-2xl relative shadow-card">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5 text-accent-violet" />
                <span>Music Generation Prompt</span>
              </label>
              <span className="text-[11px] font-mono text-text-muted">{prompt.length} / 1000</span>
            </div>

            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the genre, tempo, instruments, mood, and production characteristics..."
              className="w-full bg-[#08090D] border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors leading-relaxed resize-none"
            />

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {samplePrompts.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-text-muted hover:text-white border border-white/8 transition-colors truncate max-w-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/5">
            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                Duration (Seconds)
              </label>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value, 10))}
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-violet transition-colors"
              >
                <option value={30}>30s (1 Duration Unit)</option>
                <option value={60}>60s (1 Duration Unit)</option>
                <option value={90}>90s (2 Duration Units)</option>
                <option value={120}>120s (2 Duration Units)</option>
                <option value={180}>180s (3 Duration Units)</option>
              </select>
            </div>

            {/* License Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                License Tier
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value as LicenseType)}
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-accent-violet transition-colors"
              >
                <option value="royalty_free">Royalty-Free (1 cr / unit)</option>
                <option value="sync">Sync License (6 cr / unit)</option>
                <option value="full_ownership">Full Ownership (14 cr / unit)</option>
              </select>
            </div>

            {/* Instrumental Toggle */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                Arrangement
              </label>
              <button
                type="button"
                onClick={() => setInstrumental(!instrumental)}
                className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                  instrumental
                    ? 'bg-accent-violet/10 border-accent-violet/30 text-white'
                    : 'bg-[#08090D] border-white/10 text-text-muted'
                }`}
              >
                <span>Instrumental Track</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    instrumental ? 'bg-accent-violet animate-pulse' : 'bg-white/20'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Pricing Preview & Submit Action */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="p-2 rounded-xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet flex items-center gap-1.5 font-semibold">
                <Coins className="w-4 h-4" />
                <span>Cost: {requiredCredits} credits</span>
              </div>
              <span className="text-text-muted text-[11px] font-mono">
                Formula: {durationUnits} unit(s) × {licenseCostMap[license]} cr
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt}
              className="btn-primary-gradient px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Reserving Slot & Queueing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Queue Generation Job</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Generation History Archive */}
      <div className="surface-card overflow-hidden">
        {/* Archive Header with Search & Filter Tabs */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Generation Archive</h3>
            <p className="text-xs text-text-secondary mt-0.5">Asynchronous generation status, waveform playback, and audio export</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#08090D] border border-white/8 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh generations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-2 border-b border-white/5 bg-[#08090D]/50 flex items-center gap-2 overflow-x-auto text-xs">
          {['all', 'succeeded', 'running', 'queued', 'failed', 'canceled'].map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-accent-violet/20 text-accent-violet font-semibold border border-accent-violet/30'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Audio Player Drawer when active */}
        {activeAudioUrl && (
          <div className="p-4 bg-accent-violet/5 border-b border-white/5">
            <AudioPlayer src={activeAudioUrl} title="Selected Audio Track" />
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090D]/60 text-text-muted font-medium border-b border-white/5">
              <tr>
                <th className="py-3 px-6">Track Prompt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">License</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Queued At</th>
                <th className="py-3 px-6 text-right">Playback & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
                      <span>Loading generations archive...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredGenerations.length > 0 ? (
                filteredGenerations.map((gen) => (
                  <tr key={gen._id || gen.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-medium text-white max-w-sm truncate">
                      {gen.prompt}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          gen.status === 'succeeded'
                            ? 'success'
                            : gen.status === 'running'
                            ? 'violet'
                            : gen.status === 'queued'
                            ? 'neutral'
                            : gen.status === 'canceled'
                            ? 'neutral'
                            : 'error'
                        }
                        dot={true}
                        pulse={gen.status === 'running'}
                      >
                        {gen.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">{gen.durationSec}s</td>
                    <td className="py-3.5 px-4 capitalize text-text-secondary">
                      {gen.license?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-accent-violet font-semibold">
                      {gen.creditsCharged || gen.creditsReserved} cr
                    </td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">
                      {gen.queuedAt ? new Date(gen.queuedAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {gen.status === 'succeeded' && gen.audioUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveAudioUrl(gen.audioUrl!)}
                              className="p-1.5 rounded-lg bg-accent-violet/10 hover:bg-accent-violet/20 text-accent-violet transition-colors"
                              title="Play"
                            >
                              <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                            </button>
                            <a
                              href={gen.audioUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}

                        {(gen.status === 'queued' || gen.status === 'running') && (
                          <button
                            type="button"
                            onClick={() => handleCancel(gen._id || gen.id!)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
                            title="Cancel Job"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted font-sans">
                    No generations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
