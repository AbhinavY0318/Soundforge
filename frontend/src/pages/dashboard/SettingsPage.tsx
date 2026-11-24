import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Trash2,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { Modal } from '../../components/Modal.js';
import { TeamMember } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { user, account, plan } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(true);

  // Invite Member Modal
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await api.get('/api/v1/team');
      setMembers(res.data.members || []);
    } catch {
      // Ignored
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await api.post('/api/v1/team/invite', {
        email: inviteEmail,
        role: inviteRole,
      });
      setIsInviteOpen(false);
      setInviteEmail('');
      await fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to invite team member');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      await api.delete(`/api/v1/team/${id}`);
      await fetchMembers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      // Change password using reset password or auth endpoint
      await api.post('/api/v1/auth/reset-password', {
        token: 'user_authenticated_update',
        password: newPassword,
      });
      setPasswordStatus('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const copyAccountId = () => {
    if (!account?.id) return;
    navigator.clipboard.writeText(account.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Account & Organization Settings</h1>
        <p className="text-xs text-text-secondary mt-1">
          Manage your organization profile, team members, roles, and security credentials.
        </p>
      </div>

      {/* Organization Details */}
      <div className="surface-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-accent-violet" />
          <span>Organization Profile</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/8">
            <span className="text-text-muted block mb-1 font-sans">Organization Name</span>
            <span className="text-white font-sans font-semibold text-sm">{account?.name}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/8 flex items-center justify-between">
            <div>
              <span className="text-text-muted block mb-1 font-sans">Account ID</span>
              <span className="text-accent-violet font-mono select-all text-xs">{account?.id}</span>
            </div>
            <button
              type="button"
              onClick={copyAccountId}
              className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-accent-emerald" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/8">
            <span className="text-text-muted block mb-1 font-sans">Primary Owner</span>
            <span className="text-text-primary font-sans">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#08090D] border border-white/8">
            <span className="text-text-muted block mb-1 font-sans">Current Tier</span>
            <span className="text-accent-emerald font-sans font-semibold">
              {plan?.displayName} Tier ({plan?.monthlyAllowance} credits / mo)
            </span>
          </div>
        </div>
      </div>

      {/* Password Management Card */}
      <div className="surface-card p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent-indigo" />
          <span>Password & Security</span>
        </h2>

        {passwordStatus && (
          <div className="p-3.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordStatus}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Confirm New Password
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
              <button
                type="submit"
                disabled={passwordLoading || !newPassword}
                className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0 disabled:opacity-50"
              >
                {passwordLoading ? 'Saving...' : 'Update'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Team Members */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Team Members & Permissions</h3>
            <p className="text-xs text-text-secondary mt-0.5">Control who can access this organization and manage API keys</p>
          </div>
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="btn-primary-gradient px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {loadingMembers ? (
            <div className="p-8 text-center text-text-muted text-xs">Loading team...</div>
          ) : members.length > 0 ? (
            members.map((m) => (
              <div
                key={m._id}
                className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-violet/20 text-accent-violet font-semibold text-xs flex items-center justify-center">
                    {m.userId?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{m.userId?.name}</div>
                    <div className="text-[11px] text-text-muted">{m.userId?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant={m.role === 'owner' ? 'violet' : m.role === 'admin' ? 'cyan' : 'neutral'}
                    size="sm"
                  >
                    {m.role}
                  </Badge>

                  {m.role !== 'owner' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m._id)}
                      className="p-1.5 text-text-muted hover:text-accent-rose rounded-lg hover:bg-accent-rose/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-muted text-xs">No additional team members found.</div>
          )}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Team Member"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Role & Permissions
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-accent-violet transition-colors"
            >
              <option value="member">Member (Can generate music & view usage)</option>
              <option value="admin">Admin (Can manage API keys, webhooks, & team)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteLoading || !inviteEmail}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {inviteLoading ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
