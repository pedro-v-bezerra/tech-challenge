import { TransactionStatus } from '@biud/contracts';

/** Toda transação com valor acima de 1000 é rejeitada; as demais, aprovadas. */
export const FRAUD_VALUE_LIMIT = 1000;

export function evaluateFraud(value: number): TransactionStatus {
  return value > FRAUD_VALUE_LIMIT ? TransactionStatus.Rejected : TransactionStatus.Approved;
}
