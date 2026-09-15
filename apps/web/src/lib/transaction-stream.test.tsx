import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { act, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionStatus } from '@biud/contracts';

import type { Paginated, Transaction } from './api';
import {
  applyStatusToCache,
  TransactionStreamProvider,
  useStreamStatus,
} from './transaction-stream';

function makeTransaction(id: string, status: TransactionStatus): Transaction {
  return {
    transactionExternalId: id,
    transactionType: { name: 'TRANSFER' },
    transactionStatus: { name: status },
    value: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('applyStatusToCache', () => {
  it('atualiza o detalhe da transação em cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      ['transaction', 'tx-1'],
      makeTransaction('tx-1', TransactionStatus.Pending),
    );

    applyStatusToCache(queryClient, {
      transactionExternalId: 'tx-1',
      status: TransactionStatus.Approved,
    });

    const detail = queryClient.getQueryData<Transaction>(['transaction', 'tx-1']);
    expect(detail?.transactionStatus.name).toBe(TransactionStatus.Approved);
  });

  it('atualiza apenas a linha correspondente na listagem', () => {
    const queryClient = new QueryClient();
    const page: Paginated<Transaction> = {
      items: [
        makeTransaction('tx-1', TransactionStatus.Pending),
        makeTransaction('tx-2', TransactionStatus.Pending),
      ],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };
    queryClient.setQueryData(['transactions', { page: 1, limit: 10 }], page);

    applyStatusToCache(queryClient, {
      transactionExternalId: 'tx-2',
      status: TransactionStatus.Rejected,
    });

    const cached = queryClient.getQueryData<Paginated<Transaction>>([
      'transactions',
      { page: 1, limit: 10 },
    ]);
    expect(cached?.items[0]?.transactionStatus.name).toBe(TransactionStatus.Pending);
    expect(cached?.items[1]?.transactionStatus.name).toBe(TransactionStatus.Rejected);
  });
});

class MockEventSource {
  static instances: MockEventSource[] = [];
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn();

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }
}

describe('TransactionStreamProvider', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    vi.stubGlobal('EventSource', MockEventSource);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function StatusProbe() {
    return <span data-testid="status">{useStreamStatus()}</span>;
  }

  function renderProvider() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <TransactionStreamProvider>{children}</TransactionStreamProvider>
        </QueryClientProvider>
      );
    }
    const view = render(<StatusProbe />, { wrapper: Wrapper });
    const source = MockEventSource.instances[0];
    if (!source) throw new Error('EventSource não foi instanciado');
    return { ...view, source };
  }

  it('reflete o estado da conexão (connecting → live → reconnecting)', () => {
    const { source } = renderProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('connecting');

    act(() => source.onopen?.());
    expect(screen.getByTestId('status')).toHaveTextContent('live');

    act(() => source.onerror?.());
    expect(screen.getByTestId('status')).toHaveTextContent('reconnecting');
  });

  it('fecha a conexão ao desmontar', () => {
    const { unmount, source } = renderProvider();
    unmount();
    expect(source.close).toHaveBeenCalledOnce();
  });
});
