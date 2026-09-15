import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { TransactionStreamProvider } from '@/lib/transaction-stream';

/** Renderiza um componente com os providers da app (retry desligado para estados imediatos). */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TransactionStreamProvider>{children}</TransactionStreamProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
