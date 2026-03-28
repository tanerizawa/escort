'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface Subscription {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string | null;
  plan: string;
  maxUsers: number;
  monthlyBudget: number;
  usedBudget: number;
  discountPercent: number;
  status: string;
  startDate: string;
  endDate: string;
  members: any[];
}

const planColors: Record<string, string> = {
  BASIC: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  PROFESSIONAL: 'text-brand-400 bg-brand-400/10 border-brand-400/30',
  ENTERPRISE: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'text-emerald-400 bg-emerald-400/10',
  SUSPENDED: 'text-amber-400 bg-amber-400/10',
  EXPIRED: 'text-red-400 bg-red-400/10',
};

export default function AdminCorporatePage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    plan: 'BASIC',
    maxUsers: 5,
    monthlyBudget: 10000000,
    discountPercent: 0,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, statsRes] = await Promise.all([
        api.get('/corporate'),
        api.get('/corporate/stats'),
      ]);
      const subPayload = subsRes.data?.data || subsRes.data;
      const list = subPayload?.data || subPayload || [];
      setSubscriptions(Array.isArray(list) ? list : []);
      setStats(statsRes.data?.data || statsRes.data);
    } catch (err) {
      console.error('Failed to load corporate data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/corporate', form);
      setMessage('Subscription created successfully');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to create subscription');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/corporate/${id}`, { status });
      loadData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  return (
    <AdminLayout>
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Corporate Subscriptions</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola langganan korporat dan anggota tim</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-4 py-2 text-sm text-brand-400 hover:bg-brand-400/20"
        >
          + Tambah Subscription
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Total Subscriptions</p>
            <p className="mt-1 text-2xl font-light text-dark-100">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Active</p>
            <p className="mt-1 text-2xl font-light text-emerald-400">{stats.active}</p>
          </div>
          {Object.entries(stats.byPlan || {}).map(([plan, count]) => (
            <div key={plan} className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
              <p className="text-xs text-dark-500">{plan}</p>
              <p className="mt-1 text-2xl font-light text-dark-100">{count as number}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-dark-700/50 bg-dark-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-dark-200">New Corporate Subscription</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Contact Email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <select className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="BASIC">Basic</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Max Users" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 1 })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Monthly Budget (Rp)" value={form.monthlyBudget} onChange={(e) => setForm({ ...form, monthlyBudget: parseInt(e.target.value) || 0 })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Discount %" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-dark-600/30 px-4 py-2 text-sm text-dark-300 hover:text-dark-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" /></div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-dark-700/50">
          <table className="w-full">
            <thead className="bg-dark-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-dark-800/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-dark-100">{sub.companyName}</p>
                    <p className="text-xs text-dark-500">{sub.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${planColors[sub.plan] || 'text-dark-400'}`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">{(sub.members?.length ?? 0)}/{sub.maxUsers}</td>
                  <td className="px-4 py-3 text-sm text-dark-300">
                    Rp {Number(sub.usedBudget).toLocaleString()} / {Number(sub.monthlyBudget).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[sub.status] || 'text-dark-400'}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-400">{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {sub.status === 'ACTIVE' && (
                        <button onClick={() => handleStatusChange(sub.id, 'SUSPENDED')} className="rounded px-2 py-1 text-xs text-amber-400 hover:bg-amber-400/10">
                          Suspend
                        </button>
                      )}
                      {sub.status === 'SUSPENDED' && (
                        <button onClick={() => handleStatusChange(sub.id, 'ACTIVE')} className="rounded px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10">
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-500">No subscriptions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
