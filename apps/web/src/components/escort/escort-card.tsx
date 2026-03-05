import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

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
}

const tierConfig: Record<string, { color: string; label: string }> = {
  SILVER: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'Silver' },
  GOLD: { color: 'bg-brand-400/10 text-brand-400 border-brand-400/20', label: 'Gold' },
  PLATINUM: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Platinum' },
  DIAMOND: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'Diamond' },
};

export function EscortCard({ escort }: EscortCardProps) {
  const tier = tierConfig[escort.tier] || tierConfig.SILVER;

  return (
    <Link
      href={`/escorts/${escort.id}`}
      className="group block overflow-hidden rounded-xl border border-dark-700/50 bg-dark-800/50 transition-all hover:border-brand-400/30 hover:bg-dark-800"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-dark-700">
        {escort.user.profilePhoto || escort.portfolioUrls?.[0] ? (
          <img
            src={escort.user.profilePhoto || escort.portfolioUrls[0]}
            alt={`${escort.user.firstName} ${escort.user.lastName}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-light text-dark-500">
              {escort.user.firstName[0]}
            </span>
          </div>
        )}

        {/* Tier Badge */}
        <div className="absolute left-3 top-3">
          <Badge className={tier.color}>{tier.label}</Badge>
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-lg bg-dark-900/80 backdrop-blur-sm px-2 py-1">
          <svg className="h-3.5 w-3.5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-medium text-dark-100">{escort.ratingAvg?.toFixed(1) || '0.0'}</span>
          <span className="text-xs text-dark-400">({escort.totalReviews})</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-dark-100 group-hover:text-brand-400 transition-colors">
          {escort.user.firstName} {escort.user.lastName}
        </h3>

        {escort.bio && (
          <p className="mt-1 line-clamp-2 text-xs text-dark-400">{escort.bio}</p>
        )}

        {/* Skills */}
        {escort.skills?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {escort.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="rounded-full bg-dark-700/50 px-2 py-0.5 text-[10px] text-dark-400">
                {skill}
              </span>
            ))}
            {escort.skills.length > 3 && (
              <span className="rounded-full bg-dark-700/50 px-2 py-0.5 text-[10px] text-dark-500">
                +{escort.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center justify-between border-t border-dark-700/50 pt-3">
          <div>
            <span className="text-sm font-medium text-brand-400">{formatCurrency(escort.hourlyRate)}</span>
            <span className="text-xs text-dark-500"> /jam</span>
          </div>
          {escort.languages?.length > 0 && (
            <span className="text-xs text-dark-500">
              {escort.languages.slice(0, 2).join(', ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
