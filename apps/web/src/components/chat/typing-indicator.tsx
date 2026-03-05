/**
 * Typing indicator — animated dots "sedang mengetik..."
 */
export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-brand-400/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-brand-400/60 animate-bounce [animation-delay:200ms]" />
        <span className="h-2 w-2 rounded-full bg-brand-400/60 animate-bounce [animation-delay:400ms]" />
      </div>
      <span className="text-xs text-dark-400">
        {name ? `${name} sedang mengetik...` : 'sedang mengetik...'}
      </span>
    </div>
  );
}
