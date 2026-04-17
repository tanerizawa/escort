'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { RoseGlyph } from '@/components/brand/rose-glyph';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  viewCount: number;
  publishedAt: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    profilePhoto: string | null;
    role: string;
  };
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

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [renderedContent, setRenderedContent] = useState('');

  const loadArticle = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/articles/slug/${params?.slug}`);
      if (!res.ok) {
        router.push('/blog');
        return;
      }
      const json = await res.json();
      setArticle(json.data || json);
    } catch {
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  }, [params?.slug, router]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    if (!article?.content) {
      setRenderedContent('');
      return;
    }
    const content = article.content;
    const hasHtmlTags = /<(p|div|h[1-6]|ul|ol|table|br|img|a)\b/i.test(content);

    if (hasHtmlTags) {
      setRenderedContent(content);
    } else {
      import('marked').then(({ marked }) => {
        const result = marked.parse(content);
        if (typeof result === 'string') {
          setRenderedContent(result);
        } else {
          (result as Promise<string>).then(setRenderedContent);
        }
      });
    }
  }, [article?.content]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-400/30 border-t-rose-300" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="relative min-h-screen bg-dark-900 text-dark-100">
      <div
        className="pointer-events-none fixed inset-0 -z-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 20% -10%, rgba(176,74,85,0.08), transparent 55%), radial-gradient(ellipse at 110% 40%, rgba(201,169,110,0.06), transparent 55%)',
        }}
      />
      <Navbar />

      <main className="relative z-10 pt-24">
        {/* Article header */}
        <section className="relative overflow-hidden border-b border-dark-700/30">
          <div className="pointer-events-none absolute inset-0 velvet-stage opacity-70" />
          <RoseGlyph className="rose-watermark h-[24rem] w-[24rem] -right-16 -top-16" />
          <div className="relative mx-auto max-w-3xl px-6 pb-14 pt-16 lg:px-10 lg:pb-16">
            <Link
              href="/blog"
              className="text-[11px] uppercase tracking-widest-2 text-dark-400 transition-colors hover:text-rose-200"
            >
              ← Kembali ke Blog
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-[10px] uppercase tracking-widest-2 text-rose-200">
                {categoryLabels[article.category] || article.category}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-dark-500">
                {formatDate(article.publishedAt || article.createdAt)}
              </span>
            </div>
            <h1 className="mt-6 font-display text-3xl font-medium leading-tight text-dark-100 sm:text-4xl lg:text-display-md">
              {article.title}
            </h1>
            <div className="gold-rose-line mt-8 w-24" />

            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center border border-rose-400/30 bg-rose-500/10 font-display text-sm text-rose-200">
                {article.author?.profilePhoto ? (
                  <img
                    src={article.author.profilePhoto}
                    alt=""
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  (article.author?.firstName?.charAt(0) || 'A')
                )}
              </div>
              <div>
                <p className="font-display text-sm font-medium text-dark-100">
                  {article.author?.firstName || 'Redaksi'}{' '}
                  {article.author?.lastName || ''}
                </p>
                <p className="text-[11px] uppercase tracking-widest text-dark-500">
                  {article.viewCount} views
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <article className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-20">
          {article.coverImage && (
            <div className="mb-12 overflow-hidden border border-dark-700/30">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-invert max-w-none
              prose-headings:text-dark-100 prose-headings:font-display prose-headings:font-medium
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
              prose-p:font-serif prose-p:text-dark-300 prose-p:leading-relaxed
              prose-a:text-rose-200 prose-a:no-underline hover:prose-a:text-rose-100
              prose-strong:text-dark-100
              prose-ul:font-serif prose-ol:font-serif prose-ul:text-dark-300 prose-ol:text-dark-300
              prose-li:marker:text-rose-400/60
              prose-blockquote:border-l-rose-400/40 prose-blockquote:text-dark-200 prose-blockquote:italic
              prose-table:border-dark-700/30
              prose-th:border-dark-700/30 prose-th:bg-dark-800/50 prose-th:text-rose-200/90 prose-th:px-4 prose-th:py-2
              prose-td:border-dark-700/30 prose-td:px-4 prose-td:py-2 prose-td:text-dark-400
              prose-hr:border-dark-700/30"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {article.tags?.length > 0 && (
            <div className="mt-12 border-t border-dark-700/30 pt-8">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-dark-700/40 bg-dark-800/40 px-3 py-1 text-[11px] uppercase tracking-widest text-dark-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* End CTA */}
          <div className="mt-16 border border-rose-400/25 bg-rose-500/5 p-8 text-center">
            <div className="mx-auto mb-5 text-rose-300/80">
              <RoseGlyph className="mx-auto h-10 w-10" strokeWidth={1.1} />
            </div>
            <p className="act-mark">Undangan</p>
            <h3 className="mt-3 font-display text-xl font-medium text-dark-100">
              Tertarik menggunakan layanan{' '}
              <span className="italic text-gradient-rose-gold">ARETON?</span>
            </h3>
            <p className="mx-auto mt-3 max-w-md font-serif text-sm text-dark-400">
              Temukan pendamping profesional terverifikasi untuk setiap acara Anda.
            </p>
            <Link
              href="/escorts"
              className="mt-6 inline-block rounded-none bg-brand-400 px-6 py-3 text-[11px] font-bold uppercase tracking-widest-2 text-dark-900 transition-colors hover:bg-brand-300"
            >
              Jelajahi Companion
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
