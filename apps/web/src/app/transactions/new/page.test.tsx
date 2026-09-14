import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '@/lib/api';
import { renderWithProviders } from '@/test/utils';
import NewTransactionPage from './page';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, createTransaction: vi.fn() };
});

const createTransactionMock = vi.mocked(api.createTransaction);

describe('NewTransactionPage (formulário)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('valida os campos e não envia quando estão vazios', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NewTransactionPage />);

    await user.click(screen.getByRole('button', { name: /criar transação/i }));

    expect(await screen.findAllByText(/informe um uuid válido/i)).toHaveLength(2);
    expect(screen.getByText(/o valor deve ser positivo|informe um valor/i)).toBeInTheDocument();
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it('envia os dados válidos', async () => {
    createTransactionMock.mockResolvedValue({
      transactionExternalId: 'abc12345-0000-4000-8000-000000000000',
      transactionType: { name: 'TRANSFER' },
      transactionStatus: { name: 'PENDING' },
      value: 120,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const user = userEvent.setup();
    renderWithProviders(<NewTransactionPage />);

    await user.type(
      screen.getByRole('textbox', { name: /conta de débito/i }),
      '3a1e6f7a-0f2c-4c1e-9d4a-6b0c2a9f1111',
    );
    await user.type(
      screen.getByRole('textbox', { name: /conta de crédito/i }),
      '9c2b4d5e-1a3f-4b6c-8e7d-5f0a1b2c2222',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: /tipo/i }), '1');
    await user.type(screen.getByRole('spinbutton', { name: /valor/i }), '120');

    await user.click(screen.getByRole('button', { name: /criar transação/i }));

    expect(createTransactionMock).toHaveBeenCalledTimes(1);
    expect(createTransactionMock.mock.calls[0]?.[0]).toEqual({
      accountExternalIdDebit: '3a1e6f7a-0f2c-4c1e-9d4a-6b0c2a9f1111',
      accountExternalIdCredit: '9c2b4d5e-1a3f-4b6c-8e7d-5f0a1b2c2222',
      transferTypeId: 1,
      value: 120,
    });
  });
});
