import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Download,
  XCircle,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { AudioPlayer } from '../../components/AudioPlayer.js';
import { Generation, LicenseType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const GenerationsPage: React.FC = () => {
  const { refreshUser } = useAuth();

  const [prompt, setPrompt] = useState<string>('Futuristic cinematic cyberpunk synthwave with analog bassline and ethereal pads');
  const [durationSec, setDurationSec] = useState<number>(60);
  const [license, setLicense] = useState<LicenseType>('royalty_free');
  const [instrumental, setInstrumental] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);

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
    const interval = setInterval(fetchHistory, 6000);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Music Generation Studio</h1>
        <p className="text-xs text-gray-400 mt-1">
          Compose custom audio with predictable credit metering, license tracking, and S3 audio persistence
        </p>
      </div>

      {/* Generation Form Card */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>Music Generation Prompt</span>
              <span className="text-gray-500 font-mono text-[11px]">{prompt.length} / 1000</span>
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the genre, tempo, instruments, mood, and production characteristics..."
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-none"
            />

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {samplePrompts.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-[11px] text-gray-400 hover:text-gray-200 border border-gray-700/60 transition truncate max-w-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-gray-800">
            {/* Duration Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Duration (Seconds)
              </label>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(parseInt(e.target.value, 10))}
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
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
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                License Tier
              </label>
              <select
                value={license}
                onChange={(e) => setLicense(e.target.value as LicenseType)}
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="royalty_free">Royalty-Free (1 credit/unit)</option>
                <option value="sync">Sync License (6 credits/unit)</option>
                <option value="full_ownership">Full Ownership (14 credits/unit)</option>
              </select>
            </div>

            {/* Instrumental Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Arrangement
              </label>
              <button
                type="button"
                onClick={() => setInstrumental(!instrumental)}
                className={`w-full py-2.5 px-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition ${
                  instrumental
                    ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-[#0B0F19] border-gray-800 text-gray-400'
                }`}
              >
                <span>Instrumental Track</span>
                <span className={`w-2.5 h-2.5 rounded-full ${instrumental ? 'bg-indigo-500' : 'bg-gray-700'}`} />
              </button>
            </div>
          </div>

          {/* Pricing Preview & Submit */}
          <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center gap-1.5 font-semibold">
                <Coins className="w-4 h-4" />
                <span>Cost: {requiredCredits} credits</span>
              </div>
              <span className="text-gray-500">
                ({durationUnits} unit × {licenseCostMap[license]} cr)
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !prompt}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* History Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Generation Archive</h3>
            <p className="text-xs text-gray-400 mt-0.5">Asynchronous generation status and player</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {activeAudioUrl && (
          <div className="p-4 bg-indigo-950/20 border-b border-indigo-500/20">
            <AudioPlayer src={activeAudioUrl} title="Audio Player" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19]/60 text-gray-400 font-medium border-b border-gray-800">
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
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {historyLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading generations...
                  </td>
                </tr>
              ) : generations.length > 0 ? (
                generations.map((gen) => (
                  <tr key={gen._id || gen.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-medium text-gray-200 max-w-sm truncate">
                      {gen.prompt}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          gen.status === 'succeeded'
                            ? 'success'
                            : gen.status === 'running'
                            ? 'info'
                            : gen.status === 'queued'
                            ? 'warning'
                            : gen.status === 'canceled'
                            ? 'neutral'
                            : 'error'
                        }
                      >
                        {gen.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{gen.durationSec}s</td>
                    <td className="py-3.5 px-4 capitalize">{gen.license?.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">
                      {gen.creditsCharged || gen.creditsReserved} cr
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-500">
                      {gen.queuedAt ? new Date(gen.queuedAt).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {gen.status === 'succeeded' && gen.audioUrl && (
                          <>
                            <button
                              onClick={() => setActiveAudioUrl(gen.audioUrl!)}
                              className="p-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 transition"
                              title="Play"
                            >
                              <Play className="w-3.5 h-3.5 ml-0.5" />
                            </button>
                            <a
                              href={gen.audioUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}

                        {(gen.status === 'queued' || gen.status === 'running') && (
                          <button
                            onClick={() => handleCancel(gen._id || gen.id!)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
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
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No generations found. Queue your first song above!
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
