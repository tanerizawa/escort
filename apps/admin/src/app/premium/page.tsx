'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface PremiumListing {
  id: string;
  escortId: string;
  type: string;
  startDate: string;
  endDate: string;
  amount: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
  escort?: {
    id: string;
    user?: { fullName: string; email: string };
  };
}

const typeColors: Record<string, string> = {
  FEATURED: 'text-brand-400 bg-brand-400/10 border-brand-400/30',
  SPOTLIGHT: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  TOP_PICK: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
};

export default function AdminPremiumPage() {
  const [listings, setListings] = useState<PremiumListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    escortId: '',
    type: 'FEATURED',
    startDate: '',
    endDate: '',
    amount: 500000,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/premium'),
        api.get('/premium/stats'),
      ]);
      const listPayload = listRes.data?.data || listRes.data;
      const list = listPayload?.data || listPayload || [];
      setListings(Array.isArray(list) ? list : []);
      setStats(statsRes.data?.data || statsRes.data);
    } catch (err) {
      console.error('Failed to load premium data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post('/premium', form);
      setMessage('Listing created successfully');
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to create listing');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.patch(`/premium/${id}/deactivate`);
      loadData();
    } catch (err) {
      console.error('Failed to deactivate listing', err);
    }
  };

  const getCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0.00';
    return ((clicks / impressions) * 100).toFixed(2);
  };

  return (
    <AdminLayout>
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Premium Listings</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola listing premium dan boosted untuk escort</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-4 py-2 text-sm text-brand-400 hover:bg-brand-400/20"
        >
          + Tambah Listing
        </button>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-5 gap-4">
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Total Listings</p>
            <p className="mt-1 text-2xl font-light text-dark-100">{stats.totalListings}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Active</p>
            <p className="mt-1 text-2xl font-light text-emerald-400">{stats.activeListings}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Total Revenue</p>
            <p className="mt-1 text-2xl font-light text-brand-400">Rp {Number(stats.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Total Impressions</p>
            <p className="mt-1 text-2xl font-light text-sky-400">{stats.totalImpressions || 0}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Avg CTR</p>
            <p className="mt-1 text-2xl font-light text-violet-400">{stats.avgCTR || 0}%</p>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-dark-700/50 bg-dark-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-dark-200">New Premium Listing</h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Escort ID" value={form.escortId} onChange={(e) => setForm({ ...form, escortId: e.target.value })} />
            <select className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="FEATURED">Featured</option>
              <option value="SPOTLIGHT">Spotlight</option>
              <option value="TOP_PICK">Top Pick</option>
            </select>
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="date" placeholder="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="date" placeholder="End Date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Amount (Rp)" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Listing'}
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
                <th className="px-4 py-3">Escort</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-dark-800/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-dark-100">{listing.escort?.user?.fullName || listing.escortId.slice(0, 8)}</p>
                    <p className="text-xs text-dark-500">{listing.escort?.user?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeColors[listing.type] || 'text-dark-400'}`}>
                      {listing.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-dark-400">
                    {new Date(listing.startDate).toLocaleDateString()} - {new Date(listing.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">Rp {Number(listing.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-dark-300">{listing.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-dark-300">{listing.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-dark-300">{getCTR(listing.impressions, listing.clicks)}%</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${listing.isActive ? 'text-emerald-400 bg-emerald-400/10' : 'text-dark-500 bg-dark-700/30'}`}>
                      {listing.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {listing.isActive && (
                      <button onClick={() => handleDeactivate(listing.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-400/10">
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {listings.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-dark-500">No premium listings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
