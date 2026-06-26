import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

import {
  SAVINGS_GOAL_PRIORITIES,
  SAVINGS_GOAL_STATUSES,
  savingsGoalFormDefaults,
  savingsGoalSchema,
} from '../schemas/savingsGoalSchema.js'

function mapGoalToFormValues(goal) {
  if (!goal) {
    return savingsGoalFormDefaults
  }

  return {
    name: goal.name ?? '',
    targetAmount: goal.targetAmount ?? '',
    targetDate: goal.targetDate ?? '',
    priority: goal.priority ?? 'medium',
    status: goal.status ?? 'active',
    note: goal.note ?? '',
  }
}

export function SavingsGoalForm({
  editingGoal,
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
    defaultValues: savingsGoalFormDefaults,
    resolver: zodResolver(savingsGoalSchema),
  })

  useEffect(() => {
    reset(mapGoalToFormValues(editingGoal))
  }, [editingGoal, reset])

  async function submitGoal(values) {
    await onSubmit(values)
    reset(savingsGoalFormDefaults)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitGoal)}>
      <div>
        <h2 className="font-heading text-lg font-semibold text-content">
          {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </h2>
        <p className="text-sm text-content-muted">
          Goals track lifetime progress; contributions remain cutoff-based.
        </p>
      </div>

      <Input
        id="goal-name"
        label="Goal name"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          id="goal-target-amount"
          label="Target amount"
          min="0"
          step="0.01"
          type="number"
          error={errors.targetAmount?.message}
          {...register('targetAmount')}
        />
        <Input
          id="goal-target-date"
          label="Target date"
          type="date"
          error={errors.targetDate?.message}
          {...register('targetDate')}
        />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-content">
            Priority
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm capitalize"
            {...register('priority')}
          >
            {SAVINGS_GOAL_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          {errors.priority ? (
            <span className="mt-1 block text-xs text-error">
              {errors.priority.message}
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-content">
            Status
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm capitalize"
            {...register('status')}
          >
            {SAVINGS_GOAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
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

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">Notes</span>
        <textarea
          className="min-h-20 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          {...register('note')}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving' : editingGoal ? 'Save Goal' : 'Create Goal'}
        </Button>
        {editingGoal ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
