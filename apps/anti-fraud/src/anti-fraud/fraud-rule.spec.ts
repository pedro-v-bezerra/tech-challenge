import { TransactionStatus } from '@biud/contracts';

import { evaluateFraud, FRAUD_VALUE_LIMIT } from './fraud-rule';

describe('evaluateFraud', () => {
  it('aprova valores abaixo do limite', () => {
    expect(evaluateFraud(1)).toBe(TransactionStatus.Approved);
    expect(evaluateFraud(999.99)).toBe(TransactionStatus.Approved);
  });

  it('aprova exatamente no limite (1000 não é "acima de 1000")', () => {
    expect(evaluateFraud(FRAUD_VALUE_LIMIT)).toBe(TransactionStatus.Approved);
  });

  it('rejeita logo acima do limite', () => {
    expect(evaluateFraud(1000.01)).toBe(TransactionStatus.Rejected);
  });

  it('rejeita valores altos', () => {
    expect(evaluateFraud(5000)).toBe(TransactionStatus.Rejected);
  });
});
