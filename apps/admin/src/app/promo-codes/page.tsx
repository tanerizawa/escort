'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';
import { Pause, Play } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
  });

  useEffect(() => {
    loadPromos();
  }, [filter]);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?active=${filter === 'active'}` : '';
      const res = await api.get(`/admin/promo-codes${params}`);
      const payload = res.data?.data || res.data;
      const list = payload?.data || payload || [];
      setPromos(Array.isArray(list) ? list : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.code || !form.validFrom || !form.validUntil) return;
    setSaving(true);
    setMessage('');
    try {
      if (editId) {
        await api.patch(`/admin/promo-codes/${editId}`, {
          isActive: true,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          validUntil: form.validUntil,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        });
        setMessage('Promo code berhasil diperbarui');
      } else {
        await api.post('/admin/promo-codes', {
          code: form.code,
          description: form.description,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
          validFrom: form.validFrom,
          validUntil: form.validUntil,
        });
        setMessage('Promo code berhasil dibuat');
      }
      resetForm();
      loadPromos();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(`/admin/promo-codes/${id}`, { isActive: !isActive });
      loadPromos();
    } catch {
      // ignore
    }
  };

  const deletePromo = async (id: string) => {
    if (!confirm('Hapus promo code ini?')) return;
    try {
      await api.delete(`/admin/promo-codes/${id}`);
      loadPromos();
    } catch {
      // ignore
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: '',
      maxDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Promo Codes</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola kode promo dan diskon</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-4 py-2 text-sm text-brand-400 hover:bg-brand-400/20"
        >
          + Buat Promo Baru
        </button>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('berhasil') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-dark-700 text-dark-100'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-dark-200">{editId ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Kode Promo</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="ARETON2024"
                disabled={!!editId}
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Deskripsi</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Diskon untuk pengguna baru"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Tipe Diskon</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">
                Nilai Diskon {form.discountType === 'PERCENTAGE' ? '(%)' : '(Rp)'}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Min. Order (Rp)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Maks. Diskon (Rp)</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Batas Penggunaan</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Berlaku Dari</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Berlaku Sampai</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-brand-400 px-6 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : editId ? 'Perbarui' : 'Buat Promo'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg border border-dark-600/30 px-6 py-2 text-sm text-dark-300 hover:text-dark-100"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Promo Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      ) : promos.length === 0 ? (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
          Belum ada promo code
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dark-700/50">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">Penggunaan</th>
                <th className="px-4 py-3">Berlaku</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {promos.map((promo) => {
                const isExpired = new Date(promo.validUntil) < new Date();
                return (
                  <tr key={promo.id} className="hover:bg-dark-800/30">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-brand-400">{promo.code}</span>
                      {promo.description && (
                        <p className="text-xs text-dark-500 mt-0.5">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-300">{promo.discountType}</td>
                    <td className="px-4 py-3 text-dark-300">
                      {promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}%`
                        : formatCurrency(promo.discountValue)}
                      {promo.maxDiscount && (
                        <span className="text-xs text-dark-500 block">
                          maks {formatCurrency(promo.maxDiscount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {promo.usageCount}
                      {promo.usageLimit && ` / ${promo.usageLimit}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-dark-400">
                      {new Date(promo.validFrom).toLocaleDateString('id-ID')} —{' '}
                      {new Date(promo.validUntil).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          isExpired
                            ? 'bg-dark-700/30 text-dark-500'
                            : promo.isActive
                            ? 'bg-emerald-400/10 text-emerald-400'
                            : 'bg-red-400/10 text-red-400'
                        }`}
                      >
                        {isExpired ? 'Expired' : promo.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleActive(promo.id, promo.isActive)}
                          className="rounded px-2 py-1 text-xs text-dark-300 hover:bg-dark-700/50"
                        >
                          {promo.isActive ? <><Pause className="h-3 w-3 inline-block" /> Nonaktifkan</> : <><Play className="h-3 w-3 inline-block" /> Aktifkan</>}
                        </button>
                        <button
                          onClick={() => deletePromo(promo.id)}
                          className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-400/10"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
