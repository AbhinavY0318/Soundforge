import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { SoundForgeLogo } from '../../components/SoundForgeLogo.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>('developer@soundforge.ai');
  const [password, setPassword] = useState<string>('SoundForge2026!');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      login(res.data.tokens, res.data.user, res.data.account);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 relative overflow-hidden bg-radial-ambient">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-accent-violet/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md surface-card p-8 sm:p-10 rounded-2xl relative shadow-card border border-white/10 z-10">
        {/* Top subtle border glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-4">
            <SoundForgeLogo size="lg" showText={false} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-xs text-text-secondary mt-1.5">Sign in to your SoundForge developer console</p>
        </div>

        {/* Demo Credentials Helper Pill */}
        <div className="mb-6 p-3 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-between">
          <div className="text-[11px] text-accent-violet leading-tight">
            <span className="font-semibold">Demo credentials ready:</span> developer@soundforge.ai
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('developer@soundforge.ai');
              setPassword('SoundForge2026!');
            }}
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-accent-violet/20 hover:bg-accent-violet/30 text-accent-violet font-semibold transition-colors"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-text-secondary">Password</label>
              <Link
                to="/auth/forgot-password"
                className="text-xs text-accent-violet hover:text-accent-violet/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-gradient w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-text-secondary">
          Don't have an account?{' '}
          <Link to="/auth/register" className="text-white hover:text-accent-violet font-semibold transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};
