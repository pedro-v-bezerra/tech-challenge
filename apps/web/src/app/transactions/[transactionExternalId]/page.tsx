'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { StatusBadge } from '@/components/status-badge';
import { getTransaction } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/transaction-types';

export default function TransactionDetailPage() {
  const params = useParams<{ transactionExternalId: string }>();
  const id = params.transactionExternalId;

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm text-blue-700 underline">
        ← Voltar
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Detalhe da transação</h1>

      {isPending ? (
        <p role="status">Carregando…</p>
      ) : isError ? (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error instanceof Error ? error.message : 'Erro ao carregar a transação.'}
        </div>
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded border border-zinc-200 bg-white p-6 text-sm">
          <dt className="font-medium text-zinc-500">Identificador</dt>
          <dd className="font-mono">{data.transactionExternalId}</dd>

          <dt className="font-medium text-zinc-500">Tipo</dt>
          <dd>{data.transactionType.name}</dd>

          <dt className="font-medium text-zinc-500">Status</dt>
          <dd>
            <StatusBadge status={data.transactionStatus.name} />
          </dd>

          <dt className="font-medium text-zinc-500">Valor</dt>
          <dd>{formatCurrency(data.value)}</dd>

          <dt className="font-medium text-zinc-500">Criada em</dt>
          <dd>{formatDateTime(data.createdAt)}</dd>
        </dl>
      )}
    </main>
  );
}
