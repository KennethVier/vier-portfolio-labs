import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { SAVINGS_SOURCES } from '../constants/savingsConstants.js'
import { savingsFormDefaults, savingsSchema } from '../schemas/savingsSchema.js'
import {
  SAVINGS_FORM_MODE,
  resolveContributionSource,
} from '../utils/savingsContributionForm.js'

function mapSavingsToFormValues({
  currentCutoffId = null,
  mode = SAVINGS_FORM_MODE.general,
  savings = null,
  selectedGoal = null,
  selectedGoalId = null,
} = {}) {
  if (!savings) {
    const isGoalContribution = mode === SAVINGS_FORM_MODE.goalContribution && selectedGoal

    return {
      ...savingsFormDefaults,
      cutoffId: currentCutoffId ?? savingsFormDefaults.cutoffId,
      source: isGoalContribution
        ? resolveContributionSource(selectedGoal)
        : savingsFormDefaults.source,
      goalId: selectedGoalId ?? savingsFormDefaults.goalId,
    }
  }

  return {
    amount: savings.amount,
    source: savings.source ?? '',
    date: savings.date ?? savingsFormDefaults.date,
    cutoffId: savings.cutoffId ?? '',
    goalId: savings.goalId ?? '',
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
  savingsGoals = [],
  mode = SAVINGS_FORM_MODE.general,
  selectedGoal = null,
  selectedGoalId = null,
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
  const isGoalContribution =
    mode === SAVINGS_FORM_MODE.goalContribution && selectedGoal && !editingSavings
  const contributionSource = resolveContributionSource(selectedGoal)
  const formTitle = editingSavings
    ? 'Edit Savings'
    : isGoalContribution
      ? 'Add Contribution'
      : 'Add Savings'
  const formDescription = isGoalContribution
    ? `Add money toward ${selectedGoal.name}.`
    : 'Track savings set aside from available cash.'
  const submitLabel = isSaving
    ? 'Saving'
    : editingSavings
      ? 'Save Changes'
      : isGoalContribution
        ? 'Add Contribution'
        : 'Add Savings'

  useEffect(() => {
    reset(
      mapSavingsToFormValues({
        currentCutoffId,
        mode,
        savings: editingSavings,
        selectedGoal,
        selectedGoalId,
      }),
    )
  }, [currentCutoffId, editingSavings, mode, reset, selectedGoal, selectedGoalId])

  async function submitSavings(values) {
    await onSubmit(values)
    reset(
      mapSavingsToFormValues({
        currentCutoffId,
        mode,
        selectedGoal,
        selectedGoalId,
      }),
    )
  }

  const content = (
      <form className="space-y-4" onSubmit={handleSubmit(submitSavings)}>
        {isGoalContribution ? (
          <>
            <input type="hidden" {...register('source')} />
            <input type="hidden" {...register('goalId')} />
          </>
        ) : null}
        <div>
          <h2 className="font-heading text-lg font-semibold text-content">
            {formTitle}
          </h2>
          <p className="text-sm text-content-muted">
            {formDescription}
          </p>
        </div>

        {isGoalContribution ? (
          <section className="rounded border border-outline-variant bg-surface-container-low p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-label-caps uppercase text-on-surface-variant">
                  Savings Goal
                </p>
                <p className="font-semibold text-on-surface">{selectedGoal.name}</p>
              </div>
              <div>
                <p className="text-label-caps uppercase text-on-surface-variant">
                  Contribution Type
                </p>
                <p className="font-semibold text-on-surface">{contributionSource}</p>
              </div>
            </div>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              This contribution will be linked to {selectedGoal.name}.
            </p>
          </section>
        ) : null}

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
          {!isGoalContribution ? (
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
          ) : null}
          <Input
            id="savings-date"
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          {!isGoalContribution ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-content">
                Savings goal
              </span>
              <select
                className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
                {...register('goalId')}
              >
                <option value="">General Savings</option>
                {savingsGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
              {errors.goalId ? (
                <span className="mt-1 block text-xs text-error">
                  {errors.goalId.message}
                </span>
              ) : null}
            </label>
          ) : null}
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
            {submitLabel}
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
