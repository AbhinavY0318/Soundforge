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
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 relative overflow-hidden bg-radial-ambient">
      <div className="w-full max-w-md surface-card p-8 rounded-2xl relative shadow-card border border-white/10 z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 text-accent-violet flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
          <p className="text-xs text-text-secondary mt-1">Enter your account email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resetToken ? (
          <div className="p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Password Reset Link Created</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              In test mode, your reset token has been issued directly. Click below to reset your password:
            </p>
            <button
              type="button"
              onClick={() => navigate(`/auth/reset-password?token=${resetToken}`)}
              className="btn-primary-gradient w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2"
            >
              <span>Continue with Token</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@soundforge.ai"
                  className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-gradient w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
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
