import { describe, expect, it } from 'vitest'

import { savingsSchema } from './savingsSchema.js'

describe('savingsSchema', () => {
  it('accepts a valid savings record', () => {
    const result = savingsSchema.parse({
      amount: '5000.50',
      source: 'Emergency Fund',
      date: '2026-06-15',
      cutoffId: '',
      note: '',
    })

    expect(result).toMatchObject({
      amount: 5000.5,
      source: 'Emergency Fund',
      date: '2026-06-15',
      cutoffId: null,
      note: null,
    })
  })

  it('accepts Investment as a normal savings source label', () => {
    const result = savingsSchema.parse({
      amount: 2500,
      source: 'Investment',
      date: '2026-06-16',
      cutoffId: '',
      note: 'Index fund allocation label only',
    })

    expect(result).toMatchObject({
      amount: 2500,
      source: 'Investment',
      note: 'Index fund allocation label only',
    })
  })

  it('rejects missing required fields and non-positive amount', () => {
    const result = savingsSchema.safeParse({
      amount: 0,
      source: '',
      date: '',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['amount', 'source', 'date']),
    )
  })
})
