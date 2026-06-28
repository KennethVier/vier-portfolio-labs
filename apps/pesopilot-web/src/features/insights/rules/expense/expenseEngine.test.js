import { describe, expect, it, vi } from 'vitest'

import { INSIGHT_SCOPES } from '../../utils/insightConstants.js'
import { generateExpenseInsight } from './expenseEngine.js'

vi.mock('@/features/expenses/services/expenseService.js', () => ({
  expenseService: {
    loadCategories: vi.fn(async () => [
      {
        id: 'food',
        name: 'Food',
        type: 'expense',
      },
      {
        id: 'bills',
        name: 'Bills',
        type: 'expense',
      },
    ]),
    loadExpenses: vi.fn(async () => [
      {
        amount: 600,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-10',
        id: 1,
        merchant: 'Jollibee',
      },
      {
        amount: 400,
        categoryId: 'bills',
        cutoffId: 1,
        date: '2026-06-11',
        id: 2,
        merchant: 'Meralco',
      },
      {
        amount: 800,
        categoryId: 'food',
        cutoffId: 2,
        date: '2026-05-10',
        id: 3,
        merchant: 'Jollibee',
      },
    ]),
  },
}))

vi.mock('@/features/salary-cutoff/services/cutoffService.js', () => ({
  cutoffService: {
    findCurrentCutoff: vi.fn(async () => ({
      endDate: '2026-06-30',
      id: 1,
      name: 'Current',
      startDate: '2026-06-01',
    })),
    loadCutoffs: vi.fn(async () => ({
      currentCutoff: {
        endDate: '2026-06-30',
        id: 1,
        name: 'Current',
        startDate: '2026-06-01',
      },
      cutoffs: [
        {
          endDate: '2026-06-30',
          id: 1,
          name: 'Current',
          startDate: '2026-06-01',
        },
        {
          endDate: '2026-05-31',
          id: 2,
          name: 'Previous',
          startDate: '2026-05-01',
        },
      ],
    })),
  },
}))

describe('expense engine', () => {
  it('generates an ExpenseInsight from normalized current-cutoff expenses', async () => {
    const insight = await generateExpenseInsight({
      scope: INSIGHT_SCOPES.currentCutoff,
    })

    expect(insight.category).toBe('expense')
    expect(insight.scope).toBe(INSIGHT_SCOPES.currentCutoff)
    expect(insight.metrics.totalExpenses).toBe(1000)
    expect(insight.metrics.expenseCount).toBe(2)
    expect(insight.metrics.topSpendingCategory).toMatchObject({
      categoryName: 'Food',
      amount: 600,
    })
    expect(insight.metrics.increase).toEqual({
      amount: 200,
      percentage: 25,
      significant: true,
    })
    expect(insight.diagnostics.executedRules).toEqual([
      'expense_exists',
      'top_spending_category',
      'category_distribution',
      'largest_expense',
      'largest_merchant',
      'daily_spending_rate',
      'expense_trend',
      'expense_increase_detection',
      'expense_decrease_detection',
      'spending_anomalies',
    ])
  })
})
