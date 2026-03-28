'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string | null;
  durationMins: number;
  isRequired: boolean;
  passingScore: number;
  order: number;
  createdAt: string;
}

const categoryColors: Record<string, string> = {
  ONBOARDING: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  ETIQUETTE: 'text-brand-400 bg-brand-400/10 border-brand-400/30',
  SAFETY: 'text-red-400 bg-red-400/10 border-red-400/30',
  COMMUNICATION: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  ADVANCED: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
};

export default function AdminTrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const emptyForm = {
    title: '',
    description: '',
    category: 'ONBOARDING',
    videoUrl: '',
    durationMins: 30,
    isRequired: false,
    passingScore: 70,
    order: 0,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modulesRes, statsRes] = await Promise.all([
        api.get('/training/modules'),
        api.get('/training/stats'),
      ]);
      const modPayload = modulesRes.data?.data || modulesRes.data;
      const list = modPayload?.data || modPayload || [];
      setModules(Array.isArray(list) ? list : []);
      setStats(statsRes.data?.data || statsRes.data);
    } catch (err) {
      console.error('Failed to load training data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/training/modules/${editId}`, form);
        setMessage('Module updated successfully');
      } else {
        await api.post('/training/modules', form);
        setMessage('Module created successfully');
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      loadData();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mod: TrainingModule) => {
    setForm({
      title: mod.title,
      description: mod.description,
      category: mod.category,
      videoUrl: mod.videoUrl || '',
      durationMins: mod.durationMins,
      isRequired: mod.isRequired,
      passingScore: mod.passingScore,
      order: mod.order,
    });
    setEditId(mod.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus modul ini?')) return;
    try {
      await api.delete(`/training/modules/${id}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete module', err);
    }
  };

  return (
    <AdminLayout>
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-dark-100">Training Center</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola modul pelatihan untuk escort</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }}
          className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-4 py-2 text-sm text-brand-400 hover:bg-brand-400/20"
        >
          + Tambah Modul
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
            <p className="text-xs text-dark-500">Total Modules</p>
            <p className="mt-1 text-2xl font-light text-dark-100">{stats.totalModules}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Required</p>
            <p className="mt-1 text-2xl font-light text-amber-400">{stats.requiredModules}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Active Learners</p>
            <p className="mt-1 text-2xl font-light text-sky-400">{stats.activeLearners}</p>
          </div>
          <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-4">
            <p className="text-xs text-dark-500">Avg Completion</p>
            <p className="mt-1 text-2xl font-light text-emerald-400">{stats.avgCompletionRate || 0}%</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-dark-700/50 bg-dark-800/50 p-6">
          <h3 className="mb-4 text-sm font-semibold text-dark-200">
            {editId ? 'Edit Module' : 'New Training Module'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Module Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ETIQUETTE">Etiquette</option>
              <option value="SAFETY">Safety</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="ADVANCED">Advanced</option>
            </select>
            <textarea className="col-span-2 rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" placeholder="Video URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Duration (mins)" value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: parseInt(e.target.value) || 0 })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Passing Score" value={form.passingScore} onChange={(e) => setForm({ ...form, passingScore: parseInt(e.target.value) || 0 })} />
            <input className="rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200" type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
            <label className="col-span-2 flex items-center gap-2">
              <input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} className="rounded border-dark-600" />
              <span className="text-sm text-dark-300">Required Module</span>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50">
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="rounded-lg border border-dark-600/30 px-4 py-2 text-sm text-dark-300 hover:text-dark-100">
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
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Pass Score</th>
                <th className="px-4 py-3">Required</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {modules.map((mod) => (
                <tr key={mod.id} className="hover:bg-dark-800/30">
                  <td className="px-4 py-3 text-sm text-dark-500">{mod.order}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-dark-100">{mod.title}</p>
                    <p className="text-xs text-dark-500 line-clamp-1">{mod.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColors[mod.category] || 'text-dark-400'}`}>
                      {mod.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-dark-300">{mod.durationMins} min</td>
                  <td className="px-4 py-3 text-sm text-dark-300">{mod.passingScore}%</td>
                  <td className="px-4 py-3">
                    {mod.isRequired ? (
                      <span className="text-xs text-amber-400">Required</span>
                    ) : (
                      <span className="text-xs text-dark-500">Optional</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(mod)} className="rounded px-2 py-1 text-xs text-brand-400 hover:bg-brand-400/10">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(mod.id)} className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-400/10">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {modules.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-dark-500">No training modules found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
