'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { MagazineLayout } from '@/components/layout/magazine-layout';

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

  useEffect(() => {
    loadArticle();
  }, [params?.slug]);

  const loadArticle = async () => {
    try {
      const res = await fetch(`${API_URL}/articles/slug/${params?.slug}`);
      if (!res.ok) { router.push('/blog'); return; }
      const json = await res.json();
      setArticle(json.data || json);
    } catch {
      router.push('/blog');
    } finally {
      setLoading(false);
    }
  };

  // Convert markdown content to HTML
  useEffect(() => {
    if (!article?.content) { setRenderedContent(''); return; }
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
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400/30 border-t-brand-400" />
      </div>
    );
  }

  if (!article) return null;

  return (
    <MagazineLayout breadcrumb="Blog">
      {/* Back navigation */}
      <div className="border-b border-dark-700/50 bg-dark-800/50 px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="text-sm text-dark-400 transition-colors hover:text-brand-400">
            ← Kembali ke Blog
          </Link>
        </div>
      </div>

      {/* Article */}
      <article className="mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <Badge variant="default" size="sm">
              {categoryLabels[article.category] || article.category}
            </Badge>
            <span className="text-sm text-dark-500">{formatDate(article.publishedAt || article.createdAt)}</span>
          </div>
          <h1 className="mb-6 text-3xl font-light leading-tight text-dark-100 md:text-4xl">
            {article.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-400/10 text-brand-400">
              {article.author?.profilePhoto ? (
                <img src={article.author.profilePhoto} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-medium">{article.author?.firstName?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-dark-200">
                {article.author?.firstName || 'Admin'} {article.author?.lastName || ''}
              </p>
              <p className="text-xs text-dark-500">{article.viewCount} views</p>
            </div>
          </div>
        </header>

        {/* Cover image */}
        {article.coverImage && (
          <div className="mb-10 overflow-hidden rounded-xl">
            <img src={article.coverImage} alt={article.title} className="w-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert max-w-none prose-headings:text-dark-100 prose-headings:font-display prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:text-dark-300 prose-p:leading-relaxed prose-a:text-brand-400 prose-strong:text-dark-200 prose-ul:text-dark-300 prose-ol:text-dark-300 prose-li:text-dark-300 prose-li:marker:text-brand-400/60 prose-table:border-dark-700/30 prose-th:border-dark-700/30 prose-th:bg-dark-800/50 prose-th:text-dark-200 prose-th:px-4 prose-th:py-2 prose-td:border-dark-700/30 prose-td:px-4 prose-td:py-2 prose-td:text-dark-400 prose-hr:border-dark-700/30"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="mt-10 border-t border-dark-700/50 pt-6">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-dark-700/50 px-3 py-1 text-xs text-dark-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share / CTA */}
        <div className="mt-10 rounded-xl border border-brand-400/20 bg-brand-400/5 p-6 text-center">
          <h3 className="mb-2 text-lg font-medium text-dark-100">Tertarik menggunakan layanan ARETON.id?</h3>
          <p className="mb-4 text-sm text-dark-400">Temukan pendamping profesional terverifikasi untuk acara Anda</p>
          <Link
            href="/escorts"
            className="inline-block rounded-lg bg-brand-400 px-6 py-2.5 text-sm font-medium text-dark-900 transition-colors hover:bg-brand-300"
          >
            Jelajahi Partner
          </Link>
        </div>
      </article>
    </MagazineLayout>
  );
}
