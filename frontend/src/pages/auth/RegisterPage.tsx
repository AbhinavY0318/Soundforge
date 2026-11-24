import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { SoundForgeLogo } from '../../components/SoundForgeLogo.js';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/api/v1/auth/register', {
        name,
        email,
        password,
        accountName: accountName || `${name}'s Team`,
      });

      login(res.data.tokens, res.data.user, res.data.account);

      if (res.data.verificationToken) {
        navigate(`/auth/verify-email?token=${res.data.verificationToken}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090D] flex items-center justify-center p-4 relative overflow-hidden bg-radial-ambient">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-accent-violet/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md surface-card p-8 sm:p-10 rounded-2xl relative shadow-card border border-white/10 z-10">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />

        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="mb-4">
            <SoundForgeLogo size="lg" showText={false} />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-xs text-text-secondary mt-1.5">Instant API keys with starter tier included</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@soundforge.ai"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Organization / Workspace</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Lovelace Labs (optional)"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-text-secondary select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
              />
              <span>
                I agree to the <span className="text-white hover:underline">Terms of Service</span> and{' '}
                <span className="text-white hover:underline">Privacy Policy</span>.
              </span>
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
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Create Developer Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-white hover:text-accent-violet font-semibold transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
