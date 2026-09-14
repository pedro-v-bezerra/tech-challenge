'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { TransactionStatusUpdatedData } from '@biud/contracts';

import { apiUrl, type Paginated, type Transaction } from './api';

/**
 * Assina o SSE de status e reconcilia o cache do TanStack Query quando uma transação muda de
 * status. Fazemos patch direto no cache (em vez de invalidar e refazer o fetch) porque o evento
 * já traz o estado final — evita ida ao servidor e a UI reflete Pendente → Aprovada/Rejeitada na
 * hora, tanto na listagem quanto no detalhe.
 */
export function useTransactionStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${apiUrl()}/transactions/stream`);

    source.onmessage = (event) => {
      let update: TransactionStatusUpdatedData;
      try {
        update = JSON.parse(event.data) as TransactionStatusUpdatedData;
      } catch {
        return;
      }

      // Detalhe da transação afetada, se estiver em cache.
      queryClient.setQueryData<Transaction>(
        ['transaction', update.transactionExternalId],
        (prev) => (prev ? { ...prev, transactionStatus: { name: update.status } } : prev),
      );

      // Qualquer página/filtro da listagem em cache (chave prefixada por 'transactions').
      queryClient.setQueriesData<Paginated<Transaction>>({ queryKey: ['transactions'] }, (prev) => {
        if (!prev) return prev;
        let changed = false;
        const items = prev.items.map((item) => {
          if (item.transactionExternalId !== update.transactionExternalId) return item;
          changed = true;
          return { ...item, transactionStatus: { name: update.status } };
        });
        return changed ? { ...prev, items } : prev;
      });
    };

    return () => source.close();
  }, [queryClient]);
}
