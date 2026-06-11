import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import {
  EMOTION_TAGS,
  EXPENSE_SOURCE_MANUAL,
  PAYMENT_METHODS,
} from '../constants/expenseConstants.js'
import { expenseFormDefaults, expenseSchema } from '../schemas/expenseSchema.js'

function mapExpenseToFormValues(expense) {
  if (!expense) {
    return expenseFormDefaults
  }

  return {
    amount: expense.amount,
    merchant: expense.merchant ?? '',
    categoryId: expense.categoryId ?? '',
    paymentMethod: expense.paymentMethod ?? '',
    date: expense.date ?? expenseFormDefaults.date,
    cutoffId: expense.cutoffId ?? '',
    emotionTag: expense.emotionTag ?? '',
    note: expense.note ?? '',
    source: expense.source ?? EXPENSE_SOURCE_MANUAL,
  }
}

export function ExpenseForm({
  categories,
  editingExpense,
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
    defaultValues: expenseFormDefaults,
    resolver: zodResolver(expenseSchema),
  })

  useEffect(() => {
    reset(mapExpenseToFormValues(editingExpense))
  }, [editingExpense, reset])

  async function submitExpense(values) {
    await onSubmit({
      ...values,
      source: EXPENSE_SOURCE_MANUAL,
    })
    reset(expenseFormDefaults)
  }

  const hasCategories = categories.length > 0

  return (
    <Card className="p-4">
      <form className="space-y-4" onSubmit={handleSubmit(submitExpense)}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-content">
              {editingExpense ? 'Edit Expense' : 'Add Expense'}
            </h2>
            <p className="text-sm text-content-muted">
              Manual expense entry
            </p>
          </div>
        </div>

        {!hasCategories ? (
          <div className="rounded border border-outline-variant bg-surface-container p-3 text-sm text-content-muted">
            Seeded categories are required before adding expenses.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            id="expense-amount"
            label="Amount"
            min="0"
            step="0.01"
            type="number"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            id="expense-merchant"
            label="Merchant"
            error={errors.merchant?.message}
            {...register('merchant')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Category
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              disabled={!hasCategories}
              {...register('categoryId')}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <span className="mt-1 block text-xs text-error">
                {errors.categoryId.message}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Payment method
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('paymentMethod')}
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
            id="expense-date"
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Emotion tag
            </span>
            <select
              className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
              {...register('emotionTag')}
            >
              <option value="">Select tag</option>
              {EMOTION_TAGS.map((emotionTag) => (
                <option key={emotionTag} value={emotionTag}>
                  {emotionTag}
                </option>
              ))}
            </select>
          </label>
          {salaryCutoffs.length > 0 ? (
            <label className="block md:col-span-2">
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
          ) : null}
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-content">Note</span>
            <textarea
              className="min-h-20 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register('note')}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving || !hasCategories}>
            {isSaving ? 'Saving' : editingExpense ? 'Save Changes' : 'Add Expense'}
          </Button>
          {editingExpense ? (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  )
}
