import type { CSSProperties } from 'react';

interface RoseGlyphProps {
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
}

/**
 * ARETON rose glyph.
 *
 * A single-line, geometrically-constructed rose inspired by Art Deco rose-gold
 * monograms, Victorian floriography, and the Persian ghazal tradition of the
 * rose as beloved. The bud sits at the centre, wrapped by five petal layers
 * that spiral outward — deliberately non-photorealistic, to keep the motif
 * readable as a mark at small sizes and elegant as a hero ornament at large.
 *
 * Colours are driven entirely by CSS `currentColor` so the glyph can inherit
 * the surrounding brand gold or rose-gold foil gradient.
 */
export function RoseGlyph({ className, style, strokeWidth = 1.2 }: RoseGlyphProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* Outer corona — five rounded petals */}
      <g stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 10 C 80 20, 98 36, 104 58" opacity="0.85" />
        <path d="M104 58 C 108 80, 96 100, 78 108" opacity="0.85" />
        <path d="M78 108 C 60 114, 40 110, 26 96" opacity="0.85" />
        <path d="M26 96 C 12 82, 10 60, 18 42" opacity="0.85" />
        <path d="M18 42 C 28 22, 42 12, 60 10" opacity="0.85" />

        {/* Second layer — slightly inset */}
        <path d="M60 22 C 76 30, 90 42, 94 60" opacity="0.7" />
        <path d="M94 60 C 96 78, 86 94, 72 100" opacity="0.7" />
        <path d="M72 100 C 56 104, 42 100, 32 88" opacity="0.7" />
        <path d="M32 88 C 22 76, 22 58, 30 44" opacity="0.7" />
        <path d="M30 44 C 38 30, 48 24, 60 22" opacity="0.7" />

        {/* Inner scroll — the classic spiral bud */}
        <path
          d="M60 38
             C 70 42, 76 50, 74 60
             C 72 70, 62 74, 54 70
             C 46 66, 46 56, 54 52
             C 62 48, 68 54, 66 60"
          opacity="1"
        />

        {/* Centre dot */}
        <circle cx="60" cy="60" r="1.8" fill="currentColor" stroke="none" />

        {/* Two thorns anchoring the stem — "beautiful but thorned" */}
        <path d="M60 108 L 60 118" opacity="0.55" />
        <path d="M60 114 L 54 118" opacity="0.5" />
        <path d="M60 114 L 66 118" opacity="0.5" />
      </g>
    </svg>
  );
}
