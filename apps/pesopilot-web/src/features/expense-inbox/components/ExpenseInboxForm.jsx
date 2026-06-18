import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { PAYMENT_METHODS } from '@/features/expenses/constants/expenseConstants.js'

import { INBOX_STATUS } from '../constants/expenseInboxConstants.js'
import {
  expenseInboxFormDefaults,
  expenseInboxSchema,
} from '../schemas/expenseInboxSchema.js'

function mapRecordToFormValues(record) {
  if (!record) {
    return expenseInboxFormDefaults
  }

  return {
    amount: record.amount ?? '',
    merchant: record.merchant ?? '',
    note: record.note ?? '',
    rawText: record.rawText ?? '',
    source: record.source ?? 'manual_input',
    status: record.status ?? INBOX_STATUS.pending,
    suggestedCategoryId: record.suggestedCategoryId ?? '',
    suggestedPaymentMethod: record.suggestedPaymentMethod ?? '',
    transactionDate:
      record.transactionDate ??
      record.createdAt?.slice(0, 10) ??
      expenseInboxFormDefaults.transactionDate,
  }
}

export function ExpenseInboxForm({
  categories,
  isSaving,
  onApprove,
  onCancel,
  onSubmit,
  record,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: expenseInboxFormDefaults,
    resolver: zodResolver(expenseInboxSchema),
  })

  useEffect(() => {
    reset(mapRecordToFormValues(record))
  }, [record, reset])

  async function submitRecord(values) {
    await onSubmit(values)
  }

  async function approveRecord() {
    await handleSubmit(onApprove)()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitRecord)}>
      <input type="hidden" {...register('rawText')} />
      <input type="hidden" {...register('status')} />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          id="inbox-amount"
          label="Amount"
          min="0"
          step="0.01"
          type="number"
          error={errors.amount?.message}
          {...register('amount')}
        />
        <Input
          id="inbox-merchant"
          label="Merchant"
          error={errors.merchant?.message}
          {...register('merchant')}
        />

        <label className="block">
          <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
            Category
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register('suggestedCategoryId')}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.suggestedCategoryId ? (
            <span className="mt-1 block text-xs text-error">
              {errors.suggestedCategoryId.message}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
            Payment Method
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register('suggestedPaymentMethod')}
          >
            <option value="">Select method</option>
            {PAYMENT_METHODS.map((paymentMethod) => (
              <option key={paymentMethod} value={paymentMethod}>
                {paymentMethod}
              </option>
            ))}
          </select>
        </label>

        <Input
          id="inbox-date"
          label="Date"
          type="date"
          error={errors.transactionDate?.message}
          {...register('transactionDate')}
        />
        <Input
          id="inbox-source"
          label="Source"
          error={errors.source?.message}
          {...register('source')}
        />

        <label className="block md:col-span-2">
          <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
            Note
          </span>
          <textarea
            className="min-h-20 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register('note')}
          />
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="secondary" disabled={isSaving}>
          Save Edits
        </Button>
        <Button type="button" disabled={isSaving} onClick={approveRecord}>
          Approve
        </Button>
      </div>
    </form>
  )
}
