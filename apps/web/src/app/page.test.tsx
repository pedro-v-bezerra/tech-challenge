import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/lib/api';
import { renderWithProviders } from '@/test/utils';
import HomePage from './page';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, listTransactions: vi.fn() };
});

const listTransactionsMock = vi.mocked(api.listTransactions);

const oneTransaction: api.Transaction = {
  transactionExternalId: 'abc12345-0000-4000-8000-000000000000',
  transactionType: { name: 'TRANSFER' },
  transactionStatus: { name: 'APPROVED' },
  value: 120,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('HomePage (listagem)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra o estado de carregamento', () => {
    listTransactionsMock.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('mostra o estado vazio', async () => {
    listTransactionsMock.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    renderWithProviders(<HomePage />);
    expect(await screen.findByText(/nenhuma transação encontrada/i)).toBeInTheDocument();
  });

  it('mostra o estado de erro', async () => {
    listTransactionsMock.mockRejectedValue(new Error('Falha ao carregar as transações.'));
    renderWithProviders(<HomePage />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/falha ao carregar/i);
  });

  it('renderiza as transações retornadas', async () => {
    listTransactionsMock.mockResolvedValue({
      items: [oneTransaction],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    renderWithProviders(<HomePage />);
    expect(await screen.findByText('TRANSFER')).toBeInTheDocument();
    expect(screen.getByText('Aprovada')).toBeInTheDocument();
  });
});
