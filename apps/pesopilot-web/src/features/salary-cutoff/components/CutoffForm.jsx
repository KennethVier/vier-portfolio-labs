import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { CUTOFF_STATUSES, CUTOFF_TYPES } from '../constants/cutoffConstants.js'
import { cutoffFormDefaults, cutoffSchema } from '../schemas/cutoffSchema.js'

function mapCutoffToFormValues(cutoff) {
  if (!cutoff) {
    return cutoffFormDefaults
  }

  return {
    name: cutoff.name ?? '',
    type: cutoff.type ?? cutoffFormDefaults.type,
    startDate: cutoff.startDate ?? cutoffFormDefaults.startDate,
    endDate: cutoff.endDate ?? cutoffFormDefaults.endDate,
    expectedIncome: cutoff.expectedIncome ?? '',
    status: cutoff.status ?? cutoffFormDefaults.status,
  }
}

export function CutoffForm({
  editingCutoff,
  framed = true,
  isSaving,
  onCancel,
  onSubmit,
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm({
    defaultValues: cutoffFormDefaults,
    resolver: zodResolver(cutoffSchema),
  })

  useEffect(() => {
    reset(mapCutoffToFormValues(editingCutoff))
  }, [editingCutoff, reset])

  async function submitCutoff(values) {
    await onSubmit(values)
    reset(cutoffFormDefaults)
  }

  const content = (
      <form className="space-y-4" onSubmit={handleSubmit(submitCutoff)}>
        <div>
          <h2 className="font-heading text-lg font-semibold text-content">
            {editingCutoff ? 'Edit Salary Cutoff' : 'Create Salary Cutoff'}
          </h2>
          <p className="text-sm text-content-muted">
            Define the local period used for expense grouping.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id="cutoff-name"
            label="Name"
            error={errors.name?.message}
            {...register('name')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Type
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('type')}
            >
              {CUTOFF_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type ? (
              <span className="mt-1 block text-xs text-error">
                {errors.type.message}
              </span>
            ) : null}
          </label>
          <Input
            id="cutoff-start-date"
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            id="cutoff-end-date"
            label="End date"
            type="date"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
          <Input
            id="cutoff-expected-income"
            label="Expected income"
            min="0"
            step="0.01"
            type="number"
            error={errors.expectedIncome?.message}
            {...register('expectedIncome')}
          />
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-content">
              Status
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('status')}
            >
              {CUTOFF_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status ? (
              <span className="mt-1 block text-xs text-error">
                {errors.status.message}
              </span>
            ) : null}
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving' : editingCutoff ? 'Save Changes' : 'Create Cutoff'}
          </Button>
          {editingCutoff ? (
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
