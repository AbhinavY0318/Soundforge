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
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('https://example.com/api/soundforge-webhook');
  const [description, setDescription] = useState<string>('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'generation.succeeded',
    'generation.failed',
  ]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const availableEvents = [
    { id: 'generation.succeeded', label: 'generation.succeeded — Audio synthesized & uploaded' },
    { id: 'generation.failed', label: 'generation.failed — Provider timeout or failure' },
    { id: 'generation.canceled', label: 'generation.canceled — Job canceled & credits refunded' },
  ];

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
      setLoading(false);
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
        events: selectedEvents,
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Webhooks & Event Deliveries</h1>
          <p className="text-xs text-text-secondary mt-1">
            Real-time event notifications signed with HMAC-SHA256 and SSRF firewall protection.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUrl('https://example.com/api/soundforge-webhook');
            setDescription('');
            setSelectedEvents(['generation.succeeded', 'generation.failed']);
            setCreatedSecret(null);
            setIsAddOpen(true);
          }}
          className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      {/* Endpoints List */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Registered Endpoints</h3>
            <p className="text-xs text-text-secondary mt-0.5">Destinations receiving music generation event payloads</p>
          </div>
          <span className="text-xs font-mono text-text-muted">{endpoints.length} configured</span>
        </div>

        <div className="divide-y divide-white/5">
          {endpoints.length > 0 ? (
            endpoints.map((ep) => (
              <div
                key={ep.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-xs font-semibold text-white">{ep.url}</span>
                    <Badge variant={ep.active ? 'success' : 'neutral'} dot={true} size="sm">
                      {ep.active ? 'active' : 'disabled'}
                    </Badge>
                  </div>
                  {ep.description && (
                    <div className="text-xs text-text-muted mb-2">{ep.description}</div>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ep.events.map((ev) => (
                      <span
                        key={ev}
                        className="px-2 py-0.5 rounded-lg bg-white/5 text-[11px] font-mono text-accent-violet border border-white/8"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(ep.id)}
                    className="p-2 rounded-xl text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
                    title="Delete endpoint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-text-muted text-xs">
              No webhook endpoints registered yet. Click "Add Webhook Endpoint" to configure one.
            </div>
          )}
        </div>
      </div>

      {/* Delivery Logs */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">Delivery History & Retries</h3>
            <p className="text-xs text-text-secondary mt-0.5">Audit log of recent event delivery attempts with exponential backoff</p>
          </div>
          <button
            type="button"
            onClick={fetchWebhooks}
            className="p-2 rounded-xl text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08090D]/60 text-text-muted font-medium border-b border-white/5">
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
            <tbody className="divide-y divide-white/5 text-text-secondary font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-accent-violet/30 border-t-accent-violet rounded-full animate-spin" />
                      <span>Loading delivery logs...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length > 0 ? (
                deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-white">{d.delivery_id}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <span className="text-accent-violet font-mono">{d.event}</span>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={d.status === 'success' ? 'success' : 'error'} dot={true}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {d.status_code ? (
                        <span className={d.status_code < 300 ? 'text-accent-emerald font-bold' : 'text-accent-rose font-bold'}>
                          {d.status_code}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">#{d.attempt}</td>
                    <td className="py-3.5 px-4 text-text-muted">{d.duration_ms ? `${d.duration_ms}ms` : '—'}</td>
                    <td className="py-3.5 px-4 text-text-muted">
                      {new Date(d.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {d.status === 'failed' && (
                        <button
                          type="button"
                          onClick={() => handleRetry(d.delivery_id)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-accent-violet font-sans text-xs transition-colors"
                        >
                          Retry Delivery
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted font-sans">
                    No webhook deliveries logged yet. Event dispatches will appear here in real time.
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
            <div className="p-3.5 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Save this signing secret securely!</span>
                This secret will never be displayed again. Use it to verify incoming payload signatures against the{' '}
                <code className="text-accent-amber font-mono">SoundForge-Signature</code> header.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Signing Secret
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdSecret}
                  className="w-full bg-[#08090D] border border-white/10 rounded-xl p-3 text-xs text-accent-cyan font-mono select-all"
                />
                <button
                  type="button"
                  onClick={copySecret}
                  className="btn-primary-gradient px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
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
                  setIsAddOpen(false);
                  setCreatedSecret(null);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
              >
                I Have Stored My Secret
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Endpoint URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://my-app.com/api/soundforge-webhook"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors font-mono"
              />
              <div className="mt-1.5 text-[11px] text-text-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
                <span>Protected by SSRF firewall: localhost, private subnets, and 169.254.169.254 are blocked.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production fulfillment queue"
                className="w-full bg-[#08090D] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-accent-violet transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Subscribed Events
              </label>
              <div className="space-y-2">
                {availableEvents.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(ev.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedEvents([...selectedEvents, ev.id]);
                        else setSelectedEvents(selectedEvents.filter((x) => x !== ev.id));
                      }}
                      className="rounded bg-[#08090D] border-white/20 text-accent-violet focus:ring-0"
                    />
                    <span>{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading || !url || selectedEvents.length === 0}
                className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {createLoading ? 'Validating...' : 'Register Webhook Endpoint'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
