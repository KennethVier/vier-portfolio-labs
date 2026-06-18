import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import {
  CUTOFF_STATUSES,
  CUTOFF_TYPES,
  LEGACY_CUTOFF_TYPES,
} from '../constants/cutoffConstants.js'
import { cutoffFormDefaults, cutoffSchema } from '../schemas/cutoffSchema.js'
import { generateSalaryCutoffCycle } from '../services/cutoffCycle.js'

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function mapCutoffToFormValues(cutoff) {
  if (!cutoff) {
    return cutoffFormDefaults
  }

  return {
    name: cutoff.name ?? '',
    type: cutoff.type ?? cutoffFormDefaults.type,
    payday1: cutoff.payday1 ?? '',
    payday2: cutoff.payday2 ?? '',
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
    watch,
  } = useForm({
    defaultValues: cutoffFormDefaults,
    resolver: zodResolver(cutoffSchema),
  })
  const selectedType = watch('type')
  const payday1 = watch('payday1')
  const payday2 = watch('payday2')
  const isMonthly = selectedType === 'monthly'
  const isSemiMonthly = selectedType === 'semi_monthly'
  const isCustom = selectedType === 'custom'
  const isLegacyType = LEGACY_CUTOFF_TYPES.some(
    (type) => type.value === selectedType,
  )
  const generatedPreview = (() => {
    if (!isMonthly && !isSemiMonthly) {
      return null
    }

    try {
      return generateSalaryCutoffCycle({
        payday1: Number(payday1),
        payday2: Number(payday2),
        referenceDate: editingCutoff?.startDate ?? todayIsoDate(),
        type: selectedType,
      })
    } catch {
      return null
    }
  })()

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
            Define the salary-funded spending cycle used for expense grouping.
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
              {isLegacyType ? (
                <option value={selectedType} disabled>
                  Convert legacy type
                </option>
              ) : null}
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

          {isSemiMonthly ? (
            <>
              <Input
                id="cutoff-payday-1"
                label="Payday 1"
                min="1"
                max="31"
                type="number"
                error={errors.payday1?.message}
                {...register('payday1')}
              />
              <Input
                id="cutoff-payday-2"
                label="Payday 2"
                min="1"
                max="31"
                type="number"
                error={errors.payday2?.message}
                {...register('payday2')}
              />
              <p className="rounded border border-outline-variant bg-surface-container p-3 text-sm text-content-muted md:col-span-2">
                Semi-monthly cutoffs start on each payday and end the day before
                the next payday. Example: 10/25 generates June 10-24 and June
                25-July 9.
              </p>
            </>
          ) : null}

          {isMonthly ? (
            <>
              <Input
                id="cutoff-payday"
                label="Payday"
                min="1"
                max="31"
                type="number"
                error={errors.payday1?.message}
                {...register('payday1')}
              />
              <p className="rounded border border-outline-variant bg-surface-container p-3 text-sm text-content-muted md:col-span-2">
                Monthly cutoffs start on your payday and end the day before the
                next payday. Example: payday 25 generates June 25-July 24.
              </p>
            </>
          ) : null}

          {(isMonthly || isSemiMonthly) && generatedPreview ? (
            <div className="rounded border border-primary/20 bg-primary-fixed p-3 text-sm text-primary md:col-span-2">
              Generated period: {generatedPreview.startDate} to{' '}
              {generatedPreview.endDate}
            </div>
          ) : null}

          {isCustom ? (
            <>
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
              <p className="rounded border border-outline-variant bg-surface-container p-3 text-sm text-content-muted md:col-span-2">
                Custom cutoffs use manually selected start and end dates.
              </p>
            </>
          ) : null}

          {isLegacyType ? (
            <p className="rounded border border-tertiary/30 bg-tertiary-container p-3 text-sm text-tertiary md:col-span-2">
              This is a legacy cutoff type. Convert it to Semi-monthly, Monthly,
              or Custom before saving changes.
            </p>
          ) : null}

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
