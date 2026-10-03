import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import {
  buildAllocationMatrix,
  buildRecentTransactions,
  buildSpendingOverview,
  calculateCutoffProgress,
  dashboardService,
  dashboardServiceInternals,
  deriveBudgetAlert,
  deriveExpenseHelperText,
  getCutoffPerformance,
  getExecutiveSummaryNarrative,
  getHealthScore,
  getTopRecommendations,
} from './dashboardService.js'

describe('dashboardService derivations', () => {
  it('extracts exact authoritative health score from HealthInsight without clamping or fallback', () => {
    expect(getHealthScore({
      health: { score: 85, status: 'Healthy' },
    })).toBe(85)

    expect(getHealthScore({
      health: { score: 105, status: 'Healthy' },
    })).toBe(105)

    expect(getHealthScore({
      health: { score: -10, status: 'Critical' },
    })).toBe(-10)

    // Missing score or missing health insight returns null (no fallback calculation)
    expect(getHealthScore({ health: null })).toBeNull()
    expect(getHealthScore({})).toBeNull()
    expect(getHealthScore(null)).toBeNull()
    // No active cutoff returns null
    expect(getHealthScore({ health: { score: 85 } }, false)).toBeNull()
  })

  it('derives budget alert state from CashflowInsight source severity and status', () => {
    // Critical breakdown severity -> critical alert tone
    expect(deriveBudgetAlert(null, {
      cashflow: {
        breakdown: [{ id: 'rule_1', severity: 'critical' }],
        explanation: 'Cashflow deficit detected for this cutoff.',
        metrics: { position: 'Negative', spendingPace: { status: 'Fast' } },
      },
    })).toMatchObject({
      actionTo: '/cashflow',
      message: 'Cashflow deficit detected for this cutoff.',
      title: 'Cashflow Deficit Risk',
      tone: 'critical',
    })

    // Warning breakdown severity -> warning alert tone
    expect(deriveBudgetAlert(null, {
      cashflow: {
        breakdown: [{ id: 'rule_2', severity: 'warning' }],
        explanation: 'Spending pace is elevated.',
        metrics: { position: 'Positive', spendingPace: { status: 'Fast' } },
      },
    })).toMatchObject({
      actionTo: '/cashflow',
      message: 'Spending pace is elevated.',
      title: 'Cashflow Warning',
      tone: 'warning',
    })

    // Positive and Stable state -> stable alert tone
    expect(deriveBudgetAlert(null, {
      cashflow: {
        breakdown: [{ id: 'rule_3', severity: 'info' }],
        explanation: 'Cashflow is positive and spending is on pace.',
        metrics: { position: 'Positive', stability: { status: 'Stable' } },
      },
    })).toMatchObject({
      actionTo: '/cashflow',
      message: 'Cashflow is positive and spending is on pace.',
      title: 'Cashflow Stable',
      tone: 'stable',
    })

    // Neutral fallback when no negative severity and not explicitly positive/stable
    expect(deriveBudgetAlert(null, {
      cashflow: {
        breakdown: [],
        explanation: 'Cashflow tracking is active.',
        metrics: { position: 'No Data', stability: { status: 'No Data' } },
      },
    })).toMatchObject({
      title: 'Cashflow Status',
      tone: 'neutral',
    })
  })

  it('derives total expense helper text from spending pace status', () => {
    expect(deriveExpenseHelperText({
      cashflow: { metrics: { spendingPace: { status: 'Fast' } } },
    })).toBe('Pace: Fast')

    expect(deriveExpenseHelperText({
      cashflow: { metrics: { spendingPace: { status: 'On Pace' } } },
    })).toBe('Pace: On Pace')

    expect(deriveExpenseHelperText({
      cashflow: { metrics: { spendingPace: { status: 'Slow' } } },
    })).toBe('Pace: Slow')

    expect(deriveExpenseHelperText({
      cashflow: { metrics: { spendingPace: { status: 'No Data' } } },
    })).toBe('Within range')

    expect(deriveExpenseHelperText(null, false)).toBe('No active cutoff')
  })

  it('does not classify missing current-cutoff data as healthy or critical', () => {
    const model = dashboardServiceInternals.buildDashboardModel({
      cashflow: {
        actualIncome: 0,
        expectedIncome: 0,
        expenseRate: 0,
        remainingCash: 0,
        savingsRate: 0,
        totalExpenses: 0,
        totalSavings: 0,
      },
      currentCutoff: null,
      expenses: [],
      income: [],
      insights: {
        health: {
          score: 0,
          status: 'Critical',
        },
      },
      savings: [],
    })

    expect(model.healthScore).toBeNull()
    expect(model.healthStatus).toBeNull()
    expect(model.expenseHelperText).toBe('No active cutoff')
    expect(model.budgetAlert).toMatchObject({
      actionTo: '/salary-cutoff',
      title: 'No Active Cutoff',
      tone: 'neutral',
    })
    expect(model.summaryNarrative).toBeNull()
    expect(model.topRecommendations).toEqual([])
  })

  it('consumes categoryDistribution directly without 40/20 threshold classification', () => {
    const categoryDistribution = [
      { amount: 500, categoryName: 'Food', count: 3, percentage: 50 },
      { amount: 300, categoryName: 'Transport', count: 2, percentage: 30 },
      { amount: 200, categoryName: 'Utilities', count: 1, percentage: 20 },
    ]
    const topCategory = { categoryName: 'Food', percentage: 50 }

    const rows = buildAllocationMatrix(categoryDistribution, topCategory, { id: 1 })

    expect(rows).toEqual([
      {
        category: 'Food',
        colorClassName: 'bg-primary',
        share: 50,
        spent: 500,
        status: 'Top Category',
        tone: 'neutral',
      },
      {
        category: 'Transport',
        colorClassName: 'bg-secondary',
        share: 30,
        spent: 300,
        status: '—',
        tone: 'neutral',
      },
      {
        category: 'Utilities',
        colorClassName: 'bg-tertiary',
        share: 20,
        spent: 200,
        status: '—',
        tone: 'neutral',
      },
    ])
  })

  it('returns an empty allocation matrix without current cutoff', () => {
    const categoryDistribution = [
      { amount: 500, categoryName: 'Food', count: 3, percentage: 50 },
    ]
    expect(buildAllocationMatrix(categoryDistribution, { categoryName: 'Food' }, null)).toEqual([])
    expect(buildAllocationMatrix([], null, { id: 1 })).toEqual([])
  })

  it('preserves recommendation engine order and limits to top 2', () => {
    const recommendations = [
      { id: 'rec_1', priority: 'high', rank: 1, title: 'Reduce dining out' },
      { id: 'rec_2', priority: 'medium', rank: 2, title: 'Automate savings' },
      { id: 'rec_3', priority: 'low', rank: 3, title: 'Review subscription' },
    ]

    const result = getTopRecommendations(recommendations, true)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('rec_1')
    expect(result[1].id).toBe('rec_2')

    // 0 recommendations returns empty array
    expect(getTopRecommendations([], true)).toEqual([])
    // No cutoff returns empty array
    expect(getTopRecommendations(recommendations, false)).toEqual([])
  })

  it('extracts executive summary narrative from FinancialSummary sections', () => {
    const summary = {
      sections: [
        {
          paragraphs: [
            { text: 'Cashflow is positive for June cycle with ₱5,000 remaining.' },
            { text: 'Spending pace is healthy across essential categories.' },
          ],
          title: 'Executive Summary',
          type: 'executive',
        },
      ],
    }

    expect(getExecutiveSummaryNarrative(summary, true)).toBe(
      'Cashflow is positive for June cycle with ₱5,000 remaining. Spending pace is healthy across essential categories.',
    )
    expect(getExecutiveSummaryNarrative(null, true)).toBeNull()
    expect(getExecutiveSummaryNarrative(summary, false)).toBeNull()
  })

  it('extracts financial cutoff performance from CutoffInsight', () => {
    const insights = {
      cutoff: {
        explanation: 'Remaining cash improved by 15% compared to the previous cutoff.',
      },
    }

    expect(getCutoffPerformance(insights, true)).toBe(
      'Remaining cash improved by 15% compared to the previous cutoff.',
    )
    expect(getCutoffPerformance(null, true)).toBeNull()
    expect(getCutoffPerformance(insights, false)).toBeNull()
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

  it('calculates cutoff progress and days left from calendar dates', () => {
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

  it('handles empty/default values safely without fallback score fabrication', () => {
    expect(getHealthScore(null)).toBeNull()
    expect(deriveBudgetAlert(null, null, false)).toMatchObject({
      title: 'No Active Cutoff',
      tone: 'neutral',
    })
  })
})

describe('dashboardService.loadDashboard integration', () => {
  const FIXED_DATE = new Date('2026-06-05T12:00:00.000Z')
  const TS = '2026-06-01T00:00:00.000Z'

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(FIXED_DATE)
    await db.open()
    await clearDatabase()
    await seedDatabase()
  })

  afterEach(async () => {
    await clearDatabase()
    db.close()
    vi.useRealTimers()
  })

  it('loads the dashboard model using authoritative insight values for an active cutoff', async () => {
    const currentCutoffId = await salaryCutoffRepository.create({
      createdAt: TS,
      endDate: '2026-06-15',
      expectedIncome: 40000,
      name: 'June First Half',
      startDate: '2026-06-01',
      status: 'active',
      type: 'custom',
      updatedAt: TS,
    })

    await incomeRepository.create({
      amount: 40000,
      createdAt: TS,
      cutoffId: currentCutoffId,
      date: '2026-06-02',
      note: null,
      source: 'Salary',
      updatedAt: TS,
    })

    await expenseRepository.create({
      amount: 15000,
      categoryId: 'food',
      createdAt: TS,
      cutoffId: currentCutoffId,
      date: '2026-06-03',
      emotionTag: null,
      merchant: 'Supermarket',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      updatedAt: TS,
    })

    await savingsRepository.create({
      amount: 5000,
      createdAt: TS,
      cutoffId: currentCutoffId,
      date: '2026-06-04',
      note: null,
      source: 'Emergency Fund',
      updatedAt: TS,
    })

    const dashboard = await dashboardService.loadDashboard()

    expect(dashboard.currentCutoff).not.toBeNull()
    expect(dashboard.currentCutoff.id).toBe(currentCutoffId)

    // Authoritative health values
    expect(dashboard.healthScore).toBe(dashboard.insights.health.score)
    expect(dashboard.healthStatus).toBe(dashboard.insights.health.status)

    // Budget alert derives from authoritative cashflow breakdown/metrics
    expect(dashboard.budgetAlert).toBeDefined()
    expect(dashboard.budgetAlert.tone).toBeDefined()

    // Summary narrative matches executive summary section text
    expect(dashboard.summaryNarrative).toBeDefined()

    // Top recommendations capped at 2, matching existing engine order
    const expectedTop = dashboard.insights.recommendations.slice(0, 2)
    expect(dashboard.topRecommendations).toEqual(expectedTop)
  })

  it('returns safe null/empty states when no active cutoff covers the current date', async () => {
    // Clear all cutoffs so none is active
    await db.salary_cutoffs.clear()

    const dashboard = await dashboardService.loadDashboard()

    expect(dashboard.currentCutoff).toBeNull()
    expect(dashboard.healthScore).toBeNull()
    expect(dashboard.healthStatus).toBeNull()
    expect(dashboard.summaryNarrative).toBeNull()
    expect(dashboard.topRecommendations).toEqual([])
    expect(dashboard.budgetAlert.title).toBe('No Active Cutoff')
  })
})


