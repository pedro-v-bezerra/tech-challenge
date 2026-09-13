import type { TransactionStatus } from './transaction-status';

/**
 * Envelope comum a todos os eventos do fluxo.
 * - `eventId`: identifica o evento (idempotência no consumo).
 * - `occurredAt`: quando o evento ocorreu, em ISO-8601 (rastreio/debug).
 */
export interface EventEnvelope<TData> {
  eventId: string;
  occurredAt: string;
  data: TData;
}

/** `transaction.created` — publicado por `transactions`, consumido por `anti-fraud`. */
export interface TransactionCreatedData {
  transactionExternalId: string;
  value: number;
  transferTypeId: number;
}

/** `transaction.status.updated` — publicado por `anti-fraud`, consumido por `transactions`. */
export interface TransactionStatusUpdatedData {
  transactionExternalId: string;
  status: TransactionStatus;
}

export type TransactionCreatedEvent = EventEnvelope<TransactionCreatedData>;
export type TransactionStatusUpdatedEvent = EventEnvelope<TransactionStatusUpdatedData>;
