import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
  className?: string;
  tier?: 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
}

const tierColors = {
  SILVER: 'ring-gray-400',
  GOLD: 'ring-brand-400',
  PLATINUM: 'ring-blue-400',
  DIAMOND: 'ring-purple-400',
};

export function Avatar({ src, alt = '', size = 'md', fallback, className, tier }: AvatarProps) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-lg',
  };

  const initials = fallback || alt
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-dark-700 overflow-hidden',
        sizes[size],
        tier && `ring-2 ${tierColors[tier]}`,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="font-medium text-dark-400">{initials}</span>
      )}
    </div>
  );
}
