'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { AppShell } from '@/components/app-shell';
import { TransactionStreamProvider } from '@/lib/transaction-stream';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionStreamProvider>
        <AppShell>{children}</AppShell>
      </TransactionStreamProvider>
    </QueryClientProvider>
  );
}
