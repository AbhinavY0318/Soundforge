import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [token, setToken] = useState<string>(searchParams.get('token') || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleVerify = async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setStatus('loading');
    setMessage('');

    try {
      const res = await api.post('/api/v1/auth/verify-email', { token: tokenToUse });
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      await refreshUser();
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.error?.message || 'Verification token is invalid or expired.');
    }
  };

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      handleVerify(urlToken);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 relative overflow-hidden bg-radial-ambient">
      <div className="w-full max-w-md surface-card p-8 rounded-2xl relative shadow-card text-center border border-white/10 z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Verify Your Email</h1>
        <p className="text-xs text-text-secondary mb-6 leading-relaxed">
          Confirm your email address to unlock production live API keys and full commercial licensing.
        </p>

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs mb-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">{message}</span>
            <span className="text-[11px] text-accent-emerald/80">Redirecting to dashboard...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs mb-6 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status !== 'success' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(token);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 text-left">
                Verification Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste verification token"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary-gradient w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-text-secondary">
          <Link to="/dashboard" className="text-white hover:text-accent-violet font-medium transition-colors">
            Skip for now &rarr; Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
