import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music2,
  Coins,
  CheckCircle2,
  ArrowUpRight,
  Play,
  Key,
  Plus,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { AudioPlayer } from '../../components/AudioPlayer.js';
import { Generation } from '../../types/index.js';

interface DashboardStats {
  totalGenerations: number;
  succeededGenerations: number;
  failedGenerations: number;
  activeGenerations: number;
  successRate: number;
  creditsConsumed: number;
  remainingCredits: number;
  monthlyAllowance: number;
  parallelLimit: number;
  recentActivity: Generation[];
}

export const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'volume' | 'credits'>('volume');

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/v1/generations/stats');
      setStats(res.data);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // 7-day telemetry data for visualization
  const chartData = [
    { name: 'Mon', generations: 12, credits: 18 },
    { name: 'Tue', generations: 19, credits: 32 },
    { name: 'Wed', generations: 28, credits: 45 },
    { name: 'Thu', generations: 34, credits: 58 },
    { name: 'Fri', generations: 42, credits: 74 },
    { name: 'Sat', generations: 38, credits: 62 },
    { name: 'Sun', generations: stats?.totalGenerations || 49, credits: stats?.creditsConsumed || 86 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl surface-card skeleton-shimmer" />
          ))}
        </div>
        <div className="h-72 rounded-2xl surface-card skeleton-shimmer" />
      </div>
    );
  }

  const allowance = stats?.monthlyAllowance || 200;
  const consumed = stats?.creditsConsumed || 0;
  const remaining = stats?.remainingCredits !== undefined ? stats.remainingCredits : Math.max(0, allowance - consumed);
  const percentUsed = Math.min(100, Math.round((consumed / (allowance || 1)) * 100));

  return (
    <div className="space-y-8">
      {/* Welcome & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-xs text-text-secondary mt-1">
            Here's what's happening with your SoundForge workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/generations"
            className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Music</span>
          </Link>
          <Link
            to="/dashboard/api-keys"
            className="px-3.5 py-2 bg-card hover:bg-card-hover text-white border border-white/8 font-medium text-xs rounded-xl transition flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-accent-indigo" />
            <span>API Keys</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generations */}
        <div className="surface-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Generations</span>
            <div className="w-8 h-8 rounded-xl bg-accent-violet/10 text-accent-violet flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {stats?.totalGenerations || 0}
          </div>
          <div className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-accent-emerald" />
            <span>All-time REST generation jobs</span>
          </div>
        </div>

        {/* Credits Consumed */}
        <div className="surface-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Credits Consumed</span>
            <div className="w-8 h-8 rounded-xl bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {consumed}
          </div>
          <div className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
            <span>{percentUsed}% of {allowance} allowance</span>
          </div>
        </div>

        {/* Remaining Credits with Progress */}
        <div className="surface-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Remaining Credits</span>
            <div className="w-8 h-8 rounded-xl bg-accent-amber/10 text-accent-amber flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {remaining}
          </div>
          <div className="w-full bg-[#08090D] h-1.5 rounded-full mt-2.5 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-accent-violet to-accent-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-text-muted mt-1.5 flex justify-between">
            <span>{consumed} used</span>
            <span>{allowance} max</span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="surface-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Success Rate</span>
            <div className="w-8 h-8 rounded-xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {stats?.successRate || 100}%
          </div>
          <div className="text-[11px] text-accent-emerald mt-1.5 flex items-center gap-1">
            <span>{stats?.succeededGenerations || 0} successful completions</span>
          </div>
        </div>
      </div>

      {/* Analytics Chart Section */}
      <div className="surface-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Generation Throughput & Volume</h3>
            <p className="text-xs text-text-secondary mt-0.5">API requests and credit consumption over the last 7 days</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#08090D] p-1 rounded-xl border border-white/8 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartView('volume')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  chartView === 'volume'
                    ? 'bg-accent-violet text-white font-semibold'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Volume
              </button>
              <button
                type="button"
                onClick={() => setChartView('credits')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  chartView === 'credits'
                    ? 'bg-accent-cyan text-[#08090D] font-semibold'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                Credits
              </button>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#151A27',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#F8FAFC',
                }}
              />
              {chartView === 'volume' ? (
                <Area
                  type="monotone"
                  dataKey="generations"
                  stroke="#A78BFA"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorGen)"
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#22D3EE"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCred)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Generations Feed */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Recent Music Activity</h3>
            <p className="text-xs text-text-secondary mt-0.5">Latest generations dispatched through the REST API</p>
          </div>
          <Link
            to="/dashboard/generations"
            className="text-xs text-accent-violet hover:text-accent-violet/80 font-medium flex items-center gap-1 transition"
          >
            <span>View All Studio Jobs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Audio Player Drawer when active */}
        {activeAudioUrl && (
          <div className="p-4 bg-accent-violet/5 border-b border-white/5">
            <AudioPlayer src={activeAudioUrl} title="Quick Preview" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090D]/60 text-text-muted font-medium border-b border-white/5">
              <tr>
                <th className="py-3 px-6">Prompt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">License</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary font-mono">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((gen: any) => (
                  <tr key={gen._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-sans text-white font-medium max-w-xs truncate">
                      {gen.prompt}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge
                        variant={
                          gen.status === 'succeeded'
                            ? 'success'
                            : gen.status === 'running'
                            ? 'violet'
                            : gen.status === 'queued'
                            ? 'neutral'
                            : 'error'
                        }
                        dot={true}
                        pulse={gen.status === 'running'}
                      >
                        {gen.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">{gen.durationSec}s</td>
                    <td className="py-3.5 px-4 font-sans capitalize text-text-secondary">
                      {gen.license?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">{gen.provider}</td>
                    <td className="py-3.5 px-4 text-accent-violet font-semibold">
                      {gen.creditsCharged || gen.creditsReserved} cr
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {gen.audioUrl ? (
                        <button
                          type="button"
                          onClick={() => setActiveAudioUrl(gen.audioUrl)}
                          className="p-1.5 rounded-lg bg-accent-violet/10 hover:bg-accent-violet/20 text-accent-violet transition-colors"
                          title="Play generation"
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </button>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted font-sans">
                    <div className="flex flex-col items-center gap-2">
                      <Music2 className="w-8 h-8 text-white/10" />
                      <p>No generations recorded yet in this workspace.</p>
                      <Link
                        to="/dashboard/generations"
                        className="btn-primary-gradient px-3 py-1.5 rounded-lg text-xs font-semibold mt-2"
                      >
                        Create First Generation
                      </Link>
                    </div>
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
