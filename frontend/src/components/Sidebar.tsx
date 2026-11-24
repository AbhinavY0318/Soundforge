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
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { plan } = useAuth();

  const navItems: NavItem[] = [
    { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Generations', path: '/dashboard/generations', icon: Music2 },
    { label: 'API Keys', path: '/dashboard/api-keys', icon: Key },
    { label: 'Usage & Billing', path: '/dashboard/usage', icon: BarChart3 },
    { label: 'Webhooks', path: '/dashboard/webhooks', icon: Webhook },
    { label: 'API Documentation', path: '/dashboard/docs', icon: BookOpen },
    { label: 'Team', path: '/dashboard/settings', icon: Users },
    { label: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 border-r border-white/8 bg-[#08090D] flex flex-col justify-between p-4 flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation List */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-text-muted uppercase tracking-wider select-none">
              Platform & APIs
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path + item.label}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-accent-violet/15 to-accent-indigo/10 text-white font-semibold border border-accent-violet/25 shadow-glow-sm'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Left Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-accent-violet to-accent-indigo rounded-r-full" />
                      )}
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          isActive
                            ? 'text-accent-violet'
                            : 'text-text-muted group-hover:text-text-secondary'
                        }`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Plan Card */}
        <div className="pt-4 border-t border-white/5">
          <div className="surface-card p-4 relative overflow-hidden group">
            {/* Top gradient highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />
            
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-accent-violet flex-shrink-0" />
              <span className="text-xs font-semibold text-white">
                {plan?.displayName || 'Starter'} Tier
              </span>
            </div>

            <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
              {plan?.monthlyAllowance
                ? `${plan.monthlyAllowance} monthly generation credits.`
                : 'Free sandbox development mode.'}
            </p>

            <NavLink
              to="/dashboard/usage"
              onClick={onClose}
              className="block w-full text-center text-xs font-medium bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl border border-white/8 transition-colors hover:border-white/20"
            >
              Upgrade & Usage
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};
