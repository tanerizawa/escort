'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { RoseGlyph } from '@/components/brand/rose-glyph';

interface Testimonial {
  id: string;
  content: string;
  rating: number;
  isFeatured: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const res = await fetch(`${API_URL}/testimonials`);
      const json = await res.json();
      setTestimonials(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-rose-300/90 text-rose-300' : 'text-dark-700'
        }`}
      />
    ));

  return (
    <MarketingShell
      mark="Suara Tamu"
      title="Apa kata"
      highlight="klien kami"
      description="Pengalaman langsung dari klien yang telah menggunakan layanan pendamping profesional ARETON."
    >
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-60 animate-pulse border border-dark-700/30 bg-dark-800/30" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="border border-dark-700/30 bg-dark-800/30 px-6 py-24 text-center">
          <div className="mx-auto mb-6 text-rose-300/70">
            <RoseGlyph className="h-12 w-12" strokeWidth={1.1} />
          </div>
          <p className="font-display text-lg text-dark-200">Belum ada testimoni saat ini</p>
          <p className="mt-2 font-serif text-sm text-dark-500">
            Jadilah yang pertama berbagi pengalaman Anda.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className={`group relative overflow-hidden border p-8 transition-all duration-500 hover:border-rose-400/30 hover:bg-dark-800/60 ${
                t.isFeatured
                  ? 'border-rose-400/30 bg-rose-500/[0.04]'
                  : 'border-dark-700/30 bg-dark-800/30'
              }`}
            >
              {t.isFeatured && (
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 border border-rose-400/25 bg-dark-900/70 px-2 py-1 text-[10px] uppercase tracking-widest text-rose-200">
                  <Star className="h-3 w-3 fill-rose-300 text-rose-300" /> Featured
                </span>
              )}

              <div className="flex gap-1">{renderStars(t.rating)}</div>

              <p className="mt-6 font-serif text-[15px] italic leading-relaxed text-dark-200">
                &ldquo;{t.content}&rdquo;
              </p>

              <div className="gold-rose-line mt-6 w-12" />

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-rose-400/30 bg-rose-500/10 font-display text-sm text-rose-200">
                  {t.user?.firstName?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-display text-sm font-medium text-dark-100">
                    {t.user?.firstName || 'Anonim'}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-dark-500">
                    {new Date(t.createdAt).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-24 border-t border-dark-700/30 pt-20 text-center">
        <p className="act-mark">Berbagi Pengalaman</p>
        <h2 className="mt-5 font-display text-display-sm font-medium text-dark-100">
          Punya cerita dengan <span className="italic text-gradient-rose-gold">ARETON?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-serif text-lg leading-relaxed text-dark-300">
          Setelah sesi booking selesai, Anda dapat membagikan testimoni dari dashboard
          klien.
        </p>
      </section>
    </MarketingShell>
  );
}
