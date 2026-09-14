import { TransactionStatus } from '@biud/contracts';

const STATUS_META: Record<TransactionStatus, { label: string; className: string }> = {
  [TransactionStatus.Pending]: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  [TransactionStatus.Approved]: { label: 'Aprovada', className: 'bg-green-100 text-green-800' },
  [TransactionStatus.Rejected]: { label: 'Rejeitada', className: 'bg-red-100 text-red-800' },
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
      {meta.label}
    </span>
  );
}
