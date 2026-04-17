import type { ReactNode } from 'react';
import { RoseGlyph } from '@/components/brand/rose-glyph';

interface PanelHeaderProps {
  /** Small uppercase editorial mark above the title (e.g. "Ruang Klien"). */
  mark?: string;
  title: string;
  /** Optional italic phrase that runs alongside the title. */
  highlight?: string;
  description?: string;
  /** Slot for action buttons / badges on the right. */
  actions?: ReactNode;
}

/**
 * Editorial header used throughout the client & escort panels.
 *
 * Layout mirrors the marketing site: a rose-gold hairline under an
 * `act-mark` kicker, a display-weight title (with an optional italic
 * highlight), and a serif description. Actions slot right-aligns on
 * wide viewports and wraps underneath on mobile.
 */
export function PanelHeader({
  mark,
  title,
  highlight,
  description,
  actions,
}: PanelHeaderProps) {
  return (
    <header className="relative -mx-6 -mt-6 mb-8 overflow-hidden border-b border-dark-700/30 bg-dark-900/30 px-6 py-8 lg:-mx-8 lg:-mt-8 lg:mb-10 lg:px-10 lg:py-10">
      {/* Soft rose watermark + velvet gradient behind the text */}
      <RoseGlyph className="rose-watermark h-64 w-64 -right-8 -top-8" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-claret-fade" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {mark && (
            <div className="mb-4 flex items-center gap-3">
              <span className="gold-rose-line w-10" />
              <p className="act-mark">{mark}</p>
            </div>
          )}

          <h1 className="font-display text-3xl font-medium leading-tight text-dark-100 sm:text-4xl">
            {title}
            {highlight && (
              <>
                {' '}
                <span className="italic text-gradient-rose-gold">{highlight}</span>
              </>
            )}
          </h1>

          {description && (
            <p className="mt-3 max-w-2xl font-serif text-[15px] leading-relaxed text-dark-400 sm:text-base">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </header>
  );
}
