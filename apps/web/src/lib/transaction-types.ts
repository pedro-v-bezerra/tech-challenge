import { TransactionStatus } from '@biud/contracts';

/** Tipos de transferência semeados no backend (tabela de referência). */
export const TRANSFER_TYPES = [
  { id: 1, name: 'TRANSFER' },
  { id: 2, name: 'DEPOSIT' },
  { id: 3, name: 'WITHDRAWAL' },
] as const;

export const STATUS_OPTIONS = [
  { value: TransactionStatus.Pending, label: 'Pendente' },
  { value: TransactionStatus.Approved, label: 'Aprovada' },
  { value: TransactionStatus.Rejected, label: 'Rejeitada' },
] as const;

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}
