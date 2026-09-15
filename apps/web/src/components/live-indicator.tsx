'use client';

import { useStreamStatus } from '@/lib/transaction-stream';

const META = {
  connecting: { label: 'conectando…', dot: 'bg-slate-400', text: 'text-slate-500', pulse: true },
  live: { label: 'ao vivo', dot: 'bg-emerald-500', text: 'text-emerald-700', pulse: true },
  reconnecting: {
    label: 'reconectando…',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    pulse: true,
  },
} as const;

/** Pílula que reflete o estado da conexão SSE (ver TransactionStreamProvider). */
export function LiveIndicator() {
  const status = useStreamStatus();
  const meta = META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-slate-200 ${meta.text}`}
      role="status"
      aria-label={`Conexão em tempo real: ${meta.label}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}
