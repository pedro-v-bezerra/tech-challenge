'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createTransaction } from '@/lib/api';
import { TRANSFER_TYPES } from '@/lib/transaction-types';

const schema = z.object({
  accountExternalIdDebit: z.uuid('Informe um UUID válido'),
  accountExternalIdCredit: z.uuid('Informe um UUID válido'),
  transferTypeId: z.number('Selecione um tipo').int().positive('Selecione um tipo'),
  value: z.number('Informe um valor').positive('O valor deve ser positivo'),
});

type FormValues = z.infer<typeof schema>;

const fieldClass = 'rounded border border-zinc-300 bg-white px-3 py-2 text-sm';
const labelClass = 'flex flex-col gap-1 text-sm font-medium';
const errorClass = 'text-xs font-normal text-red-700';

export default function NewTransactionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      router.push(`/transactions/${created.transactionExternalId}`);
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <main className="mx-auto max-w-lg p-6">
      <Link href="/" className="text-sm text-blue-700 underline">
        ← Voltar
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Nova transação</h1>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <label className={labelClass}>
          Conta de débito (UUID)
          <input className={fieldClass} {...register('accountExternalIdDebit')} />
          {errors.accountExternalIdDebit && (
            <span className={errorClass}>{errors.accountExternalIdDebit.message}</span>
          )}
        </label>

        <label className={labelClass}>
          Conta de crédito (UUID)
          <input className={fieldClass} {...register('accountExternalIdCredit')} />
          {errors.accountExternalIdCredit && (
            <span className={errorClass}>{errors.accountExternalIdCredit.message}</span>
          )}
        </label>

        <label className={labelClass}>
          Tipo
          <select
            className={fieldClass}
            defaultValue=""
            {...register('transferTypeId', { valueAsNumber: true })}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {TRANSFER_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.transferTypeId && (
            <span className={errorClass}>{errors.transferTypeId.message}</span>
          )}
        </label>

        <label className={labelClass}>
          Valor
          <input
            type="number"
            step="0.01"
            className={fieldClass}
            {...register('value', { valueAsNumber: true })}
          />
          {errors.value && <span className={errorClass}>{errors.value.message}</span>}
        </label>

        {mutation.isError && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {mutation.error instanceof Error ? mutation.error.message : 'Falha ao criar.'}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {mutation.isPending ? 'Criando…' : 'Criar transação'}
        </button>
      </form>
    </main>
  );
}
