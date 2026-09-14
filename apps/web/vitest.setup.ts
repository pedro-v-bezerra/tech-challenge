import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import '@testing-library/jest-dom/vitest';

// Sem `globals`, o cleanup automático do Testing Library não é registrado — fazemos manualmente.
afterEach(() => {
  cleanup();
});
