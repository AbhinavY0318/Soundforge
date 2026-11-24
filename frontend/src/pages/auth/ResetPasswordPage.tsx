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
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 relative overflow-hidden bg-radial-ambient">
      <div className="w-full max-w-md surface-card p-8 rounded-2xl relative shadow-card border border-white/10 z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Set New Password</h1>
          <p className="text-xs text-text-secondary mt-1">Choose a strong password with at least 8 characters</p>
        </div>

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs mb-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-sm">Password Reset Successfully!</span>
            <span className="text-[11px] text-accent-emerald/80">Redirecting to login page...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary-gradient w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-text-secondary">
          <Link to="/auth/login" className="text-white hover:text-accent-violet font-semibold transition-colors">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
