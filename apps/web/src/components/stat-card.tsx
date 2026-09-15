import { cardClass } from '@/lib/ui';

import { Skeleton } from './skeleton';

type Tone = 'neutral' | 'approved' | 'rejected' | 'pending';

const DOT: Record<Tone, string> = {
  neutral: 'bg-brand-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  pending: 'bg-amber-500',
};

/** Card de resumo: rótulo + contagem, com um ponto colorido por status. */
export function StatCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value?: number;
  tone: Tone;
  loading: boolean;
}) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-12" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">{value ?? 0}</p>
      )}
    </div>
  );
}
