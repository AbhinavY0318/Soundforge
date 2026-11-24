import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Badge } from '../../components/Badge.js';
import { Modal } from '../../components/Modal.js';
import { WebhookEndpoint, WebhookDelivery } from '../../types/index.js';

export const WebhooksPage: React.FC = () => {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('https://example.com/api/soundforge-webhook');
  const [description, setDescription] = useState<string>('');
  const events = ['generation.succeeded', 'generation.failed'];
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchWebhooks = async () => {
    try {
      const [epRes, delRes] = await Promise.all([
        api.get('/api/v1/webhooks'),
        api.get('/api/v1/webhooks/deliveries'),
      ]);
      setEndpoints(epRes.data.data || epRes.data);
      setDeliveries(delRes.data.data || delRes.data);
    } catch {
      // Ignored
    } finally {
      // Finished
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await api.post('/api/v1/webhooks', {
        url,
        description,
        events,
      });
      setCreatedSecret(res.data.signing_secret);
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to register webhook endpoint');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return;
    try {
      await api.delete(`/api/v1/webhooks/${id}`);
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to delete webhook');
    }
  };

  const handleRetry = async (deliveryId: string) => {
    try {
      await api.post(`/api/v1/webhooks/deliveries/${deliveryId}/retry`);
      await fetchWebhooks();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Retry delivery failed');
    }
  };

  const copySecret = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Webhooks & Event Deliveries</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time event notifications signed with HMAC-SHA256 and SSRF validation
          </p>
        </div>

        <button
          onClick={() => {
            setUrl('https://example.com/api/soundforge-webhook');
            setDescription('');
            setCreatedSecret(null);
            setIsAddOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {/* Endpoints List */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h3 className="text-base font-semibold text-gray-100">Registered Endpoints</h3>
          <p className="text-xs text-gray-400 mt-0.5">Destinations receiving music generation notifications</p>
        </div>

        <div className="divide-y divide-gray-800/60">
          {endpoints.length > 0 ? (
            endpoints.map((ep) => (
              <div key={ep.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-800/20 transition">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-sm font-semibold text-gray-200">{ep.url}</span>
                    <Badge variant={ep.active ? 'success' : 'neutral'}>
                      {ep.active ? 'active' : 'disabled'}
                    </Badge>
                  </div>
                  {ep.description && (
                    <div className="text-xs text-gray-400 mb-2">{ep.description}</div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ep.events.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 rounded bg-gray-800 text-[11px] font-mono text-indigo-400 border border-gray-700">
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete endpoint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 text-xs">
              No webhook endpoints registered yet. Click "Add Webhook Endpoint" to configure one.
            </div>
          )}
        </div>
      </div>

      {/* Delivery Logs */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-100">Delivery History & Retries</h3>
            <p className="text-xs text-gray-400 mt-0.5">Audit log of recent event delivery attempts</p>
          </div>
          <button
            onClick={fetchWebhooks}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F19]/60 text-gray-400 font-medium border-b border-gray-800">
              <tr>
                <th className="py-3 px-6">Delivery ID</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Response Code</th>
                <th className="py-3 px-4">Attempt</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300 font-mono">
              {deliveries.length > 0 ? (
                deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-3.5 px-6 font-semibold text-gray-200">{d.delivery_id}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="text-indigo-400">{d.event}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={d.status === 'success' ? 'success' : 'error'}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.status_code ? (
                        <span className={d.status_code < 300 ? 'text-emerald-400' : 'text-rose-400'}>
                          {d.status_code}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">#{d.attempt}</td>
                    <td className="py-3.5 px-4 text-gray-400">{d.duration_ms ? `${d.duration_ms}ms` : '—'}</td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(d.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {d.status === 'failed' && (
                        <button
                          onClick={() => handleRetry(d.delivery_id)}
                          className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-indigo-400 font-sans text-xs transition"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-sans">
                    No webhook deliveries logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD WEBHOOK MODAL */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setCreatedSecret(null);
        }}
        title={createdSecret ? 'Webhook Signing Secret' : 'Register Webhook Endpoint'}
      >
        {createdSecret ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Save this signing secret!</span> This secret will never
                be displayed again. Use it to verify incoming payload signatures against the{' '}
                <code className="text-amber-300 font-mono">SoundForge-Signature</code> header.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Signing Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdSecret}
                  className="flex-1 bg-[#0B0F19] border border-gray-700 rounded-lg px-3.5 py-2.5 text-xs text-indigo-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={copySecret}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {copied ? (
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
                setIsAddOpen(false);
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
                Endpoint URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://my-app.com/api/soundforge-webhook"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition font-mono"
              />
              <div className="mt-1 text-[11px] text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by SSRF firewall: localhost and private subnets are blocked.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production music fulfillment pipeline"
                className="w-full bg-[#0B0F19] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={createLoading || !url}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {createLoading ? 'Validating...' : 'Register Webhook'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};
