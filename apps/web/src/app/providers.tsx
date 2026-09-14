'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { TransactionStreamListener } from '@/components/transaction-stream-listener';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionStreamListener />
      {children}
    </QueryClientProvider>
  );
}
