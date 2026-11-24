import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Music2,
  Key,
  BarChart3,
  Webhook,
  BookOpen,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { plan } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Generations', path: '/dashboard/generations', icon: Music2 },
    { label: 'API Keys', path: '/dashboard/api-keys', icon: Key },
    { label: 'Usage & Credits', path: '/dashboard/usage', icon: BarChart3 },
    { label: 'Webhooks', path: '/dashboard/webhooks', icon: Webhook },
    { label: 'Documentation', path: '/dashboard/docs', icon: BookOpen },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-gray-800 bg-[#0B0F19] flex flex-col justify-between p-4 flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Developer Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-semibold'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Plan Card */}
      <div className="mt-auto pt-4">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-gray-200">
              {plan?.displayName || 'Starter'} Plan
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">
            {plan?.monthlyAllowance ? `${plan.monthlyAllowance} monthly credits included.` : 'Unlimited test keys in Sandbox mode.'}
          </p>
          <NavLink
            to="/dashboard/usage"
            className="block text-center text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 py-1.5 rounded-lg border border-gray-700 transition"
          >
            Manage Subscription
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
