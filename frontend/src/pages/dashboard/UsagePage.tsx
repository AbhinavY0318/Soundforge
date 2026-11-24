import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Coins,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { UsageOverview, PlanName } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const UsagePage: React.FC = () => {
  const { plan: currentPlan, account, refreshUser } = useAuth();
  const [usage, setUsage] = useState<UsageOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [planChangeLoading, setPlanChangeLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const [usageRes, plansRes] = await Promise.all([
        api.get('/api/v1/usage'),
        api.get('/api/v1/plans'),
      ]);
      setUsage(usageRes.data);
      setPlans(plansRes.data.plans || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleChangePlan = async (planName: PlanName) => {
    setPlanChangeLoading(true);
    setNotice(null);
    try {
      const res = await api.post('/api/v1/plans/change', { planName });
      if (res.data.notice) {
        setNotice(res.data.notice);
      }
      await refreshUser();
      await fetchUsage();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update plan');
    } finally {
      setPlanChangeLoading(false);
    }
  };

  const handleToggleOverage = async (enabled: boolean) => {
    try {
      await api.post('/api/v1/plans/overage', { enabled });
      await refreshUser();
      await fetchUsage();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to toggle overage billing');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl surface-card skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const credits = usage?.credits || {
    monthlyAllowance: 200,
    used: 0,
    remaining: 200,
    totalConsumed: 0,
    overageUsed: 0,
    overageEnabled: false,
  };

  const percentUsed = Math.min(
    100,
    Math.round((credits.totalConsumed / (credits.monthlyAllowance || 1)) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Usage & Billing Metering</h1>
        <p className="text-xs text-text-secondary mt-1">
          Monitor credit allowance, overage telemetry, and per-key consumption for billing period{' '}
          <span className="font-mono text-accent-violet font-semibold">{usage?.periodMonth}</span>
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">Downgrade Policy Enforcement:</strong>
            {notice}
          </div>
        </div>
      )}

      {/* Credit Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Monthly Allowance */}
        <div className="surface-card p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Monthly Allowance
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-indigo/10 text-accent-indigo flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {credits.monthlyAllowance} <span className="text-xs font-normal text-text-muted">credits</span>
          </div>
          <div className="text-xs text-text-secondary mt-1.5 flex items-center gap-1.5">
            <Badge variant="violet" size="sm">
              {usage?.plan?.displayName || currentPlan?.displayName} Tier
            </Badge>
          </div>
        </div>

        {/* Credits Consumed */}
        <div className="surface-card p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Credits Consumed
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-violet/10 text-accent-violet flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-accent-violet tabular-nums tracking-tight">
            {credits.totalConsumed} <span className="text-xs font-normal text-text-muted">credits</span>
          </div>
          <div className="text-xs text-text-secondary mt-1.5">
            {credits.used} settled • {(credits as any).reserved || 0} active reservations
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="surface-card p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Remaining Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-accent-emerald tabular-nums tracking-tight">
            {credits.remaining} <span className="text-xs font-normal text-text-muted">credits</span>
          </div>
          <div className="text-xs text-text-secondary mt-1.5">
            {credits.overageUsed > 0 ? (
              <span className="text-accent-amber font-semibold">{credits.overageUsed} overage credits active</span>
            ) : (
              '100% within included allowance'
            )}
          </div>
        </div>
      </div>

      {/* Credit Consumption Progress Bar Card */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white">Monthly Credit Consumption</span>
          <span className="text-xs font-mono font-semibold text-accent-violet">{percentUsed}% utilized</span>
        </div>
        <div className="w-full bg-[#08090D] h-2.5 rounded-full overflow-hidden border border-white/5">
          <div
            className="bg-gradient-to-r from-accent-violet to-accent-cyan h-full rounded-full transition-all duration-700"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-text-muted mt-2">
          <span>0 credits</span>
          <span>{credits.monthlyAllowance} limit</span>
        </div>
      </div>

      {/* Daily Usage Chart */}
      {usage?.dailyUsage && usage.dailyUsage.length > 0 && (
        <div className="surface-card p-6">
          <h3 className="text-base font-semibold text-white tracking-tight mb-1">Daily Credit Metering</h3>
          <p className="text-xs text-text-secondary mb-6">Aggregated consumption timeline for the current billing cycle</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage.dailyUsage}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
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
                <Area
                  type="monotone"
                  dataKey="credits"
                  stroke="#A78BFA"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#usageGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Key Usage Table */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-base font-semibold text-white tracking-tight">Consumption Breakdown by API Key</h3>
          <p className="text-xs text-text-secondary mt-0.5">Track developer usage across microservices and integration points</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090D]/60 text-text-muted font-medium border-b border-white/5">
              <tr>
                <th className="py-3 px-6">Key Label</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Generations</th>
                <th className="py-3 px-6 text-right">Credits Consumed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-text-secondary">
              {usage?.perKeyUsage && usage.perKeyUsage.length > 0 ? (
                usage.perKeyUsage.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-white">{item.keyName}</td>
                    <td className="py-3.5 px-4 font-mono text-text-muted">{item.keyPrefix}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.mode === 'live' ? 'cyan' : 'warning'}>
                        {item.mode}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{item.generationsCount}</td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-accent-violet">
                      {item.credits} cr
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-text-muted">
                    No API key consumption logged for this billing period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Plan Switcher */}
      <div className="surface-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Subscription Tier Management</h3>
            <p className="text-xs text-text-secondary mt-0.5">Upgrade or downgrade your account tier at any time</p>
          </div>

          {currentPlan?.overageAllowed && (
            <div className="flex items-center gap-3 bg-[#08090D] px-4 py-2 rounded-xl border border-white/8">
              <span className="text-xs text-text-secondary font-medium">Overage Billing</span>
              <button
                type="button"
                onClick={() => handleToggleOverage(!account?.overageEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  account?.overageEnabled ? 'bg-accent-violet' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition transform ${
                    account?.overageEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan?.name === p.name;
            return (
              <div
                key={p.name}
                className={`p-6 rounded-2xl border flex flex-col justify-between transition-colors ${
                  isCurrent
                    ? 'border-accent-violet/50 bg-accent-violet/5 shadow-glow-sm'
                    : 'border-white/8 bg-[#08090D]/50 hover:border-white/15'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{p.displayName}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-accent-violet/20 text-accent-violet text-[10px] font-bold">
                        ACTIVE PLAN
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-white mb-4">
                    ${p.priceMonthlyUsd} <span className="text-xs text-text-muted font-normal">/ mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-text-secondary mb-6">
                    <li>• {p.monthlyAllowance} Monthly credits</li>
                    <li>• {p.parallelLimit} Parallel generations</li>
                    <li>• {p.requestsPerHour} Requests / hour</li>
                    <li>• Licenses: {p.allowedLicenses.join(', ')}</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleChangePlan(p.name)}
                  disabled={isCurrent || planChangeLoading}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-white/5 text-text-muted cursor-default border border-white/5'
                      : 'btn-primary-gradient'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${p.displayName}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
