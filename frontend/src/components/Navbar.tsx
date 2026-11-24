import React from 'react';
import { Link } from 'react-router-dom';
import { Waves, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Badge } from './Badge.js';

export const Navbar: React.FC = () => {
  const { user, account, plan, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            SoundForge
          </span>
        </Link>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 font-mono">
          API v1
        </span>
      </div>

      {/* Center status: Plan & Account */}
      <div className="hidden md:flex items-center gap-3">
        {account && (
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-[#111827] px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-gray-200">{account.name}</span>
            <span className="text-gray-600">•</span>
            <Badge
              variant={
                plan?.name === 'GROWTH'
                  ? 'purple'
                  : plan?.name === 'STARTER'
                  ? 'info'
                  : 'neutral'
              }
            >
              {plan?.displayName || 'Sandbox'}
            </Badge>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/docs"
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-gray-800/60 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
          <span>API Docs</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-gray-200 truncate max-w-[140px]">
                {user.name}
              </div>
              <div className="text-[11px] text-gray-500 truncate max-w-[140px]">
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
