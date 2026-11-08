import { zodResolver } from '@hookform/resolvers/zod'
import { describe, expect, it } from 'vitest'
import { expenseSchema, expenseFormDefaults } from '@/features/expenses/schemas/expenseSchema.js'
import { expenseInboxSchema, expenseInboxFormDefaults } from '@/features/expense-inbox/schemas/expenseInboxSchema.js'
import { incomeSchema, incomeFormDefaults } from '@/features/income/schemas/incomeSchema.js'
import { savingsSchema, savingsFormDefaults } from '@/features/savings/schemas/savingsSchema.js'
import { savingsGoalSchema, savingsGoalFormDefaults } from '@/features/savings/schemas/savingsGoalSchema.js'
import { cutoffSchema, cutoffFormDefaults } from '@/features/salary-cutoff/schemas/cutoffSchema.js'

const resolve = (schema, input) => zodResolver(schema)(input, {}, {
  fields: {}, shouldUseNativeValidation: false, criteriaMode: 'all',
})

describe('Zod 4 and existing React Hook Form resolver contracts', () => {
  it.each([
    ['income', incomeSchema, incomeFormDefaults, 'source', 'Source is required'],
    ['savings', savingsSchema, savingsFormDefaults, 'source', 'Type is required'],
    ['goal priority', savingsGoalSchema, savingsGoalFormDefaults, 'priority', 'Priority is required'],
    ['goal status', savingsGoalSchema, savingsGoalFormDefaults, 'status', 'Status is required'],
    ['cutoff type', cutoffSchema, cutoffFormDefaults, 'type', 'Type is required'],
    ['cutoff status', cutoffSchema, cutoffFormDefaults, 'status', 'Status is required'],
  ])('retains the %s field error for empty, missing and unknown options', async (_, schema, defaults, field, message) => {
    for (const value of ['', undefined, 'unsupported']) {
      const result = await resolve(schema, { ...defaults, [field]: value })
      expect(result.values).toEqual({})
      expect(result.errors[field].message).toBe(message)
    }
  })

  it('returns custom cutoff money errors and cross-field payday errors without rejecting the resolver', async () => {
    const valid = { ...cutoffFormDefaults, name: 'Salary', payday1: '10', payday2: '25', expectedIncome: '25000' }
    for (const expectedIncome of ['invalid', undefined, '-1', Infinity]) {
      const result = await resolve(cutoffSchema, { ...valid, expectedIncome })
      expect(result.errors.expectedIncome.message).toBe('Expected income must be zero or greater')
    }
    const result = await resolve(cutoffSchema, { ...valid, payday1: '25', payday2: '10' })
    expect(result.errors.payday2.message).toBe('Payday 1 must be less than Payday 2')
  })

  it.each([
    ['expense', expenseSchema, { ...expenseFormDefaults, amount: '199.99', categoryId: 'food', source: undefined },
      { amount: 199.99, cutoffId: null, paymentMethod: null, note: null, source: 'manual' }],
    ['inbox', expenseInboxSchema, { ...expenseInboxFormDefaults, amount: '199.99', merchant: ' Shop ', suggestedCategoryId: 'food' },
      { amount: 199.99, merchant: 'Shop', merchantRuleId: null, suggestedPaymentMethod: null, note: null }],
    ['income', incomeSchema, { ...incomeFormDefaults, amount: '199.99', source: 'Salary', cutoffId: '42' },
      { amount: 199.99, cutoffId: 42, note: null }],
    ['savings', savingsSchema, { ...savingsFormDefaults, amount: '199.99', source: 'General Savings', cutoffId: '42', goalId: '7' },
      { amount: 199.99, cutoffId: 42, goalId: 7, note: null }],
    ['goal', savingsGoalSchema, { ...savingsGoalFormDefaults, name: ' Trip ' },
      { name: 'Trip', targetAmount: null, targetDate: null, note: null }],
    ['cutoff', cutoffSchema, { ...cutoffFormDefaults, name: ' Month ', type: 'monthly', payday1: '25', payday2: '10', expectedIncome: '' },
      { name: 'Month', payday1: 25, payday2: null, expectedIncome: 0, startDate: null, endDate: null }],
  ])('preserves %s coercion, defaults and transforms in submitted values', async (_, schema, input, expected) => {
    const result = await resolve(schema, input)
    expect(result.errors).toEqual({})
    expect(result.values).toMatchObject(expected)
  })
})
