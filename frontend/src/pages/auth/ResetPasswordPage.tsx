import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState<string>(searchParams.get('token') || '');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await api.post('/api/v1/auth/reset-password', { token, password });
      setStatus('success');
      setTimeout(() => navigate('/auth/login'), 2500);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error?.message || 'Password reset failed. Invalid or expired token.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Set New Password</h1>
          <p className="text-xs text-gray-400 mt-1">Choose a strong password with at least 8 characters</p>
        </div>

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-sm">Password Reset Successfully!</span>
            <span className="text-emerald-500">Redirecting to login page...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Reset Token"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 font-mono focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <Link to="/auth/login" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
