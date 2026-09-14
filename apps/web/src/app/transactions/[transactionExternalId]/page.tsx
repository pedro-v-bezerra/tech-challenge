'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { TransactionDetail } from '@/components/transaction-detail';

export default function TransactionDetailPage() {
  const params = useParams<{ transactionExternalId: string }>();
  const id = params.transactionExternalId;

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <span aria-hidden="true">←</span> Voltar
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Detalhe da transação
        </h1>
        <p className="mt-1 text-sm text-slate-500">O status reflete a avaliação em tempo real.</p>
      </header>

      <TransactionDetail id={id} />
    </main>
  );
}
