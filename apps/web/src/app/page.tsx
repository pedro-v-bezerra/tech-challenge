'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { TransactionStatus } from '@biud/contracts';

import { StatusBadge } from '@/components/status-badge';
import { listTransactions, type TransactionFilters } from '@/lib/api';
import {
  formatCurrency,
  formatDateTime,
  STATUS_OPTIONS,
  TRANSFER_TYPES,
} from '@/lib/transaction-types';

const inputClass = 'rounded border border-zinc-300 bg-white px-3 py-2 text-sm';

export default function HomePage() {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 10 });

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => listTransactions(filters),
  });

  function updateFilter(patch: Partial<TransactionFilters>) {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transações</h1>
        <Link
          href="/transactions/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nova transação
        </Link>
      </header>

      <section aria-label="Filtros" className="mb-4 flex flex-wrap gap-3">
        <select
          aria-label="Status"
          className={inputClass}
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

        <select
          aria-label="Tipo"
          className={inputClass}
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

        <input
          type="date"
          aria-label="De"
          className={inputClass}
          onChange={(event) =>
            updateFilter({
              from: event.target.value ? `${event.target.value}T00:00:00.000Z` : undefined,
            })
          }
        />
        <input
          type="date"
          aria-label="Até"
          className={inputClass}
          onChange={(event) =>
            updateFilter({
              to: event.target.value ? `${event.target.value}T23:59:59.999Z` : undefined,
            })
          }
        />
      </section>

      {isPending ? (
        <p role="status">Carregando transações…</p>
      ) : isError ? (
        <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error instanceof Error ? error.message : 'Erro ao carregar as transações.'}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded border border-zinc-200 bg-white p-6 text-center text-zinc-500">
          Nenhuma transação encontrada.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500">
                <tr>
                  <th className="p-3">Identificador</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3">Criada em</th>
                </tr>
              </thead>
              <tbody>
                {items.map((transaction) => (
                  <tr key={transaction.transactionExternalId} className="border-b border-zinc-100">
                    <td className="p-3">
                      <Link
                        href={`/transactions/${transaction.transactionExternalId}`}
                        className="font-mono text-xs text-blue-700 underline"
                      >
                        {transaction.transactionExternalId.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="p-3">{transaction.transactionType.name}</td>
                    <td className="p-3">
                      <StatusBadge status={transaction.transactionStatus.name} />
                    </td>
                    <td className="p-3 text-right">{formatCurrency(transaction.value)}</td>
                    <td className="p-3">{formatDateTime(transaction.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <nav aria-label="Paginação" className="mt-4 flex items-center justify-between text-sm">
              <span className="text-zinc-500">
                Página {meta.page} de {Math.max(meta.totalPages, 1)} · {meta.total} no total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40"
                  disabled={meta.page <= 1}
                  onClick={() => updateFilter({ page: meta.page - 1 })}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => updateFilter({ page: meta.page + 1 })}
                >
                  Próxima
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
