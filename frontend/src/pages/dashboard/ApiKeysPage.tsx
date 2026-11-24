import React, { useState, useEffect } from 'react';
import {
  Plus,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Trash2,
  ShieldAlert,
  Clock,
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
  const [scopes, setScopes] = useState<string[]>(['generations:write', 'generations:read']);
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
        scopes,
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
          <h1 className="text-2xl font-bold tracking-tight text-white">API Key Management</h1>
          <p className="text-xs text-text-secondary mt-1">
            Authenticate developer requests to <code className="text-accent-violet font-mono">/v1/generations</code>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setKeyName('');
            setKeyMode(plan?.allowTestKeysOnly ? 'test' : 'live');
            setCreatedSecret(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        {(['all', 'live', 'test'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'bg-accent-violet/15 text-accent-violet border border-accent-violet/30'
                : 'text-text-muted hover:text-white'
            }`}
          >
            {tab} Keys
          </button>
        ))}
      </div>

      {/* Keys Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090D]/60 text-text-muted font-medium border-b border-white/5">
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
            <tbody className="divide-y divide-white/5 text-text-secondary font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
                      <span>Loading keys...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredKeys.length > 0 ? (
                filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-sans font-semibold text-white">{k.name}</td>
                    <td className="py-3.5 px-4 text-text-primary flex items-center gap-2">
                      <span>{k.keyPrefix}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k.keyPrefix, k.id)}
                        className="text-text-muted hover:text-white p-1"
                        title="Copy Prefix"
                      >
                        {copiedKey === k.id ? (
                          <Check className="w-3.5 h-3.5 text-accent-emerald" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={k.mode === 'live' ? 'cyan' : 'warning'}>
                        {k.mode}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex gap-1 flex-wrap">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-text-muted"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge
                        variant={
                          k.status === 'active'
                            ? 'success'
                            : k.status === 'rotating'
                            ? 'warning'
                            : 'error'
                        }
                        dot={true}
                      >
                        {k.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {k.status !== 'revoked' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setRotatingKey(k)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent-amber hover:bg-accent-amber/10 transition-colors"
                            title="Rotate Key (24h overlap)"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokingKey(k)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
                            title="Revoke Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans">
                    No {activeTab !== 'all' ? activeTab : ''} API keys found. Click "Generate New Key" to create one.
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
        title={createdSecret ? 'API Key Created Successfully' : 'Generate New API Key'}
      >
        {createdSecret ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Copy this key now.</span>
                For security reasons, this secret is stored as a SHA-256 hash and will never be shown again.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Full API Key Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdSecret}
                  className="w-full bg-[#08090D] border border-white/10 rounded-xl p-3 text-xs font-mono text-accent-cyan select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdSecret, 'secret')}
                  className="btn-primary-gradient px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedKey === 'secret' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreatedSecret(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
              >
                I Have Stored This Key Safely
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Key Name / Description
              </label>
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production iOS Client"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Key Environment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={plan?.allowTestKeysOnly}
                  onClick={() => setKeyMode('live')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    keyMode === 'live'
                      ? 'bg-accent-cyan/10 border-accent-cyan/40 text-white'
                      : 'bg-[#08090D] border-white/8 text-text-muted hover:border-white/20'
                  } ${plan?.allowTestKeysOnly ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="font-semibold text-accent-cyan mb-1">Live Mode (sf_live_...)</div>
                  <div className="text-[11px] text-text-secondary">Deducts credits, generates real tracks</div>
                </button>

                <button
                  type="button"
                  onClick={() => setKeyMode('test')}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors ${
                    keyMode === 'test'
                      ? 'bg-accent-amber/10 border-accent-amber/40 text-white'
                      : 'bg-[#08090D] border-white/8 text-text-muted hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-accent-amber mb-1">Test Mode (sf_test_...)</div>
                  <div className="text-[11px] text-text-secondary">Zero cost, synthetic validation</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Scopes / Permissions
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.includes('generations:write')}
                    onChange={(e) => {
                      if (e.target.checked) setScopes([...scopes, 'generations:write']);
                      else setScopes(scopes.filter((s) => s !== 'generations:write'));
                    }}
                    className="rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
                  />
                  <span className="font-mono text-white">generations:write</span> — Create & cancel audio jobs
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scopes.includes('generations:read')}
                    onChange={(e) => {
                      if (e.target.checked) setScopes([...scopes, 'generations:read']);
                      else setScopes(scopes.filter((s) => s !== 'generations:read'));
                    }}
                    className="rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
                  />
                  <span className="font-mono text-white">generations:read</span> — Read jobs & telemetry
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading || !keyName}
                className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {createLoading ? 'Generating...' : 'Generate API Key'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ROTATE KEY MODAL */}
      <Modal
        isOpen={!!rotatingKey}
        onClose={() => setRotatingKey(null)}
        title="Zero-Downtime Key Rotation"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-accent-indigo/10 border border-accent-indigo/20 text-accent-indigo text-xs flex items-start gap-2.5">
            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">24-Hour Overlap Window</span>
              A new key will be generated immediately. The existing key ({rotatingKey?.keyPrefix}) will
              remain active for 24 hours to prevent production integration downtime.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
              Overlap Duration (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={overlapHours}
              onChange={(e) => setOverlapHours(parseInt(e.target.value, 10))}
              className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
            />
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRotatingKey(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRotate}
              disabled={rotateLoading}
              className="px-4 py-2 bg-accent-amber hover:bg-accent-amber/90 text-[#08090D] font-semibold text-xs rounded-xl transition-colors"
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
        title="Revoke Developer API Key"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Immediate Invalidation</span>
              Are you sure you want to revoke <span className="font-mono">{revokingKey?.keyPrefix}</span>?
              All future REST API requests signed with this key will fail immediately with HTTP 401.
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRevokingKey(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={revokeLoading}
              className="px-4 py-2 bg-accent-rose hover:bg-accent-rose/90 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              {revokeLoading ? 'Revoking...' : 'Confirm Revocation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
