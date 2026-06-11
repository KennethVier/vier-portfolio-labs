import { describe, expect, it } from 'vitest'

import { expenseSchema } from './expenseSchema.js'

describe('expenseSchema', () => {
  it('accepts a valid manual expense', () => {
    const result = expenseSchema.parse({
      amount: '250.50',
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'GCash',
      date: '2026-06-11',
      emotionTag: 'Normal',
      note: '',
      source: 'manual',
    })

    expect(result).toMatchObject({
      amount: 250.5,
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'GCash',
      date: '2026-06-11',
      emotionTag: 'Normal',
      note: null,
      source: 'manual',
    })
  })

  it('rejects missing required fields and non-positive amount', () => {
    const result = expenseSchema.safeParse({
      amount: 0,
      categoryId: '',
      date: '',
      source: '',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['amount', 'categoryId', 'date', 'source']),
    )
  })
})
