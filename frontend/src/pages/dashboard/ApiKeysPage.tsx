import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { Modal } from '../../components/Modal.js';
import { ApiKey, ApiKeyMode } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';

export const ApiKeysPage: React.FC = () => {
  const { plan } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'test'>('all');

  // Create Key Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('');
  const [keyMode, setKeyMode] = useState<ApiKeyMode>('test');
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  // Rotate Key Modal State
  const [rotatingKey, setRotatingKey] = useState<ApiKey | null>(null);
  const [overlapHours, setOverlapHours] = useState<number>(24);
  const [rotateLoading, setRotateLoading] = useState<boolean>(false);

  // Revoke Confirm Modal State
  const [revokingKey, setRevokingKey] = useState<ApiKey | null>(null);
  const [revokeLoading, setRevokeLoading] = useState<boolean>(false);

  // Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api/v1/api-keys');
      setKeys(res.data.keys);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await api.post('/api/v1/api-keys', {
        name: keyName,
        mode: keyMode,
        scopes: ['generations:write', 'generations:read'],
      });
      setCreatedSecret(res.data.secret);
      await fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create API key');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRotate = async () => {
    if (!rotatingKey) return;
    setRotateLoading(true);
    try {
      const res = await api.post(`/api/v1/api-keys/${rotatingKey.id}/rotate`, {
        overlapHours,
      });
      setCreatedSecret(res.data.secret);
      setRotatingKey(null);
      await fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to rotate key');
    } finally {
      setRotateLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokingKey) return;
    setRevokeLoading(true);
    try {
      await api.delete(`/api/v1/api-keys/${revokingKey.id}`);
      setRevokingKey(null);
      await fetchKeys();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to revoke key');
    } finally {
      setRevokeLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredKeys = keys.filter((k) => {
    if (activeTab === 'all') return true;
    return k.mode === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">API Key Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Authenticate developer requests to <code className="text-indigo-400 font-mono">/v1/generations</code>
          </p>
        </div>

        <button
          onClick={() => {
            setKeyName('');
            setKeyMode(plan?.allowTestKeysOnly ? 'test' : 'live');
            setCreatedSecret(null);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
        {(['all', 'live', 'test'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              activeTab === tab
                ? 'bg-gray-800 text-indigo-400 border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab} Keys
          </button>
        ))}
      </div>

      {/* Keys Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19]/60 text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="py-3 px-6">Name</th>
                <th className="py-3 px-4">Key Prefix</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Scopes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Loading API keys...
                  </td>
                </tr>
              ) : filteredKeys.length > 0 ? (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-semibold text-gray-200">{k.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-300 flex items-center gap-2">
                      <span>{k.keyPrefix}</span>
                      <button
                        onClick={() => copyToClipboard(k.keyPrefix, k.id)}
                        className="text-gray-500 hover:text-gray-300 p-1"
                        title="Copy Prefix"
                      >
                        {copiedKey === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={k.mode === 'live' ? 'success' : 'info'}>
                        {k.mode}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-gray-800 text-[10px] font-mono text-gray-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          k.status === 'active'
                            ? 'success'
                            : k.status === 'rotating'
                            ? 'warning'
                            : 'error'
                        }
                      >
                        {k.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-mono">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {k.status !== 'revoked' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRotatingKey(k)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition"
                            title="Rotate Key"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setRevokingKey(k)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No {activeTab} API keys created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE API KEY MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreatedSecret(null);
        }}
        title={createdSecret ? 'Save Your API Secret Key' : 'Create New API Key'}
      >
        {createdSecret ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3 leading-relaxed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Store this secret securely!</span> You will not be
                able to view it again. If lost, you must rotate or generate a new key.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Secret API Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdSecret}
                  className="flex-1 bg-[#0B0F19] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(createdSecret, 'secret')}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'secret' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCreateOpen(false);
                setCreatedSecret(null);
              }}
              className="w-full mt-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition"
            >
              I Have Saved My Secret
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Key Label / Description
              </label>
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production Backend Webhook Service"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Key Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setKeyMode('test')}
                  className={`p-3 rounded-lg border text-left transition ${
                    keyMode === 'test'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-gray-800 bg-[#0B0F19] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-200">Test Mode</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Free Sandbox generations</div>
                </button>

                <button
                  type="button"
                  disabled={plan?.allowTestKeysOnly}
                  onClick={() => setKeyMode('live')}
                  className={`p-3 rounded-lg border text-left transition ${
                    keyMode === 'live'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white'
                      : plan?.allowTestKeysOnly
                      ? 'opacity-40 cursor-not-allowed border-gray-800'
                      : 'border-gray-800 bg-[#0B0F19] text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="text-xs font-bold text-gray-200">Live Mode</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {plan?.allowTestKeysOnly ? 'Requires Starter/Growth' : 'Commercial synthesis'}
                  </div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoading || !keyName}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {createLoading ? 'Generating...' : 'Create Key'}
            </button>
          </form>
        )}
      </Modal>

      {/* ROTATE KEY MODAL */}
      <Modal
        isOpen={!!rotatingKey}
        onClose={() => setRotatingKey(null)}
        title="Rotate API Key Safely"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-300 leading-relaxed">
            Rotating creates an immediate replacement key while allowing the existing key to remain
            functional during a safe overlap window, preventing service interruptions.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Overlap Window Duration
            </label>
            <select
              value={overlapHours}
              onChange={(e) => setOverlapHours(parseInt(e.target.value, 10))}
              className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-indigo-500"
            >
              <option value={24}>24 Hours (Recommended for zero-downtime CI/CD)</option>
              <option value={48}>48 Hours (Extended migration window)</option>
              <option value={1}>1 Hour (Quick rotation)</option>
              <option value={0}>0 Hours (Immediate atomic replacement)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRotatingKey(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRotate}
              disabled={rotateLoading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition"
            >
              {rotateLoading ? 'Rotating...' : 'Rotate Key Now'}
            </button>
          </div>
        </div>
      </Modal>

      {/* REVOKE KEY CONFIRMATION MODAL */}
      <Modal
        isOpen={!!revokingKey}
        onClose={() => setRevokingKey(null)}
        title="Confirm Key Revocation"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold">Immediate Invalidation:</span> Any requests using prefix{' '}
              <span className="font-mono">{revokingKey?.keyPrefix}</span> will fail with HTTP 401
              instantly.
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Are you sure you want to revoke key <strong>{revokingKey?.name}</strong>?
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRevokingKey(null)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRevoke}
              disabled={revokeLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-rose-500/25"
            >
              {revokeLoading ? 'Revoking...' : 'Revoke Immediately'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
