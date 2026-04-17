import type { ReactNode } from 'react';
import { RoseGlyph } from '@/components/brand/rose-glyph';

interface MarketingPageHeaderProps {
  /** Small uppercase kicker shown above the title. Follows the "Babak X · ..." pattern. */
  mark?: string;
  /** Display-weight title. */
  title: string;
  /** Optional italic rose-gold highlight that flows inline after the title. */
  highlight?: string;
  /** Serif deck / description shown under the title. */
  description?: string;
  /** Optional action slot rendered on the right of the title block (CTA button, etc.). */
  actions?: ReactNode;
  /** Toggle the decorative rose glyph centred above the mark. Default: true. */
  showGlyph?: boolean;
  /** Content alignment. Default: "center". */
  align?: 'center' | 'start';
}

/**
 * Editorial masthead shared by every marketing sub-page.
 *
 * The same visual grammar as the home hero: a rose monogram, an
 * `act-mark` kicker between gold–rose hairlines, a Playfair display
 * title, an optional italic rose-gold highlight, and a Cormorant serif
 * deck. Kept intentionally narrow so static pages read like chapters
 * of the same editorial volume.
 */
export function MarketingPageHeader({
  mark,
  title,
  highlight,
  description,
  actions,
  showGlyph = true,
  align = 'center',
}: MarketingPageHeaderProps) {
  const isCenter = align === 'center';

  return (
    <section
      className={`relative overflow-hidden border-b border-dark-700/30 ${
        isCenter ? 'text-center' : 'text-left'
      }`}
    >
      {/* Velvet / claret wash */}
      <div className="pointer-events-none absolute inset-0 velvet-stage opacity-70" />
      <RoseGlyph className="rose-watermark h-[28rem] w-[28rem] -right-16 -top-24" />

      <div
        className={`relative mx-auto max-w-4xl px-6 pb-16 pt-28 lg:px-10 lg:pb-20 lg:pt-36 ${
          isCenter ? '' : 'max-w-5xl'
        }`}
      >
        {showGlyph && (
          <div
            className={`mb-6 flex ${
              isCenter ? 'justify-center' : 'justify-start'
            } text-rose-300/80`}
          >
            <RoseGlyph className="h-12 w-12" strokeWidth={1.1} />
          </div>
        )}

        {mark && (
          <div
            className={`mb-6 flex items-center gap-4 ${
              isCenter ? 'justify-center' : ''
            }`}
          >
            <span className="gold-rose-line w-10" />
            <p className="act-mark">{mark}</p>
            <span className="gold-rose-line w-10" />
          </div>
        )}

        <h1 className="font-display text-4xl font-medium leading-[1.08] tracking-tight text-dark-100 sm:text-5xl lg:text-display-lg">
          {title}
          {highlight && (
            <>
              {' '}
              <span className="italic text-gradient-rose-gold">{highlight}</span>
            </>
          )}
        </h1>

        {description && (
          <p
            className={`mt-6 font-serif text-lg leading-relaxed text-dark-300 sm:text-xl ${
              isCenter ? 'mx-auto max-w-2xl' : 'max-w-2xl'
            }`}
          >
            {description}
          </p>
        )}

        {actions && (
          <div
            className={`mt-10 flex flex-wrap items-center gap-4 ${
              isCenter ? 'justify-center' : ''
            }`}
          >
            {actions}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <span className="gold-rose-line w-24" />
        </div>
      </div>
    </section>
  );
}
