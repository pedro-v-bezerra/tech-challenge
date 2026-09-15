import { TransactionStatus } from '@biud/contracts';

const STATUS_META: Record<
  TransactionStatus,
  { label: string; dot: string; className: string; pulse?: boolean }
> = {
  [TransactionStatus.Pending]: {
    label: 'Pendente',
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    pulse: true,
  },
  [TransactionStatus.Approved]: {
    label: 'Aprovada',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  [TransactionStatus.Rejected]: {
    label: 'Rejeitada',
    dot: 'bg-red-500',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors ${meta.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}
