import { describe, expect, it } from 'vitest';

import { CONTRACTS_PACKAGE } from './index';

describe('contracts package', () => {
  it('expõe o nome do pacote', () => {
    expect(CONTRACTS_PACKAGE).toBe('@biud/contracts');
  });
});
