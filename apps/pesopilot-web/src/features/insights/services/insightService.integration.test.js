import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsGoalRepository } from '@/lib/db/repositories/savingsGoalRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { generateRecommendations } from '../rules/recommendation/recommendationEngine.js'
import {
  RECOMMENDATION_ACTION_KEYS,
  RECOMMENDATION_RULE_IDS,
} from '../rules/recommendation/recommendationRuleConstants.js'
import { CANONICAL_SECTION_ORDER } from '../summary/summaryConstants.js'
import { validateFinancialSummary } from '../summary/summaryValidator.js'
import { INSIGHT_SCOPES } from '../utils/insightConstants.js'
import { insightService } from './insightService.js'
import { SUMMARY_HISTORY_TYPES } from './summaryHistoryService.js'

// Fixed "now" safely inside the seeded current cutoff (2026-06-01 → 2026-06-15).
const FIXED_NOW = new Date('2026-06-05T12:00:00.000Z')
const TS = '2026-06-01T00:00:00.000Z'

async function seedScenario() {
  const previousCutoffId = await salaryCutoffRepository.create({
    createdAt: TS,
    endDate: '2026-05-31',
    expectedIncome: 30000,
    name: 'May Second Half',
    startDate: '2026-05-16',
    status: 'closed',
    type: 'custom',
    updatedAt: TS,
  })
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
  const goalId = await savingsGoalRepository.create({
    createdAt: TS,
    name: 'Emergency Fund',
    priority: 'high',
    status: 'active',
    targetAmount: 20000,
    targetDate: '2026-12-31',
    updatedAt: TS,
  })

  const income = (cutoffId, amount, date) =>
    incomeRepository.create({
      amount,
      createdAt: TS,
      cutoffId,
      date,
      note: null,
      source: 'Salary',
      updatedAt: TS,
    })
  const expense = (cutoffId, amount, date) =>
    expenseRepository.create({
      amount,
      categoryId: 'food',
      createdAt: TS,
      cutoffId,
      date,
      emotionTag: null,
      merchant: 'Market',
      note: null,
      paymentMethod: 'Cash',
      source: 'manual',
      updatedAt: TS,
    })
  const saving = (cutoffId, amount, date, extra = {}) =>
    savingsRepository.create({
      amount,
      createdAt: TS,
      cutoffId,
      date,
      note: null,
      source: 'Emergency Fund',
      updatedAt: TS,
      ...extra,
    })

  await income(previousCutoffId, 30000, '2026-05-20')
  await expense(previousCutoffId, 10000, '2026-05-21')
  await saving(previousCutoffId, 2000, '2026-05-22')

  // 75% of income spent while ~33% of the cutoff elapsed → Fast pace;
  // single category → 100% concentration.
  await income(currentCutoffId, 40000, '2026-06-02')
  await expense(currentCutoffId, 30000, '2026-06-03')
  await saving(currentCutoffId, 5000, '2026-06-04', { goalId })

  return { currentCutoffId, previousCutoffId }
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(FIXED_NOW)
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
  vi.useRealTimers()
})

describe('insightService integration (real engines, real IndexedDB)', () => {
  it('runs the full deterministic pipeline and persists one cutoff summary', async () => {
    const { currentCutoffId } = await seedScenario()

    const bundle = await insightService.loadInsights()

    expect(bundle.scope).toBe(INSIGHT_SCOPES.currentCutoff)

    expect(bundle.health.category).toBe('health')
    expect(typeof bundle.health.score).toBe('number')
    expect(typeof bundle.health.status).toBe('string')

    expect(bundle.expenses.metrics.totalExpenses).toBe(30000)
    expect(bundle.expenses.metrics.categoryDistribution.length).toBeGreaterThan(0)
    expect(bundle.expenses.metrics.topSpendingCategory.percentage).toBe(100)

    expect(bundle.income.metrics.totalIncome).toBe(40000)
    expect(bundle.income.metrics.incomeCount).toBe(1)

    expect(bundle.savings.metrics.totalSavings).toBe(5000)
    expect(bundle.savings.metrics.savingsRate.rate).toBe(12.5)

    expect(bundle.goals.metrics.totalGoals).toBe(1)
    expect(bundle.goals.metrics.activeGoals).toBe(1)
    expect(bundle.goals.metrics.totalTargetAmount).toBe(20000)

    expect(bundle.cashflow.metrics.remainingCash).toBe(5000)
    expect(bundle.cashflow.metrics.spendingPace.status).toBe('Fast')

    expect(bundle.cutoff.metrics.currentCutoff.cutoffId).toBe(currentCutoffId)
    expect(bundle.cutoff.metrics.currentCutoff.startDate).toBe('2026-06-01')
    expect(bundle.cutoff.metrics.currentCutoff.endDate).toBe('2026-06-15')
    expect(bundle.cutoff.metrics.previousCutoff).not.toBeNull()

    // Recommendations: deterministic conflict resolution produces cutoffExpensesUp over expenseCategoryConcentration for review_expenses
    expect(Array.isArray(bundle.recommendations)).toBe(true)
    const ids = bundle.recommendations.map((rec) => rec.id)
    expect(ids).toContain(RECOMMENDATION_RULE_IDS.cashflowFastSpendingPace)

    const reviewExpensesRecommendations = bundle.recommendations.filter(
      (rec) => rec.actionKey === RECOMMENDATION_ACTION_KEYS.reviewExpenses,
    )
    expect(reviewExpensesRecommendations).toHaveLength(1)
    expect(reviewExpensesRecommendations[0].id).toBe(
      RECOMMENDATION_RULE_IDS.cutoffExpensesUp,
    )
    expect(bundle.recommendations.map((rec) => rec.id)).not.toContain(
      RECOMMENDATION_RULE_IDS.expenseCategoryConcentration,
    )

    const actionKeys = bundle.recommendations.map((rec) => rec.actionKey)
    expect(new Set(actionKeys).size).toBe(actionKeys.length)

    for (const rec of bundle.recommendations) {
      expect(rec.evidence.length).toBeGreaterThan(0)
      expect(rec.sourceRuleIds.length).toBeGreaterThan(0)
    }
    // Ordering is exactly what the existing engine produces for this bundle.
    expect(bundle.recommendations).toEqual(
      generateRecommendations(bundle).recommendations,
    )

    // Summary
    expect(bundle.summary.diagnostics.state).toBe('ready')
    const sectionTypes = bundle.summary.sections.map((section) => section.type)
    expect(sectionTypes[0]).toBe(CANONICAL_SECTION_ORDER[0])
    const canonicalIndexes = sectionTypes.map((type) => CANONICAL_SECTION_ORDER.indexOf(type))
    expect(canonicalIndexes).not.toContain(-1)
    expect(canonicalIndexes).toEqual([...canonicalIndexes].sort((a, b) => a - b))
    const validation = validateFinancialSummary({
      financialSummary: bundle.summary,
      insightBundle: bundle,
      recommendationBundle: { recommendations: bundle.recommendations },
    })
    expect(validation.errors).toEqual([])
    expect(validation.valid).toBe(true)

    // Persistence
    const rows = await db.ai_insights.toArray()
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row.type).toBe(SUMMARY_HISTORY_TYPES.cutoffSummary)
    expect(row.cutoffId).toBe(currentCutoffId)
    expect(row.periodKey).toBe('2026-06')
    expect(row.content).toEqual(bundle.summary)

    const forbiddenKeys = [
      'health',
      'expenses',
      'income',
      'savings',
      'goals',
      'cashflow',
      'cutoff',
      'recommendations',
      'transactions',
    ]
    for (const key of forbiddenKeys) {
      expect(row).not.toHaveProperty(key)
      expect(row.content).not.toHaveProperty(key)
    }
  })

  it('updates the existing summary row instead of duplicating it on a second run', async () => {
    const { currentCutoffId } = await seedScenario()

    await insightService.loadInsights()
    const [first] = await db.ai_insights.toArray()

    await insightService.loadInsights()
    const rows = await db.ai_insights.toArray()

    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(first.id)
    expect(rows[0].cutoffId).toBe(currentCutoffId)
    expect(rows[0].type).toBe(SUMMARY_HISTORY_TYPES.cutoffSummary)
  })

  it('does not persist a summary when there is no current cutoff', async () => {
    const bundle = await insightService.loadInsights()

    expect(bundle.cutoff.metrics.currentCutoff).toBeNull()
    await expect(db.ai_insights.count()).resolves.toBe(0)
  })
})
