import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { usePresenceStore } from '@/stores/presence.store';

interface EscortCardProps {
  escort: {
    id: string;
    bio?: string;
    hourlyRate: number;
    ratingAvg: number;
    totalReviews: number;
    tier: string;
    languages: string[];
    skills: string[];
    portfolioUrls: string[];
    isApproved: boolean;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
  };
  basePath?: string;
  isPublic?: boolean;
}

const tierConfig: Record<string, { accent: string; label: string; badge: string; glow: string; bar: string }> = {
  SILVER: { accent: 'from-slate-400/80 to-slate-300/80', label: 'Silver', badge: 'bg-slate-500/10 text-slate-300 border-slate-400/20', glow: 'rgba(148,163,184,0.12)', bar: 'from-slate-400/60 to-slate-300/20' },
  GOLD: { accent: 'from-brand-400/80 to-amber-300/80', label: 'Gold', badge: 'bg-brand-400/10 text-brand-300 border-brand-400/30', glow: 'rgba(201,169,110,0.15)', bar: 'from-brand-400/60 to-amber-300/20' },
  PLATINUM: { accent: 'from-violet-400/80 to-blue-300/80', label: 'Platinum', badge: 'bg-violet-500/10 text-violet-300 border-violet-400/20', glow: 'rgba(167,139,250,0.12)', bar: 'from-violet-400/60 to-blue-300/20' },
  DIAMOND: { accent: 'from-sky-400/80 to-cyan-300/80', label: 'Diamond', badge: 'bg-sky-500/10 text-sky-300 border-sky-400/20', glow: 'rgba(56,189,248,0.12)', bar: 'from-sky-400/60 to-cyan-300/20' },
};

export function EscortCard({ escort, basePath = '/escorts', isPublic = false }: EscortCardProps) {
  const tier = tierConfig[escort.tier] || tierConfig.SILVER;
  const isOnline = usePresenceStore((s) => s.isOnline(escort.user?.id || ''));

  return (
    <Link
      href={`${basePath}/${escort.id}`}
      className="group relative block overflow-hidden border border-dark-700/30 bg-dark-800/40 backdrop-blur-sm transition-all duration-700 hover:border-brand-400/20 hover:shadow-[0_8px_40px_-12px_rgba(201,169,110,0.15)]"
    >
      {/* Tier accent bar — top edge */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${tier.bar} z-10`} />

      {/* Decorative corner ornaments */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-brand-400/15 z-10 transition-all duration-500 group-hover:w-6 group-hover:h-6 group-hover:border-brand-400/30" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-brand-400/15 z-10 transition-all duration-500 group-hover:w-6 group-hover:h-6 group-hover:border-brand-400/30" />

      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-700">
        {escort?.user?.profilePhoto ? (
          <img
            src={escort.user.profilePhoto}
            alt={`${escort?.user?.firstName || ''} ${escort?.user?.lastName || ''}`}
            className={`h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]${isPublic ? ' scale-105 blur-[2px]' : ''}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-dark-800 to-dark-700">
            <span className="font-display text-6xl font-light text-dark-500/40">
              {escort?.user?.firstName?.[0] || '?'}
            </span>
          </div>
        )}

        {/* Cinematic multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-dark-900/40 opacity-50" />
        
        {/* Vignette */}
        <div className="absolute inset-0 vignette opacity-30" />

        {/* Hover glow */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: `radial-gradient(ellipse at 50% 80%, ${tier.glow}, transparent 70%)` }}
        />

        {/* Public lock overlay */}
        {isPublic && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-900/30 backdrop-blur-[1px]">
            <div className="rounded-full bg-dark-900/60 p-3 backdrop-blur-sm border border-brand-400/10">
              <svg className="h-6 w-6 text-brand-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
          </div>
        )}

        {/* Tier Badge */}
        <div className="absolute left-3 top-5">
          <span className={`inline-flex items-center border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest backdrop-blur-sm ${tier.badge}`}>
            {tier.label}
          </span>
        </div>

        {/* Online indicator */}
        {isOnline && !isPublic && (
          <div className="absolute right-3 top-5 flex items-center gap-1.5 bg-dark-900/60 backdrop-blur-md px-2 py-0.5 border border-dark-700/30">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Online</span>
          </div>
        )}

        {/* Rating */}
        <div className="absolute bottom-14 right-3 flex items-center gap-1.5 bg-dark-900/60 backdrop-blur-md px-2.5 py-1 border border-dark-700/30">
          <svg className="h-3 w-3 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-[11px] font-medium text-dark-100">{escort.ratingAvg?.toFixed(1) || '0.0'}</span>
          <span className="text-[10px] text-dark-400">({(escort.totalReviews || 0).toLocaleString('id-ID')})</span>
        </div>

        {/* Bottom overlay with name — editorial style */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-16">
          <div className="mb-1.5 h-px w-8 bg-gradient-to-r from-brand-400/50 to-transparent transition-all duration-500 group-hover:w-12" />
          <h3 className="font-display text-lg font-medium tracking-wide text-white group-hover:text-brand-300 transition-colors duration-300">
            {escort?.user?.firstName} {escort?.user?.lastName}
          </h3>
        </div>
      </div>

      {/* Info — refined layout */}
      <div className="p-4 relative">
        {/* Subtle art-deco pattern background */}
        <div className="absolute inset-0 art-deco-bg opacity-40" />
        
        <div className="relative">
          {escort.bio && (
            <p className="line-clamp-2 font-serif text-[13px] leading-relaxed text-dark-400 italic">{escort.bio}</p>
          )}

          {/* Skills */}
          {escort.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {escort.skills.slice(0, 3).map((skill) => (
                <span key={skill} className="border border-dark-700/30 bg-dark-800/60 px-2.5 py-0.5 text-[10px] tracking-wide text-dark-400 transition-colors group-hover:border-brand-400/15 group-hover:text-dark-300">
                  {skill}
                </span>
              ))}
              {escort.skills.length > 3 && (
                <span className="px-2 py-0.5 text-[10px] text-dark-500">
                  +{escort.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price & Languages — with gold accent */}
          <div className="mt-3 flex items-center justify-between border-t border-dark-700/20 pt-3">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-sm font-medium text-brand-400">{formatCurrency(escort.hourlyRate)}</span>
              <span className="text-[11px] text-dark-500">/jam</span>
            </div>
            {escort.languages?.length > 0 && (
              <span className="text-[11px] text-dark-500 tracking-wide">
                {escort.languages.slice(0, 2).join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div className={`h-[1px] bg-gradient-to-r ${tier.bar} opacity-0 transition-opacity duration-500 group-hover:opacity-100`} />
    </Link>
  );
}
