import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';

// jsdom não implementa EventSource; um stub inerte permite montar o provider de stream nos testes.
class MockEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {}
}
vi.stubGlobal('EventSource', MockEventSource);

// Sem `globals`, o cleanup automático do Testing Library não é registrado — fazemos manualmente.
afterEach(() => {
  cleanup();
});
