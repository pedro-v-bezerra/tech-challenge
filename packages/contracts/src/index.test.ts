import { describe, expect, it } from 'vitest';

import { Topics, TransactionStatus } from './index';

describe('contracts', () => {
  it('define os três status de transação', () => {
    expect(Object.values(TransactionStatus)).toEqual(['PENDING', 'APPROVED', 'REJECTED']);
  });

  it('define os nomes dos tópicos Kafka', () => {
    expect(Topics.TransactionCreated).toBe('transaction.created');
    expect(Topics.TransactionStatusUpdated).toBe('transaction.status.updated');
  });
});
