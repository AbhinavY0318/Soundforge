import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Trash2,
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

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Account & Organization Settings</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage your organization profile, team members, roles, and security credentials
        </p>
      </div>

      {/* Organization Details */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
          <Building className="w-5 h-5 text-indigo-400" />
          <span>Organization Profile</span>
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800">
            <span className="text-gray-500 block mb-1">Organization Name</span>
            <span className="text-gray-200 font-sans font-semibold text-sm">{account?.name}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800">
            <span className="text-gray-500 block mb-1">Account ID</span>
            <span className="text-indigo-400 select-all">{account?.id}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800">
            <span className="text-gray-500 block mb-1">Primary Owner</span>
            <span className="text-gray-300 font-sans">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-gray-800">
            <span className="text-gray-500 block mb-1">Current Plan</span>
            <span className="text-emerald-400 font-sans font-semibold">
              {plan?.displayName} Tier ({plan?.monthlyAllowance} credits / mo)
            </span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Team Members & Permissions</h3>
            <p className="text-xs text-gray-400 mt-0.5">Control who can access this organization and manage API keys</p>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="divide-y divide-gray-800/60">
          {loadingMembers ? (
            <div className="p-8 text-center text-gray-500 text-xs">Loading team...</div>
          ) : members.length > 0 ? (
            members.map((m) => (
              <div key={m._id} className="p-4 flex items-center justify-between hover:bg-gray-800/20 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 font-semibold text-xs flex items-center justify-center">
                    {m.userId?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-200">{m.userId?.name}</div>
                    <div className="text-[11px] text-gray-400">{m.userId?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={m.role === 'owner' ? 'purple' : m.role === 'admin' ? 'info' : 'neutral'}>
                    {m.role}
                  </Badge>

                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs">No team members found.</div>
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
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Role & Permissions
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="member">Member (Can generate music & view usage)</option>
              <option value="admin">Admin (Can manage API keys, webhooks, & team)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={inviteLoading || !inviteEmail}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            {inviteLoading ? 'Sending Invite...' : 'Send Invitation'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
