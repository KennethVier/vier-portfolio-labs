import { z } from 'zod'

export const SAVINGS_GOAL_PRIORITIES = ['high', 'medium', 'low']
export const SAVINGS_GOAL_STATUSES = ['active', 'completed', 'paused', 'archived']

const optionalAmount = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z.coerce.number().positive('Target amount must be greater than zero').nullable(),
)

const optionalString = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().trim().nullable(),
)

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required'),
  targetAmount: optionalAmount,
  targetDate: optionalString,
  priority: z.enum(SAVINGS_GOAL_PRIORITIES, {
    errorMap: () => ({ message: 'Priority is required' }),
  }),
  status: z.enum(SAVINGS_GOAL_STATUSES, {
    errorMap: () => ({ message: 'Status is required' }),
  }),
  note: optionalString,
})

export const savingsGoalFormDefaults = {
  name: '',
  targetAmount: '',
  targetDate: '',
  priority: 'medium',
  status: 'active',
  note: '',
}
