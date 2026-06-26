import { describe, expect, it } from 'vitest'

import { savingsGoalSchema } from './savingsGoalSchema.js'

describe('savingsGoalSchema', () => {
  it('accepts a valid savings goal', () => {
    expect(
      savingsGoalSchema.parse({
        name: 'Emergency Fund',
        targetAmount: 100000,
        targetDate: '2026-12-31',
        priority: 'high',
        status: 'active',
        note: 'Safety net',
      }),
    ).toMatchObject({
      name: 'Emergency Fund',
      priority: 'high',
      status: 'active',
      targetAmount: 100000,
    })
  })

  it('requires a goal name', () => {
    expect(() =>
      savingsGoalSchema.parse({
        name: '',
        priority: 'medium',
        status: 'active',
      }),
    ).toThrow()
  })

  it('rejects invalid target amount, priority, and status', () => {
    expect(() =>
      savingsGoalSchema.parse({
        name: 'Trip',
        targetAmount: 0,
        priority: 'urgent',
        status: 'started',
      }),
    ).toThrow()
  })
})
