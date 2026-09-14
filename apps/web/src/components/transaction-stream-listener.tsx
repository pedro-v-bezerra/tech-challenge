'use client';

import { useTransactionStream } from '@/lib/use-transaction-stream';

/** Monta a assinatura do SSE uma única vez, dentro do QueryClientProvider. Não renderiza nada. */
export function TransactionStreamListener() {
  useTransactionStream();
  return null;
}
