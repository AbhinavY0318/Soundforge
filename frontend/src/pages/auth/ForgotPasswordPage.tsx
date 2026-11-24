import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api.js';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/v1/auth/forgot-password', { email });
      setResetToken(res.data.resetToken);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Reset Password</h1>
          <p className="text-xs text-gray-400 mt-1">Enter your account email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetToken ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Password Reset Link Created</span>
            </div>
            <p className="text-gray-300">
              For local testing, use this generated reset token to set a new password:
            </p>
            <div className="p-2 bg-[#0B0F19] rounded border border-emerald-500/30 font-mono text-[11px] select-all break-all text-emerald-300">
              {resetToken}
            </div>
            <button
              onClick={() => navigate(`/auth/reset-password?token=${resetToken}`)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition text-xs"
            >
              Continue to Reset Password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Instructions</span>
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
