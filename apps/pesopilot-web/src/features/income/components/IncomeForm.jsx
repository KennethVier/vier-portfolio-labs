import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { INCOME_SOURCES } from '../constants/incomeConstants.js'
import { incomeFormDefaults, incomeSchema } from '../schemas/incomeSchema.js'

function mapIncomeToFormValues(income) {
  if (!income) {
    return incomeFormDefaults
  }

  return {
    amount: income.amount,
    source: income.source ?? '',
    date: income.date ?? incomeFormDefaults.date,
    cutoffId: income.cutoffId ?? '',
    note: income.note ?? '',
  }
}

export function IncomeForm({
  editingIncome,
  isSaving,
  onCancel,
  onSubmit,
  salaryCutoffs,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: incomeFormDefaults,
    resolver: zodResolver(incomeSchema),
  })

  useEffect(() => {
    reset(mapIncomeToFormValues(editingIncome))
  }, [editingIncome, reset])

  async function submitIncome(values) {
    await onSubmit(values)
    reset(incomeFormDefaults)
  }

  return (
      <form className="space-y-4" onSubmit={handleSubmit(submitIncome)}>
        <div>
          <h2 className="font-heading text-lg font-semibold text-content">
            {editingIncome ? 'Edit Income' : 'Add Income'}
          </h2>
          <p className="text-sm text-content-muted">
            Track money entering your control.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id="income-amount"
            label="Amount"
            min="0"
            step="0.01"
            type="number"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Source
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('source')}
            >
              <option value="">Select source</option>
              {INCOME_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {errors.source ? (
              <span className="mt-1 block text-xs text-error">
                {errors.source.message}
              </span>
            ) : null}
          </label>
          <Input
            id="income-date"
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Salary cutoff
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('cutoffId')}
            >
              <option value="">No cutoff</option>
              {salaryCutoffs.map((cutoff) => (
                <option key={cutoff.id} value={cutoff.id}>
                  {cutoff.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-content">Note</span>
            <textarea
              className="min-h-20 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register('note')}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving' : editingIncome ? 'Save Changes' : 'Add Income'}
          </Button>
          {editingIncome ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
  )
}
