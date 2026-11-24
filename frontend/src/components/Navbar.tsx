import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  LogOut,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Search,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from './Badge.js';
import { SoundForgeLogo } from './SoundForgeLogo.js';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, account, plan, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Generate clean breadcrumb title from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentSection = pathSegments[1]
    ? pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1).replace('-', ' ')
    : 'Overview';

  return (
    <header className="h-16 border-b border-white/8 bg-[#08090D]/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Brand & Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/dashboard" className="flex items-center">
          <SoundForgeLogo size="sm" showText={true} />
        </Link>

        {/* Desktop Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/8 text-sm">
          <span className="text-text-muted">Console</span>
          <span className="text-text-muted/60">/</span>
          <span className="font-medium text-white">{currentSection}</span>
        </div>
      </div>

      {/* Center Search / Command Mockup */}
      <div className="hidden lg:flex items-center w-72 max-w-xs">
        <div className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search API resources..."
            className="w-full bg-secondary/80 border border-white/8 rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-violet/50 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-muted bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Plan, Notifications, Account Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* API Docs Link */}
        <Link
          to="/dashboard/docs"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-white px-2.5 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-accent-indigo" />
          <span>API Docs</span>
        </Link>

        {/* Account Plan Pill */}
        {account && (
          <div className="hidden sm:flex items-center gap-2 bg-secondary/90 px-2.5 py-1.5 rounded-xl border border-white/8 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
            <span className="text-text-secondary font-medium truncate max-w-[100px]">
              {account.name}
            </span>
            <Badge
              variant={
                plan?.name === 'GROWTH'
                  ? 'violet'
                  : plan?.name === 'STARTER'
                  ? 'info'
                  : 'neutral'
              }
              size="sm"
            >
              {plan?.displayName || 'Starter'}
            </Badge>
          </div>
        )}

        {/* Notifications Icon with Indicator */}
        <div className="relative">
          <button
            type="button"
            className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-violet rounded-full ring-2 ring-[#08090D]" />
          </button>
        </div>

        {/* User Avatar Menu Dropdown */}
        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/8"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-violet to-accent-indigo text-white font-semibold text-xs flex items-center justify-center shadow-glow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden sm:block" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-card border border-white/10 shadow-card py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-white/5">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-text-muted truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-text-muted" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/dashboard/usage"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-accent-violet" />
                      <span>Subscription & Plan</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs text-accent-rose hover:bg-accent-rose/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
