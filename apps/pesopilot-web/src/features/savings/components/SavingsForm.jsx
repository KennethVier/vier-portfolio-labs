import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { SAVINGS_SOURCES } from '../constants/savingsConstants.js'
import { savingsFormDefaults, savingsSchema } from '../schemas/savingsSchema.js'

function mapSavingsToFormValues(savings, currentCutoffId = null) {
  if (!savings) {
    return {
      ...savingsFormDefaults,
      cutoffId: currentCutoffId ?? savingsFormDefaults.cutoffId,
    }
  }

  return {
    amount: savings.amount,
    source: savings.source ?? '',
    date: savings.date ?? savingsFormDefaults.date,
    cutoffId: savings.cutoffId ?? '',
    note: savings.note ?? '',
  }
}

export function SavingsForm({
  currentCutoffId = null,
  editingSavings,
  framed = true,
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
    defaultValues: savingsFormDefaults,
    resolver: zodResolver(savingsSchema),
  })

  useEffect(() => {
    reset(mapSavingsToFormValues(editingSavings, currentCutoffId))
  }, [currentCutoffId, editingSavings, reset])

  async function submitSavings(values) {
    await onSubmit(values)
    reset(mapSavingsToFormValues(null, currentCutoffId))
  }

  const content = (
      <form className="space-y-4" onSubmit={handleSubmit(submitSavings)}>
        <div>
          <h2 className="font-heading text-lg font-semibold text-content">
            {editingSavings ? 'Edit Savings' : 'Add Savings'}
          </h2>
          <p className="text-sm text-content-muted">
            Track savings set aside from available cash.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id="savings-amount"
            label="Amount"
            min="0"
            step="0.01"
            type="number"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Type
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('source')}
            >
              <option value="">Select type</option>
              {SAVINGS_SOURCES.map((source) => (
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
            id="savings-date"
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
            {!editingSavings && currentCutoffId ? (
              <span className="mt-1 block text-xs text-content-muted">
                Current cutoff is selected automatically for new records.
              </span>
            ) : null}
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
            {isSaving ? 'Saving' : editingSavings ? 'Save Changes' : 'Add Savings'}
          </Button>
          {editingSavings ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
  )

  if (!framed) {
    return content
  }

  return (
    <Card className="p-4">
      {content}
    </Card>
  )
}
