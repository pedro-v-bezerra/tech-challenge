'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { getTransaction } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/transaction-types';

import { Skeleton } from './skeleton';
import { StatusBadge } from './status-badge';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Área de transferência indisponível (ex.: contexto sem permissão) — ignora.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      aria-label="Copiar identificador"
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm text-slate-900">{children}</dd>
    </div>
  );
}

/** Conteúdo do detalhe reutilizado pela rota /transactions/[id] e pelo modal da listagem. */
export function TransactionDetail({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  });

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {error instanceof Error ? error.message : 'Erro ao carregar a transação.'}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="Carregando transação">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">
            {formatCurrency(data.value)}
          </p>
        </div>
        <StatusBadge status={data.transactionStatus.name} />
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        <DetailRow label="Identificador">
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-xs text-slate-600">{data.transactionExternalId}</span>
            <CopyButton value={data.transactionExternalId} />
          </span>
        </DetailRow>
        <DetailRow label="Tipo">{data.transactionType.name}</DetailRow>
        <DetailRow label="Criada em">{formatDateTime(data.createdAt)}</DetailRow>
      </dl>
    </div>
  );
}
