import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music2,
  Coins,
  Cpu,
  CheckCircle2,
  ArrowUpRight,
  Play,
  Key,
  Plus,
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
    // Poll stats every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mock chart activity data for visualization
  const chartData = [
    { name: 'Mon', generations: 8, credits: 12 },
    { name: 'Tue', generations: 14, credits: 24 },
    { name: 'Wed', generations: 19, credits: 31 },
    { name: 'Thu', generations: 25, credits: 42 },
    { name: 'Fri', generations: 32, credits: 55 },
    { name: 'Sat', generations: 28, credits: 48 },
    { name: 'Sun', generations: 36, credits: 62 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#111827] border border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const allowance = stats?.monthlyAllowance || 200;
  const consumed = stats?.creditsConsumed || 0;
  const remaining = stats?.remainingCredits !== undefined ? stats.remainingCredits : Math.max(0, allowance - consumed);
  const percentUsed = Math.min(100, Math.round((consumed / (allowance || 1)) * 100));

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Developer Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Real-time telemetry, API usage, and music generations</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/generations"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Music</span>
          </Link>
          <Link
            to="/dashboard/api-keys"
            className="px-3.5 py-2 bg-[#111827] hover:bg-gray-800 text-gray-300 border border-gray-800 font-medium text-xs rounded-lg transition flex items-center gap-2"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>API Keys</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generations */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Generations</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Music2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-100">{stats?.totalGenerations || 0}</div>
          <div className="text-[11px] text-gray-500 mt-1">All-time generation jobs</div>
        </div>

        {/* Credits Remaining */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Credits Remaining</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-100">{remaining}</div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
            <span>{consumed} used</span>
            <span>{allowance} limit</span>
          </div>
        </div>

        {/* Active Concurrency Slots */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Concurrency</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-100">
            {stats?.activeGenerations || 0} <span className="text-sm font-normal text-gray-500">/ {stats?.parallelLimit || 3}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Parallel generation slots in use</div>
        </div>

        {/* Success Rate */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-100">{stats?.successRate || 100}%</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>{stats?.succeededGenerations || 0} successful completions</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Generation Throughput & Volume</h3>
            <p className="text-xs text-gray-400 mt-0.5">API requests and credit consumption over the last 7 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Generations</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Credits</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
              <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="generations" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorGen)" />
              <Area type="monotone" dataKey="credits" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorCred)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Generations Feed */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Recent Music Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest generations dispatched through the REST API</p>
          </div>
          <Link
            to="/dashboard/generations"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Audio Player Drawer when active */}
        {activeAudioUrl && (
          <div className="p-4 bg-indigo-950/20 border-b border-indigo-500/20">
            <AudioPlayer src={activeAudioUrl} title="Quick Preview" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19]/60 text-gray-400 font-medium border-b border-gray-800">
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
            <tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((gen: any) => (
                  <tr key={gen._id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-sans text-gray-200 font-medium max-w-xs truncate">
                      {gen.prompt}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge
                        variant={
                          gen.status === 'succeeded'
                            ? 'success'
                            : gen.status === 'running'
                            ? 'info'
                            : gen.status === 'queued'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {gen.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{gen.durationSec}s</td>
                    <td className="py-3.5 px-4 font-sans capitalize text-gray-300">
                      {gen.license?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{gen.provider}</td>
                    <td className="py-3.5 px-4 text-indigo-400 font-semibold">
                      {gen.creditsCharged || gen.creditsReserved} cr
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {gen.audioUrl ? (
                        <button
                          onClick={() => setActiveAudioUrl(gen.audioUrl)}
                          className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 transition"
                          title="Play generation"
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 font-sans">
                    No generations recorded yet. Click "Generate Music" to start!
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
