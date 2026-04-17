'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { MarketingShell } from '@/components/layout/marketing-shell';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  coverImage: string | null;
  viewCount: number;
  publishedAt: string;
  author: { firstName: string; lastName: string; profilePhoto: string | null };
}

interface CategoryCount {
  category: string;
  count: number;
}

const categoryLabels: Record<string, string> = {
  tips: 'Tips & Tricks',
  etiquette: 'Etika & Etiket',
  safety: 'Keamanan',
  lifestyle: 'Lifestyle',
  business: 'Bisnis & Acara',
  guide: 'Panduan',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (selectedCategory) params.set('category', selectedCategory);

      const res = await fetch(`${API_URL}/articles?${params}`);
      const json = await res.json();
      const payload = json.data || json;
      setArticles(payload.data || []);
      setTotalPages(payload.pagination?.totalPages || 1);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/articles/categories`);
      const json = await res.json();
      setCategories(json.data || json || []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, [loadArticles, loadCategories]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const chipClass = (active: boolean) =>
    `border px-4 py-2 text-[12px] uppercase tracking-widest-2 transition-all ${
      active
        ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
        : 'border-dark-700/40 bg-dark-800/30 text-dark-400 hover:border-rose-400/25 hover:text-rose-200'
    }`;

  return (
    <MarketingShell
      mark="Arsip & Esai"
      title="Blog &amp;"
      highlight="wawasan"
      description="Tips, panduan, dan catatan-catatan terkurasi seputar layanan pendampingan profesional."
    >
      {categories.length > 0 && (
        <div className="mb-12 flex flex-wrap gap-3">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setPage(1);
            }}
            className={chipClass(!selectedCategory)}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => {
                setSelectedCategory(cat.category);
                setPage(1);
              }}
              className={chipClass(selectedCategory === cat.category)}
            >
              {categoryLabels[cat.category] || cat.category} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse border border-dark-700/30 bg-dark-800/30" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="border border-dark-700/30 bg-dark-800/30 px-6 py-24 text-center">
          <p className="font-display text-lg text-dark-200">Belum ada artikel tersedia</p>
          <p className="mt-2 font-serif text-sm text-dark-500">
            Kami sedang menyiapkan esai-esai baru. Kembali lain waktu.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="group block overflow-hidden border border-dark-700/30 bg-dark-800/30 transition-all duration-500 hover:border-rose-400/25 hover:bg-dark-800/60"
            >
              {article.coverImage && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-dark-900/10 to-transparent" />
                  <span className="absolute left-4 top-4 border border-rose-400/30 bg-dark-900/80 px-2.5 py-1 text-[10px] uppercase tracking-widest-2 text-rose-200">
                    {categoryLabels[article.category] || article.category}
                  </span>
                </div>
              )}
              <div className="p-6">
                <p className="text-[10px] uppercase tracking-widest-2 text-dark-500">
                  {formatDate(article.publishedAt)}
                </p>
                <h3 className="mt-3 font-display text-lg font-medium text-dark-100 transition-colors group-hover:text-rose-200">
                  {article.title}
                </h3>
                <div className="gold-line-left mt-3 w-10 transition-all duration-500 group-hover:w-16" />
                <p className="mt-4 line-clamp-3 font-serif text-[14.5px] leading-relaxed text-dark-400">
                  {article.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-widest text-dark-500">
                  <span>Oleh {article.author?.firstName || 'Redaksi'}</span>
                  <span>{article.viewCount} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-16 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`h-10 w-10 border text-sm transition-all ${
                page === i + 1
                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-200'
                  : 'border-dark-700/40 bg-dark-800/30 text-dark-400 hover:border-rose-400/25 hover:text-rose-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </MarketingShell>
  );
}
