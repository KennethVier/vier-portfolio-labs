import { describe, expect, it } from 'vitest'

import { cutoffSchema } from './cutoffSchema.js'

const validCutoff = {
  name: 'June First Half',
  type: 'semi_monthly',
  startDate: '2026-06-01',
  endDate: '2026-06-15',
  expectedIncome: '25000',
  actualIncome: '',
  status: 'planned',
}

describe('cutoffSchema', () => {
  it('accepts a valid salary cutoff', () => {
    const result = cutoffSchema.parse(validCutoff)

    expect(result).toMatchObject({
      name: 'June First Half',
      type: 'semi_monthly',
      expectedIncome: 25000,
      actualIncome: null,
      status: 'planned',
    })
  })

  it('rejects missing required fields and invalid income', () => {
    const result = cutoffSchema.safeParse({
      name: '',
      type: '',
      startDate: '',
      endDate: '',
      expectedIncome: -1,
      actualIncome: -5,
      status: '',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining([
        'name',
        'type',
        'startDate',
        'endDate',
        'expectedIncome',
        'actualIncome',
        'status',
      ]),
    )
  })

  it('rejects an end date before the start date', () => {
    const result = cutoffSchema.safeParse({
      ...validCutoff,
      startDate: '2026-06-16',
      endDate: '2026-06-15',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain(
      'endDate',
    )
  })
})
