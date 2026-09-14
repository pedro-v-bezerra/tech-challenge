import type { TransactionStatus } from '@biud/contracts';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Transaction {
  transactionExternalId: string;
  transactionType: { name: string };
  transactionStatus: { name: TransactionStatus };
  value: number;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface TransactionFilters {
  status?: TransactionStatus;
  transferTypeId?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  accountExternalIdDebit: string;
  accountExternalIdCredit: string;
  transferTypeId: number;
  value: number;
}

export function apiUrl(): string {
  return API_URL;
}

export async function listTransactions(
  filters: TransactionFilters,
): Promise<Paginated<Transaction>> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.transferTypeId) params.set('transferTypeId', String(filters.transferTypeId));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 10));

  const response = await fetch(`${API_URL}/transactions?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Falha ao carregar as transações.');
  }
  return (await response.json()) as Paginated<Transaction>;
}

export async function getTransaction(transactionExternalId: string): Promise<Transaction> {
  const response = await fetch(`${API_URL}/transactions/${transactionExternalId}`);
  if (response.status === 404) {
    throw new Error('Transação não encontrada.');
  }
  if (!response.ok) {
    throw new Error('Falha ao carregar a transação.');
  }
  return (await response.json()) as Transaction;
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message ?? 'Falha ao criar a transação.');
  }
  return (await response.json()) as Transaction;
}
