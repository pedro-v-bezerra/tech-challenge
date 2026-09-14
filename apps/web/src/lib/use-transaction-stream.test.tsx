import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionStatus } from '@biud/contracts';

import type { Paginated, Transaction } from './api';
import { useTransactionStream } from './use-transaction-stream';

class MockEventSource {
  static instances: MockEventSource[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn();

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  emit(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

function makeTransaction(id: string, status: TransactionStatus): Transaction {
  return {
    transactionExternalId: id,
    transactionType: { name: 'TRANSFER' },
    transactionStatus: { name: status },
    value: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  renderHook(() => useTransactionStream(), { wrapper: Wrapper });
  const source = MockEventSource.instances[0];
  if (!source) throw new Error('EventSource não foi instanciado');
  return { queryClient, source };
}

describe('useTransactionStream', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('atualiza o detalhe da transação quando chega um novo status', () => {
    const { queryClient, source } = setup();
    queryClient.setQueryData(
      ['transaction', 'tx-1'],
      makeTransaction('tx-1', TransactionStatus.Pending),
    );

    source.emit({ transactionExternalId: 'tx-1', status: TransactionStatus.Approved });

    const detail = queryClient.getQueryData<Transaction>(['transaction', 'tx-1']);
    expect(detail?.transactionStatus.name).toBe(TransactionStatus.Approved);
  });

  it('atualiza apenas a linha correspondente na listagem em cache', () => {
    const { queryClient, source } = setup();
    const page: Paginated<Transaction> = {
      items: [
        makeTransaction('tx-1', TransactionStatus.Pending),
        makeTransaction('tx-2', TransactionStatus.Pending),
      ],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };
    queryClient.setQueryData(['transactions', { page: 1, limit: 10 }], page);

    source.emit({ transactionExternalId: 'tx-2', status: TransactionStatus.Rejected });

    const cached = queryClient.getQueryData<Paginated<Transaction>>([
      'transactions',
      { page: 1, limit: 10 },
    ]);
    expect(cached?.items[0]?.transactionStatus.name).toBe(TransactionStatus.Pending);
    expect(cached?.items[1]?.transactionStatus.name).toBe(TransactionStatus.Rejected);
  });

  it('fecha a conexão ao desmontar', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Wrapper({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }
    const { unmount } = renderHook(() => useTransactionStream(), { wrapper: Wrapper });
    const source = MockEventSource.instances[0];

    unmount();

    expect(source?.close).toHaveBeenCalledOnce();
  });
});
