/**
 * Online status indicator — green/gray dot on avatar
 */
export function OnlineIndicator({
  isOnline,
  size = 'md',
}: {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5',
  };

  return (
    <span
      className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-dark-900 ${
        sizeClasses[size]
      } ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  );
}

/**
 * Avatar with online status
 */
export function AvatarWithStatus({
  src,
  name,
  isOnline,
  size = 'md',
}: {
  src?: string | null;
  name: string;
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const avatarSizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const indicatorSizes = {
    sm: 'sm' as const,
    md: 'md' as const,
    lg: 'lg' as const,
  };

  return (
    <div className="relative inline-block">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover ${avatarSizes[size]}`}
        />
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-brand-400/10 ${avatarSizes[size]}`}
        >
          <span className="font-medium text-brand-400">
            {name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
      )}
      <OnlineIndicator isOnline={isOnline} size={indicatorSizes[size]} />
    </div>
  );
}
