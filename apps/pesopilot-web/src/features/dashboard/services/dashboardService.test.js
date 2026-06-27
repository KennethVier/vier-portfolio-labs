import { describe, expect, it } from 'vitest'

import {
  buildAllocationMatrix,
  buildRecentTransactions,
  buildSpendingOverview,
  calculateCutoffProgress,
  calculateHealthScore,
  deriveBudgetAlert,
  deriveCoachMessages,
  deriveExpenseHelperText,
} from './dashboardService.js'

describe('dashboardService derivations', () => {
  it('calculates and clamps health score from cashflow values', () => {
    expect(calculateHealthScore({
      expenseRate: 81,
      incomeVariance: -1,
      remainingCash: -1,
      savingsRate: 5,
    })).toBe(50)

    expect(calculateHealthScore({
      expenseRate: 0,
      incomeVariance: 100,
      remainingCash: 100,
      savingsRate: 20,
    })).toBe(100)
  })

  it('derives budget alert state from current cashflow', () => {
    expect(deriveBudgetAlert({ remainingCash: -10, expenseRate: 20 })).toMatchObject({
      title: 'Cashflow Risk Alert',
      tone: 'critical',
    })
    expect(deriveBudgetAlert({ remainingCash: 10, expenseRate: 95 })).toMatchObject({
      title: 'Expense Usage Warning',
      tone: 'warning',
    })
    expect(deriveBudgetAlert({ remainingCash: 10, expenseRate: 80 })).toMatchObject({
      title: 'Spending Caution',
      tone: 'caution',
    })
    expect(deriveBudgetAlert({ remainingCash: 10, expenseRate: 50 })).toMatchObject({
      title: 'Cashflow Stable',
      tone: 'stable',
    })
  })

  it('derives total expense helper text from expense rate', () => {
    expect(deriveExpenseHelperText({ expenseRate: 90 })).toBe('Critical usage')
    expect(deriveExpenseHelperText({ expenseRate: 75 })).toBe('High usage')
    expect(deriveExpenseHelperText({ expenseRate: 20 })).toBe('Within range')
  })

  it('builds day-of-week spending overview for current cutoff expenses', () => {
    const overview = buildSpendingOverview([
      { amount: 100, cutoffId: 1, date: '2026-06-15' },
      { amount: 50, cutoffId: 1, date: '2026-06-16' },
      { amount: 999, cutoffId: 2, date: '2026-06-17' },
    ], { id: 1 })

    expect(overview).toHaveLength(7)
    expect(overview.find((day) => day.label === 'MON')).toMatchObject({
      amount: 100,
      percent: 100,
    })
    expect(overview.find((day) => day.label === 'TUE')).toMatchObject({
      amount: 50,
      percent: 50,
    })
    expect(overview.find((day) => day.label === 'WED')).toMatchObject({
      amount: 0,
      percent: 0,
    })
  })

  it('returns zero bars when no current cutoff exists', () => {
    expect(buildSpendingOverview([
      { amount: 100, cutoffId: 1, date: '2026-06-15' },
    ], null).every((day) => day.amount === 0 && day.percent === 0)).toBe(true)
  })

  it('builds top category allocation rows with fallback names and statuses', () => {
    const rows = buildAllocationMatrix([
      { amount: 500, categoryId: 'food', cutoffId: 1 },
      { amount: 300, categoryId: 'transport', cutoffId: 1 },
      { amount: 200, categoryId: 'missing', cutoffId: 1 },
      { amount: 1000, categoryId: 'food', cutoffId: 2 },
    ], [
      { id: 'food', name: 'Food' },
      { id: 'transport', name: 'Transport' },
    ], { id: 1 })

    expect(rows).toEqual([
      expect.objectContaining({
        category: 'Food',
        share: 50,
        spent: 500,
        status: 'High',
      }),
      expect.objectContaining({
        category: 'Transport',
        share: 30,
        spent: 300,
        status: 'Moderate',
      }),
      expect.objectContaining({
        category: 'Uncategorized',
        share: 20,
        spent: 200,
        status: 'Moderate',
      }),
    ])
  })

  it('returns an empty allocation matrix without current cutoff expenses', () => {
    expect(buildAllocationMatrix([
      { amount: 500, categoryId: 'food', cutoffId: 1 },
    ], [{ id: 'food', name: 'Food' }], null)).toEqual([])
  })

  it('derives coach messages from cashflow conditions', () => {
    expect(deriveCoachMessages({ remainingCash: -1 })[0]).toMatchObject({
      label: 'Cashflow Risk',
    })
    expect(deriveCoachMessages({ remainingCash: 100, savingsRate: 20 })[0]).toMatchObject({
      label: 'Savings Strength',
    })
    expect(deriveCoachMessages({ expenseRate: 80, remainingCash: 100, savingsRate: 5 })[0]).toMatchObject({
      label: 'Expense Pressure',
    })
    expect(deriveCoachMessages({ expenseRate: 20, remainingCash: 100, savingsRate: 5 })[0]).toMatchObject({
      label: 'Stable Cycle',
    })
  })

  it('calculates cutoff progress and days left from dates', () => {
    expect(calculateCutoffProgress(
      { endDate: '2026-06-30', startDate: '2026-06-01' },
      new Date('2026-06-15T12:00:00.000Z'),
    )).toEqual({
      daysLeft: 15,
      progress: 50,
    })

    expect(calculateCutoffProgress(
      { endDate: '2026-06-30', startDate: '2026-06-01' },
      new Date('2026-07-02T00:00:00.000Z'),
    )).toEqual({
      daysLeft: 0,
      progress: 100,
    })
  })

  it('sorts recent transactions globally and limits to five', () => {
    const transactions = buildRecentTransactions({
      expenses: [
        { amount: 100, date: '2026-06-12', id: 1, merchant: 'Jollibee' },
        { amount: 200, date: '2026-06-16', id: 2, merchant: 'Meralco' },
      ],
      income: [
        { amount: 40000, date: '2026-06-13', id: 1, source: 'Salary' },
        { amount: 1000, date: '2026-06-17', id: 2, source: 'Bonus' },
      ],
      savings: [
        { amount: 500, date: '2026-06-14', id: 1, source: 'Emergency Fund' },
        { amount: 800, date: '2026-06-18', id: 2, source: 'Travel Fund' },
      ],
    })

    expect(transactions).toHaveLength(5)
    expect(transactions.map((transaction) => transaction.label)).toEqual([
      'Travel Fund',
      'Bonus',
      'Meralco',
      'Emergency Fund',
      'Salary',
    ])
    expect(transactions[0].amount).toBe(-800)
    expect(transactions[1].amount).toBe(1000)
  })

  it('handles empty/default cashflow values', () => {
    expect(calculateHealthScore(null)).toBeNull()
    expect(deriveBudgetAlert(null)).toMatchObject({
      title: 'Cashflow Stable',
      tone: 'stable',
    })
  })
})
