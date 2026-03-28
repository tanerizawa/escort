'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import AdminLayout from '@/components/admin-layout';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { firstName: string; lastName: string; role: string };
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'tips',
    tags: '',
    coverImage: '',
  });

  useEffect(() => {
    loadArticles();
  }, [filter, page]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter !== 'all') params.set('status', filter);
      const res = await api.get(`/articles/admin/all?${params}`);
      const payload = res.data?.data || res.data;
      const list = payload?.data || payload || [];
      setArticles(Array.isArray(list) ? list : []);
      const pag = payload?.pagination;
      if (pag) setTotalPages(pag.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    setMessage('');
    try {
      const body: any = {
        title: form.title,
        content: form.content,
        excerpt: form.excerpt || undefined,
        category: form.category,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        coverImage: form.coverImage || undefined,
      };

      if (editId) {
        await api.patch(`/articles/${editId}`, body);
        setMessage('Artikel berhasil diperbarui');
      } else {
        await api.post('/articles', body);
        setMessage('Artikel berhasil dibuat');
      }
      resetForm();
      loadArticles();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal menyimpan artikel');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      await api.patch(`/articles/${id}`, { status });
      loadArticles();
    } catch {
      // ignore
    }
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Hapus artikel ini?')) return;
    try {
      await api.delete(`/articles/${id}`);
      loadArticles();
    } catch {
      // ignore
    }
  };

  const editArticle = (article: Article) => {
    setEditId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      category: article.category,
      tags: article.tags?.join(', ') || '',
      coverImage: article.coverImage || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', content: '', excerpt: '', category: 'tips', tags: '', coverImage: '' });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-emerald-400/10 text-emerald-400';
      case 'DRAFT': return 'bg-amber-400/10 text-amber-400';
      case 'ARCHIVED': return 'bg-dark-700/30 text-dark-500';
      default: return 'bg-dark-700/30 text-dark-400';
    }
  };

  return (
    <AdminLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light tracking-wide text-dark-100">Artikel & Blog</h1>
          <p className="mt-1 text-sm text-dark-400">Kelola artikel dan konten blog</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-lg bg-brand-400/10 border border-brand-400/30 px-4 py-2 text-sm text-brand-400 hover:bg-brand-400/20"
        >
          + Tulis Artikel Baru
        </button>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${message.includes('berhasil') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 rounded-lg bg-dark-800/50 p-1">
        {([
          { key: 'all', label: 'Semua' },
          { key: 'DRAFT', label: 'Draft' },
          { key: 'PUBLISHED', label: 'Published' },
          { key: 'ARCHIVED', label: 'Archived' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-dark-700 text-dark-100'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-lg border border-dark-700/50 bg-dark-800/50 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-dark-200">{editId ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Judul</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Judul artikel..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                >
                  <option value="tips">Tips</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="guide">Guide</option>
                  <option value="news">News</option>
                  <option value="etiquette">Etiquette</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Tags (pisah koma)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                  placeholder="tips, lifestyle, ..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Excerpt</label>
              <input
                type="text"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Ringkasan singkat artikel..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-dark-400 mb-1">Konten</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                className="w-full rounded-lg border border-dark-600/30 bg-dark-800 px-3 py-2 text-sm text-dark-200"
                placeholder="Tulis konten artikel..."
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-brand-400 px-6 py-2 text-sm font-medium text-dark-900 hover:bg-brand-300 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : editId ? 'Perbarui' : 'Simpan Artikel'}
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

      {/* Articles Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-600 border-t-brand-400" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-dark-700/30 bg-dark-800/20 p-10 text-center text-dark-400">
          Belum ada artikel
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dark-700/50">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-dark-500">
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Penulis</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/30">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-dark-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark-200 line-clamp-1">{article.title}</p>
                    <p className="text-xs text-dark-500 mt-0.5 line-clamp-1">{article.excerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-dark-300 text-xs">
                    {article.author?.firstName} {article.author?.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-400/10 px-2 py-0.5 text-xs text-brand-400">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-400">{article.viewCount}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(article.status)}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-dark-400">
                    {new Date(article.updatedAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => editArticle(article)}
                        className="rounded px-2 py-1 text-xs text-dark-300 hover:bg-dark-700/50"
                      >
                        Edit
                      </button>
                      {article.status === 'DRAFT' && (
                        <button
                          onClick={() => updateStatus(article.id, 'PUBLISHED')}
                          className="rounded px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10"
                        >
                          Publish
                        </button>
                      )}
                      {article.status === 'PUBLISHED' && (
                        <button
                          onClick={() => updateStatus(article.id, 'ARCHIVED')}
                          className="rounded px-2 py-1 text-xs text-amber-400 hover:bg-amber-400/10"
                        >
                          Archive
                        </button>
                      )}
                      {article.status === 'ARCHIVED' && (
                        <button
                          onClick={() => updateStatus(article.id, 'PUBLISHED')}
                          className="rounded px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-400/10"
                        >
                          Re-publish
                        </button>
                      )}
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-400/10"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-sm text-dark-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-dark-600/30 px-3 py-1.5 text-sm text-dark-300 hover:text-dark-100 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
