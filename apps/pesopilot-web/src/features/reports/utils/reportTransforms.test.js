import { describe, expect, it } from 'vitest'

import {
  buildCashflowTrend,
  buildCategoryBreakdown,
  buildCutoffComparison,
  buildExpenseTrend,
  buildIncomeExpenseComparison,
  buildReportKpis,
  buildSavingsTrend,
} from './reportTransforms.js'

describe('reportTransforms', () => {
  it('groups expenses by month chronologically', () => {
    const result = buildExpenseTrend([
      { amount: 500, date: '2026-02-02' },
      { amount: 300, date: '2026-01-20' },
      { amount: 200, date: '2026-01-05' },
    ])

    expect(result).toEqual([
      { month: 'Jan 2026', expenses: 500 },
      { month: 'Feb 2026', expenses: 500 },
    ])
  })

  it('builds income vs expense monthly comparison', () => {
    const result = buildIncomeExpenseComparison({
      expenses: [
        { amount: 1000, date: '2026-01-15' },
        { amount: 250, date: '2026-02-01' },
      ],
      income: [
        { amount: 4000, date: '2026-01-01' },
        { amount: 5000, date: '2026-02-01' },
      ],
    })

    expect(result).toEqual([
      { month: 'Jan 2026', income: 4000, expenses: 1000 },
      { month: 'Feb 2026', income: 5000, expenses: 250 },
    ])
  })

  it('builds category totals and percentages', () => {
    const result = buildCategoryBreakdown(
      [
        { amount: 300, categoryId: 'food' },
        { amount: 200, categoryId: 'transport' },
        { amount: 500, categoryId: 'missing' },
      ],
      [
        { id: 'food', name: 'Food' },
        { id: 'transport', name: 'Transport' },
      ],
    )

    expect(result).toEqual([
      { name: 'Uncategorized', value: 500, percentage: 50 },
      { name: 'Food', value: 300, percentage: 30 },
      { name: 'Transport', value: 200, percentage: 20 },
    ])
  })

  it('builds running savings totals by date', () => {
    const result = buildSavingsTrend([
      { amount: 500, date: '2026-01-10' },
      { amount: 1000, date: '2026-01-01' },
      { amount: 250, date: '2026-01-10' },
    ])

    expect(result).toEqual([
      { date: '2026-01-01', savings: 1000 },
      { date: '2026-01-10', savings: 1750 },
    ])
  })

  it('calculates monthly cashflow trend', () => {
    const result = buildCashflowTrend({
      expenses: [{ amount: 1000, date: '2026-01-15' }],
      income: [{ amount: 5000, date: '2026-01-01' }],
      savings: [{ amount: 1500, date: '2026-01-20' }],
    })

    expect(result).toEqual([
      { month: 'Jan 2026', cashflow: 2500 },
    ])
  })

  it('builds cutoff comparison records', () => {
    const result = buildCutoffComparison({
      cutoffs: [
        {
          id: 1,
          name: 'First Cutoff',
          expectedIncome: 4000,
          startDate: '2026-01-01',
        },
      ],
      expenses: [{ amount: 1000, cutoffId: 1 }],
      income: [{ amount: 4500, cutoffId: 1 }],
      savings: [{ amount: 500, cutoffId: 1 }],
    })

    expect(result).toEqual([
      {
        actualIncome: 4500,
        cutoffId: 1,
        expectedIncome: 4000,
        name: 'First Cutoff',
        remainingCash: 3000,
        totalExpenses: 1000,
        totalSavings: 500,
      },
    ])
  })

  it('returns stable empty structures for empty inputs', () => {
    expect(buildReportKpis()).toEqual({
      netCashflow: 0,
      totalExpenses: 0,
      totalIncome: 0,
      totalSavings: 0,
    })
    expect(buildExpenseTrend()).toEqual([])
    expect(buildIncomeExpenseComparison()).toEqual([])
    expect(buildCategoryBreakdown()).toEqual([])
    expect(buildSavingsTrend()).toEqual([])
    expect(buildCashflowTrend()).toEqual([])
    expect(buildCutoffComparison()).toEqual([])
  })
})
