import { describe, expect, it } from 'vitest'

import { cutoffSchema } from './cutoffSchema.js'

const validSemiMonthlyCutoff = {
  name: 'Salary Cycle',
  type: 'semi_monthly',
  payday1: '10',
  payday2: '25',
  expectedIncome: '25000',
  status: 'planned',
}

describe('cutoffSchema', () => {
  it('accepts supported cutoff types', () => {
    expect(cutoffSchema.parse(validSemiMonthlyCutoff)).toMatchObject({
      payday1: 10,
      payday2: 25,
      type: 'semi_monthly',
    })

    expect(
      cutoffSchema.parse({
        ...validSemiMonthlyCutoff,
        payday1: '25',
        payday2: '',
        type: 'monthly',
      }),
    ).toMatchObject({
      payday1: 25,
      payday2: null,
      type: 'monthly',
    })

    expect(
      cutoffSchema.parse({
        ...validSemiMonthlyCutoff,
        payday1: '10',
        payday2: '25',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        type: 'custom',
      }),
    ).toMatchObject({
      payday1: null,
      payday2: null,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      type: 'custom',
    })
  })

  it('rejects weekly and irregular as newly saved cutoff types', () => {
    expect(
      cutoffSchema.safeParse({
        ...validSemiMonthlyCutoff,
        type: 'weekly',
      }).success,
    ).toBe(false)

    expect(
      cutoffSchema.safeParse({
        ...validSemiMonthlyCutoff,
        type: 'irregular',
      }).success,
    ).toBe(false)
  })

  it('validates semi-monthly paydays', () => {
    const missingResult = cutoffSchema.safeParse({
      ...validSemiMonthlyCutoff,
      payday1: '',
      payday2: '',
    })

    expect(missingResult.success).toBe(false)
    expect(missingResult.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['payday1', 'payday2']),
    )

    const orderedResult = cutoffSchema.safeParse({
      ...validSemiMonthlyCutoff,
      payday1: '25',
      payday2: '10',
    })

    expect(orderedResult.success).toBe(false)
    expect(orderedResult.error.issues.map((issue) => issue.path.join('.'))).toContain(
      'payday2',
    )
  })

  it('validates monthly payday', () => {
    const result = cutoffSchema.safeParse({
      ...validSemiMonthlyCutoff,
      payday1: '',
      payday2: '25',
      type: 'monthly',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain(
      'payday1',
    )
  })

  it('requires valid custom dates and ignores payday fields', () => {
    const missingResult = cutoffSchema.safeParse({
      ...validSemiMonthlyCutoff,
      startDate: '',
      endDate: '',
      type: 'custom',
    })

    expect(missingResult.success).toBe(false)
    expect(missingResult.error.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['startDate', 'endDate']),
    )

    const orderedResult = cutoffSchema.safeParse({
      ...validSemiMonthlyCutoff,
      startDate: '2026-06-30',
      endDate: '2026-06-01',
      type: 'custom',
    })

    expect(orderedResult.success).toBe(false)
    expect(orderedResult.error.issues.map((issue) => issue.path.join('.'))).toContain(
      'endDate',
    )
  })
})
