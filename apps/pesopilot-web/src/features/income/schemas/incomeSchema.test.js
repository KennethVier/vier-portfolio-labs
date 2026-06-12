import { describe, expect, it } from 'vitest'

import { incomeSchema } from './incomeSchema.js'

describe('incomeSchema', () => {
  it('accepts a valid income record', () => {
    const result = incomeSchema.parse({
      amount: '25000.50',
      source: 'Salary',
      date: '2026-06-15',
      cutoffId: '',
      note: '',
    })

    expect(result).toMatchObject({
      amount: 25000.5,
      source: 'Salary',
      date: '2026-06-15',
      cutoffId: null,
      note: null,
    })
  })

  it('rejects missing required fields and non-positive amount', () => {
    const result = incomeSchema.safeParse({
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
