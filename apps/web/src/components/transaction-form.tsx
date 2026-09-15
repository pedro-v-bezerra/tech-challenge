'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createTransaction, type Transaction } from '@/lib/api';
import { TRANSFER_TYPES } from '@/lib/transaction-types';
import { controlClass, primaryButtonClass } from '@/lib/ui';

const schema = z.object({
  accountExternalIdDebit: z.uuid('Informe um UUID válido'),
  accountExternalIdCredit: z.uuid('Informe um UUID válido'),
  transferTypeId: z.number('Selecione um tipo').int().positive('Selecione um tipo'),
  value: z.number('Informe um valor').positive('O valor deve ser positivo'),
});

type FormValues = z.infer<typeof schema>;

const labelClass = 'block text-sm font-medium text-slate-700';
const errorClass = 'text-xs text-red-600';

function fieldClass(hasError: boolean): string {
  return `${controlClass} w-full ${
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''
  }`;
}

/** Formulário de criação reutilizado pela rota /transactions/new e pelo modal da listagem. */
export function TransactionForm({ onSuccess }: { onSuccess: (created: Transaction) => void }) {
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
      await queryClient.invalidateQueries({ queryKey: ['count'] });
      onSuccess(created);
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="debit" className={labelClass}>
          Conta de débito (UUID)
        </label>
        <input
          id="debit"
          className={fieldClass(Boolean(errors.accountExternalIdDebit))}
          placeholder="00000000-0000-0000-0000-000000000000"
          {...register('accountExternalIdDebit')}
        />
        {errors.accountExternalIdDebit && (
          <p className={errorClass}>{errors.accountExternalIdDebit.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="credit" className={labelClass}>
          Conta de crédito (UUID)
        </label>
        <input
          id="credit"
          className={fieldClass(Boolean(errors.accountExternalIdCredit))}
          placeholder="00000000-0000-0000-0000-000000000000"
          {...register('accountExternalIdCredit')}
        />
        {errors.accountExternalIdCredit && (
          <p className={errorClass}>{errors.accountExternalIdCredit.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="tipo" className={labelClass}>
            Tipo
          </label>
          <select
            id="tipo"
            className={fieldClass(Boolean(errors.transferTypeId))}
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
          {errors.transferTypeId && <p className={errorClass}>{errors.transferTypeId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="valor" className={labelClass}>
            Valor
          </label>
          <input
            id="valor"
            type="number"
            step="0.01"
            className={fieldClass(Boolean(errors.value))}
            placeholder="0,00"
            {...register('value', { valueAsNumber: true })}
          />
          {errors.value && <p className={errorClass}>{errors.value.message}</p>}
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Transações acima de <span className="font-medium text-slate-700">R$ 1.000,00</span> são
        rejeitadas automaticamente.
      </p>

      {mutation.isError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {mutation.error instanceof Error ? mutation.error.message : 'Falha ao criar.'}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className={`${primaryButtonClass} w-full`}
      >
        {mutation.isPending ? 'Criando…' : 'Criar transação'}
      </button>
    </form>
  );
}
