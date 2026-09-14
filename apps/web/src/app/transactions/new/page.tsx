'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { TransactionForm } from '@/components/transaction-form';
import { cardClass } from '@/lib/ui';

export default function NewTransactionPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-lg px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <span aria-hidden="true">←</span> Voltar
      </Link>

      <header className="mt-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Nova transação</h1>
        <p className="mt-1 text-sm text-slate-500">
          A transação nasce pendente e é avaliada automaticamente em seguida.
        </p>
      </header>

      <div className={`${cardClass} mt-6 p-6`}>
        <TransactionForm
          onSuccess={(created) => router.push(`/transactions/${created.transactionExternalId}`)}
        />
      </div>
    </main>
  );
}
