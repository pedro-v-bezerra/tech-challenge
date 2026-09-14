'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { TransactionStatusUpdatedData } from '@biud/contracts';

import { apiUrl, type Paginated, type Transaction } from './api';

export type StreamStatus = 'connecting' | 'live' | 'reconnecting';
type UpdateListener = (transactionExternalId: string) => void;

interface StreamContextValue {
  status: StreamStatus;
  subscribe: (listener: UpdateListener) => () => void;
}

const StreamContext = createContext<StreamContextValue | null>(null);

/**
 * Aplica o evento `status.updated` ao cache do TanStack Query — patch direto na linha da listagem
 * e no detalhe, sem refetch (o evento já traz o estado final). Ver DECISIONS.md.
 */
export function applyStatusToCache(
  queryClient: QueryClient,
  update: TransactionStatusUpdatedData,
): void {
  queryClient.setQueryData<Transaction>(['transaction', update.transactionExternalId], (prev) =>
    prev ? { ...prev, transactionStatus: { name: update.status } } : prev,
  );

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
}

/**
 * Assina o SSE de status uma única vez, reconcilia o cache a cada evento e expõe o estado da
 * conexão + uma inscrição para reagir às atualizações (ex.: realçar a linha alterada).
 */
export function TransactionStreamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StreamStatus>('connecting');
  const listenersRef = useRef(new Set<UpdateListener>());

  useEffect(() => {
    const source = new EventSource(`${apiUrl()}/transactions/stream`);
    source.onopen = () => setStatus('live');
    source.onerror = () => setStatus('reconnecting');
    source.onmessage = (event) => {
      let update: TransactionStatusUpdatedData;
      try {
        update = JSON.parse(event.data) as TransactionStatusUpdatedData;
      } catch {
        return;
      }
      applyStatusToCache(queryClient, update);
      listenersRef.current.forEach((listener) => listener(update.transactionExternalId));
    };

    return () => source.close();
  }, [queryClient]);

  const subscribe = useCallback((listener: UpdateListener) => {
    const listeners = listenersRef.current;
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return <StreamContext.Provider value={{ status, subscribe }}>{children}</StreamContext.Provider>;
}

function useStream(): StreamContextValue {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error('useStream deve ser usado dentro de TransactionStreamProvider');
  return ctx;
}

/** Estado atual da conexão SSE (para o indicador "ao vivo"). */
export function useStreamStatus(): StreamStatus {
  return useStream().status;
}

/** Reage a cada transação atualizada em tempo real, sem reassinar quando o callback muda. */
export function useTransactionUpdates(listener: UpdateListener): void {
  const { subscribe } = useStream();
  const listenerRef = useRef(listener);

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => subscribe((id) => listenerRef.current(id)), [subscribe]);
}
