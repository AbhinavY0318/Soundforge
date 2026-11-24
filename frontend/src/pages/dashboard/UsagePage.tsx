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
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#111827] border border-gray-800 rounded-xl animate-pulse" />
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Usage, Billing & Metering</h1>
        <p className="text-xs text-gray-400 mt-1">
          Monitor credit allowance, overage telemetry, and per-key consumption for period{' '}
          <span className="font-mono text-indigo-400">{usage?.periodMonth}</span>
        </p>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <strong>Downgrade Notice:</strong> {notice}
        </div>
      )}

      {/* Credit Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Monthly Allowance
          </div>
          <div className="text-3xl font-bold text-gray-100">{credits.monthlyAllowance} credits</div>
          <div className="text-xs text-gray-500 mt-1">
            Plan: {usage?.plan?.displayName || currentPlan?.displayName}
          </div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Credits Consumed
          </div>
          <div className="text-3xl font-bold text-indigo-400">{credits.totalConsumed} credits</div>
          <div className="text-xs text-gray-500 mt-1">{credits.used} settled, {(credits as any).reserved || 0} active reservations</div>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Remaining Balance
          </div>
          <div className="text-3xl font-bold text-emerald-400">{credits.remaining} credits</div>
          <div className="text-xs text-gray-500 mt-1">
            {credits.overageUsed > 0 ? `${credits.overageUsed} overage credits active` : 'Within monthly allowance'}
          </div>
        </div>
      </div>

      {/* Daily Usage Chart */}
      {usage?.dailyUsage && usage.dailyUsage.length > 0 && (
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-100 mb-1">Daily Credit Metering</h3>
          <p className="text-xs text-gray-400 mb-6">Aggregated consumption timeline for the current billing cycle</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usage.dailyUsage}>
                <defs>
                  <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="credits" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#usageGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Per-Key Usage Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-base font-semibold text-gray-100">Consumption Breakdown by API Key</h3>
          <p className="text-xs text-gray-400 mt-0.5">Track developer usage across microservices and integration points</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19]/60 text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="py-3 px-6">Key Label</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Generations</th>
                <th className="py-3 px-6 text-right">Credits Consumed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {usage?.perKeyUsage && usage.perKeyUsage.length > 0 ? (
                usage.perKeyUsage.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-semibold text-gray-200">{item.keyName}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">{item.keyPrefix}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={item.mode === 'live' ? 'success' : 'info'}>
                        {item.mode}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{item.generationsCount}</td>
                    <td className="py-3.5 px-6 text-right font-mono font-bold text-indigo-400">
                      {item.credits} cr
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No API key consumption logged for this billing period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Plan Switcher */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Subscription Plans</h3>
            <p className="text-xs text-gray-400 mt-0.5">Upgrade or downgrade your account tier at any time</p>
          </div>

          {currentPlan?.overageAllowed && (
            <div className="flex items-center gap-3 bg-[#0B0F19] px-4 py-2 rounded-lg border border-gray-800">
              <span className="text-xs text-gray-300 font-medium">Overage Billing</span>
              <button
                type="button"
                onClick={() => handleToggleOverage(!account?.overageEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 transition ${
                  account?.overageEnabled ? 'bg-indigo-600' : 'bg-gray-700'
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
                className={`p-6 rounded-xl border flex flex-col justify-between transition ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-gray-800 bg-[#0B0F19]/50 hover:border-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-100">{p.displayName}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-gray-100 mb-4">
                    ${p.priceMonthlyUsd} <span className="text-xs text-gray-500 font-normal">/ mo</span>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-400 mb-6">
                    <li>• {p.monthlyAllowance} Monthly credits</li>
                    <li>• {p.parallelLimit} Parallel generations</li>
                    <li>• {p.requestsPerHour} Requests / hour</li>
                    <li>• Licenses: {p.allowedLicenses.join(', ')}</li>
                  </ul>
                </div>

                <button
                  onClick={() => handleChangePlan(p.name)}
                  disabled={isCurrent || planChangeLoading}
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                    isCurrent
                      ? 'bg-gray-800 text-gray-500 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
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
