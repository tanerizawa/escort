'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { MagazineLayout } from '@/components/layout/magazine-layout';

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
      <span key={i} className={i < rating ? 'text-brand-400' : 'text-dark-600'}><Star className="h-4 w-4" /></span>
    ));

  return (
    <MagazineLayout breadcrumb="Testimoni">
      {/* Hero */}
      <section className="border-b border-dark-700/50 bg-dark-800/50 px-4 py-16 text-center">
        <h1 className="mb-3 text-3xl font-light text-dark-100 md:text-4xl">
          Apa Kata <span className="text-brand-400">Klien Kami</span>
        </h1>
        <p className="mx-auto max-w-xl text-dark-400">
          Pengalaman langsung dari klien yang telah menggunakan layanan pendamping profesional ARETON.id
        </p>
      </section>

      {/* Testimonials grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-dark-800/50" />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-dark-500">Belum ada testimoni saat ini</p>
            <p className="mt-2 text-sm text-dark-600">Jadilah yang pertama berbagi pengalaman Anda</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.id} className={`relative overflow-hidden ${t.isFeatured ? 'border-brand-400/30 ring-1 ring-brand-400/10' : ''}`}>
                <CardContent className="p-6">
                  {t.isFeatured && (
                    <div className="absolute right-3 top-3 rounded-full bg-brand-400/10 px-2 py-0.5 text-xs text-brand-400">
                      <Star className="h-4 w-4 inline-block" /> Featured
                    </div>
                  )}
                  <div className="mb-3 flex text-lg">{renderStars(t.rating)}</div>
                  <p className="mb-4 text-sm leading-relaxed text-dark-300">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3 border-t border-dark-700/50 pt-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400/10 text-xs font-medium text-brand-400">
                      {t.user?.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">{t.user?.firstName || 'Anonim'}</p>
                      <p className="text-xs text-dark-500">
                        {new Date(t.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-dark-700/50 bg-dark-800/30 px-4 py-12 text-center">
        <h2 className="mb-3 text-xl font-light text-dark-100">Punya Pengalaman dengan ARETON.id?</h2>
        <p className="mb-6 text-dark-400 text-sm">
          Setelah menyelesaikan booking, Anda dapat membagikan testimoni Anda
        </p>
      </section>
    </MagazineLayout>
  );
}
