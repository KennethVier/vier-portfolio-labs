import { describe, expect, it } from 'vitest'

import {
  buildCashflowTrend,
  buildCategoryBreakdown,
  buildCutoffComparison,
  buildExpenseTrend,
  buildIncomeExpenseComparison,
  buildReportKpis,
  buildSavingsTrend,
  filterRecordsForReportScope,
  padSinglePointCashflowTrend,
  padSinglePointSavingsTrend,
  REPORT_SCOPES,
  selectCutoffsForReportScope,
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
        isHighlighted: false,
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

  it('filters scoped records for all data, current cutoff, and specific cutoff', () => {
    const records = {
      currentCutoff: { id: 2 },
      expenses: [
        { amount: 100, cutoffId: 1 },
        { amount: 200, cutoffId: 2 },
        { amount: 300, cutoffId: null },
      ],
      income: [
        { amount: 1000, cutoffId: 2 },
        { amount: 500, cutoffId: 3 },
      ],
      savings: [
        { amount: 50, cutoffId: 2 },
        { amount: 75, cutoffId: 1 },
      ],
    }

    expect(filterRecordsForReportScope({
      ...records,
      scope: REPORT_SCOPES.all,
    })).toMatchObject({
      expenses: records.expenses,
      income: records.income,
      savings: records.savings,
    })
    expect(filterRecordsForReportScope({
      ...records,
      scope: REPORT_SCOPES.currentCutoff,
    })).toEqual({
      expenses: [{ amount: 200, cutoffId: 2 }],
      income: [{ amount: 1000, cutoffId: 2 }],
      savings: [{ amount: 50, cutoffId: 2 }],
    })
    expect(filterRecordsForReportScope({
      ...records,
      scope: REPORT_SCOPES.specificCutoff,
      selectedCutoffId: 1,
    })).toEqual({
      expenses: [{ amount: 100, cutoffId: 1 }],
      income: [],
      savings: [{ amount: 75, cutoffId: 1 }],
    })
  })

  it('returns empty scoped records when current or selected cutoff is missing', () => {
    const records = {
      expenses: [{ amount: 100, cutoffId: 1 }],
      income: [{ amount: 200, cutoffId: 1 }],
      savings: [{ amount: 50, cutoffId: 1 }],
    }

    expect(filterRecordsForReportScope({
      ...records,
      currentCutoff: null,
      scope: REPORT_SCOPES.currentCutoff,
    })).toEqual({
      expenses: [],
      income: [],
      savings: [],
    })
    expect(filterRecordsForReportScope({
      ...records,
      scope: REPORT_SCOPES.specificCutoff,
      selectedCutoffId: null,
    })).toEqual({
      expenses: [],
      income: [],
      savings: [],
    })
  })

  it('filters both income and expenses before building income vs expense chart data', () => {
    const scopedRecords = filterRecordsForReportScope({
      currentCutoff: { id: 2 },
      expenses: [
        { amount: 100, cutoffId: 1, date: '2026-01-10' },
        { amount: 200, cutoffId: 2, date: '2026-01-10' },
      ],
      income: [
        { amount: 1000, cutoffId: 2, date: '2026-01-01' },
        { amount: 5000, cutoffId: 1, date: '2026-01-01' },
      ],
      scope: REPORT_SCOPES.currentCutoff,
      savings: [],
    })

    expect(buildIncomeExpenseComparison(scopedRecords)).toEqual([
      { month: 'Jan 2026', income: 1000, expenses: 200 },
    ])
  })

  it('selects cutoff comparison rows by report scope', () => {
    const cutoffs = [
      { id: 1, name: 'Previous', startDate: '2026-05-25' },
      { id: 2, name: 'Selected', startDate: '2026-06-25' },
      { id: 3, name: 'Next', startDate: '2026-07-25' },
      { id: 4, name: 'Future', startDate: '2026-08-25' },
    ]

    expect(selectCutoffsForReportScope({
      cutoffs,
      scope: REPORT_SCOPES.all,
    })).toEqual(cutoffs)
    expect(selectCutoffsForReportScope({
      currentCutoff: { id: 2 },
      cutoffs,
      scope: REPORT_SCOPES.currentCutoff,
    })).toEqual([
      { ...cutoffs[0], isHighlighted: false },
      { ...cutoffs[1], isHighlighted: true },
      { ...cutoffs[2], isHighlighted: false },
      { ...cutoffs[3], isHighlighted: false },
    ])
    expect(selectCutoffsForReportScope({
      cutoffs,
      scope: REPORT_SCOPES.specificCutoff,
      selectedCutoffId: 2,
    })).toEqual([
      { ...cutoffs[0], isHighlighted: false },
      { ...cutoffs[1], isHighlighted: true },
      { ...cutoffs[2], isHighlighted: false },
    ])
  })

  it('pads single-point line chart datasets for display only', () => {
    expect(padSinglePointSavingsTrend([
      { date: '2026-06-25', savings: 5000 },
    ])).toEqual([
      { date: 'Start', savings: 0 },
      { date: '2026-06-25', savings: 5000 },
    ])
    expect(padSinglePointCashflowTrend([
      { month: 'Jun 2026', cashflow: 12000 },
    ])).toEqual([
      { month: 'Start', cashflow: 0 },
      { month: 'Jun 2026', cashflow: 12000 },
    ])
  })

  it('leaves empty and multi-point line chart datasets unchanged', () => {
    const savingsData = [
      { date: '2026-06-25', savings: 5000 },
      { date: '2026-06-26', savings: 7000 },
    ]
    const cashflowData = [
      { month: 'Jun 2026', cashflow: 12000 },
      { month: 'Jul 2026', cashflow: 15000 },
    ]

    expect(padSinglePointSavingsTrend([])).toEqual([])
    expect(padSinglePointCashflowTrend([])).toEqual([])
    expect(padSinglePointSavingsTrend(savingsData)).toBe(savingsData)
    expect(padSinglePointCashflowTrend(cashflowData)).toBe(cashflowData)
  })
})
