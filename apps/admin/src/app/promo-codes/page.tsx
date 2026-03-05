'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

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
      setPromos(res.data.data || []);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Buat Promo Baru
        </button>
      </div>

      {message && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : 'Nonaktif'}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editId ? 'Edit Promo' : 'Buat Promo Baru'}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Promo</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="ARETON2024"
                disabled={!!editId}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Diskon untuk pengguna baru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Diskon</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Persentase (%)</option>
                <option value="FIXED">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai Diskon {form.discountType === 'PERCENTAGE' ? '(%)' : '(Rp)'}
              </label>
              <input
                type="number"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Order (Rp)</label>
              <input
                type="number"
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maks. Diskon (Rp)</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Opsional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batas Penggunaan</label>
              <input
                type="number"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Dari</label>
              <input
                type="date"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Sampai</label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : editId ? 'Perbarui' : 'Buat Promo'}
            </button>
            <button
              onClick={resetForm}
              className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Promo Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : promos.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          Belum ada promo code
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">Penggunaan</th>
                <th className="px-4 py-3">Berlaku</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promos.map((promo) => {
                const isExpired = new Date(promo.validUntil) < new Date();
                return (
                  <tr key={promo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600">{promo.code}</span>
                      {promo.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{promo.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">{promo.discountType}</td>
                    <td className="px-4 py-3">
                      {promo.discountType === 'PERCENTAGE'
                        ? `${promo.discountValue}%`
                        : formatCurrency(promo.discountValue)}
                      {promo.maxDiscount && (
                        <span className="text-xs text-gray-400 block">
                          maks {formatCurrency(promo.maxDiscount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {promo.usageCount}
                      {promo.usageLimit && ` / ${promo.usageLimit}`}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(promo.validFrom).toLocaleDateString('id-ID')} —{' '}
                      {new Date(promo.validUntil).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          isExpired
                            ? 'bg-gray-100 text-gray-500'
                            : promo.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isExpired ? 'Expired' : promo.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleActive(promo.id, promo.isActive)}
                          className="rounded px-2 py-1 text-xs hover:bg-gray-100"
                        >
                          {promo.isActive ? '⏸ Nonaktifkan' : '▶ Aktifkan'}
                        </button>
                        <button
                          onClick={() => deletePromo(promo.id)}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          🗑 Hapus
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
  );
}
