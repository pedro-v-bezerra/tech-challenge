/**
 * Status possíveis de uma transação. Domínio fechado (3 valores fixos), modelado como
 * objeto `const` + união de tipos — mais leve e previsível que um `enum` do TS.
 */
export const TransactionStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];
