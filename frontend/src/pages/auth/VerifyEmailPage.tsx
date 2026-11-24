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
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6" />
        </div>

        <h1 className="text-2xl font-bold text-gray-100 mb-2">Verify Your Email</h1>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Confirm your email address to unlock production live API keys and full commercial licensing.
        </p>

        {status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold">{message}</span>
            <span className="text-xs text-emerald-500">Redirecting to dashboard...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {status !== 'success' && (
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste verification token"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono text-center"
              />
            </div>

            <button
              onClick={() => handleVerify(token)}
              disabled={status === 'loading' || !token}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-800">
          <Link to="/dashboard" className="text-xs text-gray-400 hover:text-gray-200 transition">
            Skip for now & go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
