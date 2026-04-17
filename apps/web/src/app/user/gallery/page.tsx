'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

type EscortItem = {
  id: string;
  hourlyRate?: number;
  tier?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
  };
};

type ArticleItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string | null;
  category?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function fullName(escort: EscortItem) {
  const first = escort.user?.firstName || '';
  const last = escort.user?.lastName || '';
  return `${first} ${last}`.trim() || 'Companion';
}

function toEscortList(payload: any): EscortItem[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function toArticleList(payload: any): ArticleItem[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

export default function UserGalleryPage() {
  const [loading, setLoading] = useState(true);
  const [escorts, setEscorts] = useState<EscortItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadGallery = async () => {
      setLoading(true);
      try {
        const [escortRes, articleRes] = await Promise.all([
          api.get('/escorts', { params: { limit: 12, sortBy: 'newest' } }),
          fetch(`${API_URL}/articles?limit=9&page=1`),
        ]);

        if (cancelled) return;

        const escortPayload = escortRes.data?.data || escortRes.data;
        setEscorts(toEscortList(escortPayload));

        if (articleRes.ok) {
          const articleJson = await articleRes.json();
          setArticles(toArticleList(articleJson?.data || articleJson));
        } else {
          setArticles([]);
        }
      } catch {
        if (!cancelled) {
          setEscorts([]);
          setArticles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, []);

  const spotlight = useMemo(() => escorts.slice(0, 6), [escorts]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dark-700/50 bg-[radial-gradient(circle_at_top_left,rgba(201,169,110,0.18),transparent_45%),linear-gradient(135deg,rgba(12,16,24,0.95),rgba(9,12,20,0.96))] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-brand-300/70">Creator Gallery</p>
        <h1 className="mt-2 text-2xl font-light text-dark-100">Visual Discovery Feed</h1>
        <p className="mt-2 max-w-2xl text-sm text-dark-400">
          Jelajahi profil visual companion dan konten terbaru dalam format galeri untuk discovery yang lebih ringan.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/user/discover" className="rounded-lg border border-brand-400/35 bg-brand-400/10 px-4 py-2 text-xs uppercase tracking-widest text-brand-300 hover:bg-brand-400/20">
            Kembali ke Discover
          </Link>
          <Link href="/user/contest" className="rounded-lg border border-dark-600/60 px-4 py-2 text-xs uppercase tracking-widest text-dark-300 hover:border-dark-500/70">
            Contest Beta
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="h-64 animate-pulse rounded-xl border border-dark-700/40 bg-dark-800/40" />
          ))}
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg text-dark-100">Companion Spotlight</h2>
            {spotlight.length === 0 ? (
              <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-5 text-sm text-dark-500">Belum ada spotlight companion.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {spotlight.map((escort) => (
                  <Link key={escort.id} href={`/user/escorts/${escort.id}`} className="group overflow-hidden rounded-xl border border-dark-700/50 bg-dark-800/40 transition-colors hover:border-brand-400/30">
                    <div className="relative aspect-[4/5] overflow-hidden bg-dark-700">
                      {escort.user?.profilePhoto ? (
                        <img src={escort.user.profilePhoto} alt={fullName(escort)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl text-dark-500">{fullName(escort).charAt(0)}</div>
                      )}
                      <span className="absolute left-2 top-2 rounded-full border border-brand-400/35 bg-brand-400/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-100">
                        {escort.tier || 'SILVER'}
                      </span>
                    </div>
                    <div className="space-y-1.5 p-3">
                      <p className="text-sm text-dark-100">{fullName(escort)}</p>
                      <p className="text-xs text-dark-500">{formatCurrency(escort.hourlyRate || 0)} / jam</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-dark-100">Creator Snippets</h2>
              <Link href="/blog" className="text-xs uppercase tracking-widest text-brand-300 hover:text-brand-200">
                Lihat Semua Artikel
              </Link>
            </div>

            {articles.length === 0 ? (
              <div className="rounded-xl border border-dark-700/40 bg-dark-800/40 p-5 text-sm text-dark-500">Belum ada konten artikel terbaru.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="group overflow-hidden rounded-xl border border-dark-700/50 bg-dark-800/40 transition-colors hover:border-brand-400/30">
                    <div className="aspect-[16/10] overflow-hidden bg-dark-700">
                      {article.coverImage ? (
                        <img src={article.coverImage} alt={article.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-dark-500">No Cover</div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <p className="line-clamp-2 text-sm text-dark-100">{article.title}</p>
                      <p className="line-clamp-2 text-xs leading-relaxed text-dark-500">{article.excerpt || 'Buka artikel untuk melihat konten selengkapnya.'}</p>
                      <p className="text-[11px] text-dark-500">{article.category || 'general'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
