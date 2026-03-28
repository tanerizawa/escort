'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MagazineLayout } from '@/components/layout/magazine-layout';

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

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, [selectedCategory, page]);

  const loadArticles = async () => {
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
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/articles/categories`);
      const json = await res.json();
      setCategories(json.data || json || []);
    } catch {
      setCategories([]);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  return (
    <MagazineLayout breadcrumb="Blog">
      {/* Hero */}
      <section className="border-b border-dark-700/50 bg-gradient-to-b from-dark-800 to-dark-900 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-light tracking-tight text-dark-100">
            Blog & <span className="text-brand-400">Insights</span>
          </h1>
          <p className="text-lg text-dark-400">
            Tips, panduan, dan wawasan seputar layanan pendamping profesional
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory(null); setPage(1); }}
              className={`rounded-full px-4 py-2 text-sm transition-all ${
                !selectedCategory
                  ? 'bg-brand-400 text-dark-900 font-medium'
                  : 'bg-dark-700/50 text-dark-400 hover:bg-dark-700'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => { setSelectedCategory(cat.category); setPage(1); }}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  selectedCategory === cat.category
                    ? 'bg-brand-400 text-dark-900 font-medium'
                    : 'bg-dark-700/50 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {categoryLabels[cat.category] || cat.category} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-xl bg-dark-700/30" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-dark-500">Belum ada artikel tersedia</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/blog/${article.slug}`}>
                <Card className="group h-full cursor-pointer border-dark-700/30 bg-dark-800/50 transition-all hover:border-brand-400/30 hover:bg-dark-800">
                  {article.coverImage && (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge variant="default" size="sm">
                        {categoryLabels[article.category] || article.category}
                      </Badge>
                      <span className="text-xs text-dark-500">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-dark-100 transition-colors group-hover:text-brand-400">
                      {article.title}
                    </h3>
                    <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-dark-400">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-dark-500">
                      <span>Oleh {article.author?.firstName || 'Admin'}</span>
                      <span>{article.viewCount} views</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-10 w-10 rounded-lg text-sm transition-all ${
                  page === i + 1
                    ? 'bg-brand-400 text-dark-900 font-medium'
                    : 'bg-dark-700/50 text-dark-400 hover:bg-dark-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </MagazineLayout>
  );
}
