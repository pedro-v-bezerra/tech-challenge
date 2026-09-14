/** Bloco de carregamento (placeholder pulsante). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-slate-200/80 ${className}`} aria-hidden="true" />
  );
}
