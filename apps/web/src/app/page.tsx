'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useCallback, useState, type MouseEvent } from 'react';
import type { TransactionStatus } from '@biud/contracts';

import { EyeIcon, FilterIcon, XIcon } from '@/components/icons';
import { Modal } from '@/components/modal';
import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/skeleton';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { TransactionDetail } from '@/components/transaction-detail';
import { TransactionForm } from '@/components/transaction-form';
import { listTransactions, type TransactionFilters } from '@/lib/api';
import { useTransactionUpdates } from '@/lib/transaction-stream';
import {
  formatCurrency,
  formatDateTime,
  STATUS_OPTIONS,
  TRANSFER_TYPES,
} from '@/lib/transaction-types';
import { cardClass, controlClass, primaryButtonClass } from '@/lib/ui';

const COLUMNS = 6;

// Deixa o clique com modificador (nova aba/janela) seguir o link em vez de abrir o modal.
function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function useStatusCount(status?: TransactionStatus) {
  return useQuery({
    queryKey: ['count', status ?? 'all'],
    queryFn: () => listTransactions(status ? { status, limit: 1 } : { limit: 1 }),
    select: (data) => data.meta.total,
  });
}

export default function HomePage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => listTransactions(filters),
  });

  const total = useStatusCount();
  const approved = useStatusCount('APPROVED' as TransactionStatus);
  const rejected = useStatusCount('REJECTED' as TransactionStatus);
  const pending = useStatusCount('PENDING' as TransactionStatus);

  // Realça a linha alterada em tempo real e mantém os contadores em dia.
  useTransactionUpdates(
    useCallback(
      (id: string) => {
        setFlashIds((prev) => new Set(prev).add(id));
        window.setTimeout(() => {
          setFlashIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 1300);
        void queryClient.invalidateQueries({ queryKey: ['count'] });
      },
      [queryClient],
    ),
  );

  function updateFilter(patch: Partial<TransactionFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  const hasFilters = Boolean(
    filters.status || filters.transferTypeId || filters.from || filters.to,
  );
  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Transações</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe o status das transações em tempo real.
          </p>
        </div>
        <Link
          href="/transactions/new"
          className={primaryButtonClass}
          onClick={(event) => {
            if (isModifiedClick(event)) return;
            event.preventDefault();
            setCreateOpen(true);
          }}
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
          Nova transação
        </Link>
      </header>

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" tone="neutral" value={total.data} loading={total.isPending} />
        <StatCard
          label="Aprovadas"
          tone="approved"
          value={approved.data}
          loading={approved.isPending}
        />
        <StatCard
          label="Rejeitadas"
          tone="rejected"
          value={rejected.data}
          loading={rejected.isPending}
        />
        <StatCard
          label="Pendentes"
          tone="pending"
          value={pending.data}
          loading={pending.isPending}
        />
      </section>

      <section aria-label="Filtros" className={`${cardClass} space-y-4 p-4`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <FilterIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => setFilters({ page: 1, limit: filters.limit })}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <XIcon className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Status</span>
            <select
              className={`${controlClass} w-full`}
              value={filters.status ?? ''}
              onChange={(event) =>
                updateFilter({ status: (event.target.value || undefined) as TransactionStatus })
              }
            >
              <option value="">Todos os status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Tipo</span>
            <select
              className={`${controlClass} w-full`}
              value={filters.transferTypeId ?? ''}
              onChange={(event) =>
                updateFilter({
                  transferTypeId: event.target.value ? Number(event.target.value) : undefined,
                })
              }
            >
              <option value="">Todos os tipos</option>
              {TRANSFER_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">De</span>
            <input
              type="date"
              className={`${controlClass} w-full`}
              value={filters.from?.slice(0, 10) ?? ''}
              onChange={(event) =>
                updateFilter({
                  from: event.target.value ? `${event.target.value}T00:00:00.000Z` : undefined,
                })
              }
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-500">Até</span>
            <input
              type="date"
              className={`${controlClass} w-full`}
              value={filters.to?.slice(0, 10) ?? ''}
              onChange={(event) =>
                updateFilter({
                  to: event.target.value ? `${event.target.value}T23:59:59.999Z` : undefined,
                })
              }
            />
          </label>
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden`}>
        {isError ? (
          <div
            role="alert"
            className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error instanceof Error ? error.message : 'Erro ao carregar as transações.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Identificador</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Criada em</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isPending ? (
                  <SkeletonRows />
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS} className="px-4 py-16">
                      <EmptyState hasFilters={hasFilters} />
                    </td>
                  </tr>
                ) : (
                  items.map((transaction) => {
                    const id = transaction.transactionExternalId;
                    return (
                      <tr
                        key={id}
                        className={`transition-colors hover:bg-slate-50 ${
                          flashIds.has(id) ? 'animate-row-flash' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                            {id.slice(0, 8)}…
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {transaction.transactionType.name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={transaction.transactionStatus.name} />
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                          {formatCurrency(transaction.value)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDateTime(transaction.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setDetailId(id)}
                            aria-label="Visualizar transação"
                            title="Visualizar"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta && items.length > 0 && (
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={filters.limit ?? 10}
            onPageChange={(page) => updateFilter({ page })}
            onLimitChange={(limit) => updateFilter({ limit })}
          />
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova transação">
        <TransactionForm
          onSuccess={(created) => {
            setCreateOpen(false);
            setDetailId(created.transactionExternalId);
          }}
        />
      </Modal>

      <Modal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        title="Detalhe da transação"
      >
        {detailId && <TransactionDetail id={detailId} />}
      </Modal>
    </main>
  );
}

function SkeletonRows() {
  return (
    <>
      <tr className="sr-only" role="status">
        <td>Carregando transações…</td>
      </tr>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-3">
            <Skeleton className="h-6 w-20" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-24" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-5 w-20 rounded-full" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="ml-auto h-4 w-20" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-4 py-3">
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        ⌀
      </div>
      <p className="font-medium text-slate-700">Nenhuma transação encontrada.</p>
      <p className="text-sm text-slate-500">
        {hasFilters
          ? 'Tente ajustar os filtros para ampliar a busca.'
          : 'Crie a primeira transação para começar.'}
      </p>
    </div>
  );
}
