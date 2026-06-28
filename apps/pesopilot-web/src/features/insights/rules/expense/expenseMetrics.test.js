import { describe, expect, it } from 'vitest'

import { EXPENSE_TREND } from '../../models/expenseInsight.js'
import {
  buildExpenseMetrics,
  calculateCategoryDistribution,
  calculateDailySpendingRate,
  calculateExpenseTrend,
  detectSpendingAnomalies,
  getLargestExpense,
  getLargestMerchant,
  getTopSpendingCategory,
} from './expenseMetrics.js'

const categories = [
  {
    id: 'food',
    name: 'Food',
  },
  {
    id: 'bills',
    name: 'Bills',
  },
]

function createContext(expenses, comparison = []) {
  return {
    categories,
    expenses: {
      current: expenses,
      comparison,
      hasComparisonPeriod: comparison.length > 0,
    },
    period: {
      currentPeriodDays: 10,
    },
  }
}

describe('expense metrics', () => {
  it('calculates category distribution and top spending category', () => {
    const distribution = calculateCategoryDistribution(
      [
        { amount: 300, categoryId: 'food' },
        { amount: 100, categoryId: 'food' },
        { amount: 600, categoryId: 'bills' },
      ],
      categories,
    )

    expect(distribution).toEqual([
      {
        categoryId: 'bills',
        categoryName: 'Bills',
        amount: 600,
        count: 1,
        percentage: 60,
      },
      {
        categoryId: 'food',
        categoryName: 'Food',
        amount: 400,
        count: 2,
        percentage: 40,
      },
    ])
    expect(getTopSpendingCategory(distribution).categoryName).toBe('Bills')
  })

  it('falls back for missing categories and merchants', () => {
    const expenses = [
      {
        amount: 500,
        categoryId: 'missing',
        date: '2026-06-10',
        id: 1,
        merchant: '',
      },
    ]

    expect(calculateCategoryDistribution(expenses, categories)[0].categoryName).toBe(
      'Uncategorized',
    )
    expect(getLargestExpense(expenses, categories)).toMatchObject({
      categoryName: 'Uncategorized',
      merchant: 'Unknown Merchant',
    })
    expect(getLargestMerchant(expenses)).toEqual({
      amount: 500,
      count: 1,
      merchant: 'Unknown Merchant',
    })
  })

  it('detects largest expense and largest merchant deterministically', () => {
    const expenses = [
      {
        amount: 500,
        categoryId: 'food',
        date: '2026-06-10',
        id: 1,
        merchant: 'Jollibee',
      },
      {
        amount: 800,
        categoryId: 'bills',
        date: '2026-06-11',
        id: 2,
        merchant: 'Meralco',
      },
      {
        amount: 300,
        categoryId: 'bills',
        date: '2026-06-12',
        id: 3,
        merchant: 'Meralco',
      },
    ]

    expect(getLargestExpense(expenses, categories)).toMatchObject({
      amount: 800,
      merchant: 'Meralco',
    })
    expect(getLargestMerchant(expenses)).toEqual({
      amount: 1100,
      count: 2,
      merchant: 'Meralco',
    })
  })

  it('calculates daily spending rate', () => {
    expect(calculateDailySpendingRate(1000, 10)).toBe(100)
    expect(calculateDailySpendingRate(1000, 0)).toBe(0)
  })

  it('calculates trend up, down, stable, and no-data', () => {
    expect(calculateExpenseTrend(1200, 1000)).toMatchObject({
      direction: EXPENSE_TREND.increasing,
      percentageChange: 20,
    })
    expect(calculateExpenseTrend(800, 1000)).toMatchObject({
      direction: EXPENSE_TREND.decreasing,
      percentageChange: -20,
    })
    expect(calculateExpenseTrend(1050, 1000)).toMatchObject({
      direction: EXPENSE_TREND.stable,
      percentageChange: 5,
    })
    expect(calculateExpenseTrend(0, 0)).toMatchObject({
      direction: EXPENSE_TREND.noData,
    })
  })

  it('detects anomalies only when enough records exist', () => {
    expect(
      detectSpendingAnomalies(
        [
          { amount: 100, categoryId: 'food', merchant: 'A' },
          { amount: 120, categoryId: 'food', merchant: 'B' },
          { amount: 90, categoryId: 'food', merchant: 'C' },
          { amount: 110, categoryId: 'food', merchant: 'D' },
        ],
        categories,
      ),
    ).toEqual([])
    expect(
      detectSpendingAnomalies(
        [
          { amount: 100, categoryId: 'food', merchant: 'A' },
          { amount: 100, categoryId: 'food', merchant: 'B' },
          { amount: 100, categoryId: 'food', merchant: 'C' },
          { amount: 100, categoryId: 'food', merchant: 'D' },
          { amount: 100, categoryId: 'food', merchant: 'E' },
          { amount: 1000, categoryId: 'bills', merchant: 'Meralco' },
        ],
        categories,
      ),
    ).toEqual([
      {
        amount: 1000,
        categoryId: 'bills',
        categoryName: 'Bills',
        date: null,
        id: null,
        merchant: 'Meralco',
        threshold: 920.82,
      },
    ])
  })

  it('builds the complete metrics object', () => {
    const metrics = buildExpenseMetrics(
      createContext(
        [
          { amount: 500, categoryId: 'food', merchant: 'Jollibee' },
          { amount: 500, categoryId: 'bills', merchant: 'Meralco' },
        ],
        [{ amount: 800, categoryId: 'food', merchant: 'Jollibee' }],
      ),
    )

    expect(metrics).toMatchObject({
      totalExpenses: 1000,
      expenseCount: 2,
      dailySpendingRate: 100,
      currentPeriodDays: 10,
      increase: {
        amount: 200,
        percentage: 25,
        significant: true,
      },
    })
  })
})
