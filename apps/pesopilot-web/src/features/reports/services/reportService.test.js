import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { REPORT_SCOPES } from '../utils/reportTransforms.js'
import { reportService } from './reportService.js'

async function createCutoff(overrides = {}) {
  return salaryCutoffRepository.create({
    createdAt: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30',
    expectedIncome: 40000,
    name: 'June Cycle',
    startDate: '2026-06-01',
    status: 'planned',
    type: 'custom',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  })
}

async function createIncome(cutoffId, amount, date = '2026-06-10') {
  return incomeRepository.create({
    amount,
    createdAt: `${date}T00:00:00.000Z`,
    cutoffId,
    date,
    note: null,
    source: 'Salary',
    updatedAt: `${date}T00:00:00.000Z`,
  })
}

async function createExpense(cutoffId, amount, date = '2026-06-11') {
  return expenseRepository.create({
    amount,
    categoryId: 'food',
    createdAt: `${date}T00:00:00.000Z`,
    cutoffId,
    date,
    emotionTag: null,
    merchant: 'Jollibee',
    note: null,
    paymentMethod: 'Cash',
    source: 'manual',
    updatedAt: `${date}T00:00:00.000Z`,
  })
}

async function createSavings(cutoffId, amount, date = '2026-06-12') {
  return savingsRepository.create({
    amount,
    createdAt: `${date}T00:00:00.000Z`,
    cutoffId,
    date,
    note: null,
    source: 'Emergency Fund',
    updatedAt: `${date}T00:00:00.000Z`,
  })
}

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('reportService', () => {
  it('returns all historical records by default', async () => {
    const currentCutoffId = await createCutoff({ status: 'active' })
    const historicalCutoffId = await createCutoff({
      endDate: '2026-05-31',
      name: 'May Cycle',
      startDate: '2026-05-01',
    })
    await createIncome(currentCutoffId, 40000)
    await createIncome(historicalCutoffId, 30000, '2026-05-10')
    await createExpense(currentCutoffId, 1000)
    await createExpense(historicalCutoffId, 500, '2026-05-11')
    await createSavings(currentCutoffId, 5000)
    await createSavings(historicalCutoffId, 3000, '2026-05-12')

    const result = await reportService.loadReports()

    expect(result.kpis).toMatchObject({
      netCashflow: 60500,
      totalExpenses: 1500,
      totalIncome: 70000,
      totalSavings: 8000,
    })
    expect(result.datasets.incomeExpenseComparison).toEqual([
      { expenses: 500, income: 30000, month: 'May 2026' },
      { expenses: 1000, income: 40000, month: 'Jun 2026' },
    ])
  })

  it('filters income, expenses, and savings for current cutoff reports', async () => {
    const currentCutoffId = await createCutoff({
      endDate: '2030-12-31',
      startDate: '2020-01-01',
      status: 'active',
    })
    const otherCutoffId = await createCutoff({
      endDate: '2026-07-31',
      name: 'July Cycle',
      startDate: '2026-07-01',
    })
    await createIncome(currentCutoffId, 40000)
    await createIncome(otherCutoffId, 50000)
    await createExpense(currentCutoffId, 1000)
    await createExpense(otherCutoffId, 7000)
    await createSavings(currentCutoffId, 5000)
    await createSavings(otherCutoffId, 9000)

    const result = await reportService.loadReports({
      scope: REPORT_SCOPES.currentCutoff,
    })

    expect(result.kpis).toMatchObject({
      netCashflow: 34000,
      totalExpenses: 1000,
      totalIncome: 40000,
      totalSavings: 5000,
    })
    expect(result.datasets.incomeExpenseComparison).toEqual([
      { expenses: 1000, income: 40000, month: 'Jun 2026' },
    ])
    expect(result.datasets.cutoffComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cutoffId: currentCutoffId,
          isHighlighted: true,
        }),
      ]),
    )
  })

  it('filters income, expenses, and savings for a selected cutoff report', async () => {
    const firstCutoffId = await createCutoff({
      endDate: '2026-05-31',
      name: 'May Cycle',
      startDate: '2026-05-01',
    })
    const selectedCutoffId = await createCutoff({
      endDate: '2026-06-30',
      name: 'June Cycle',
      startDate: '2026-06-01',
    })
    const nextCutoffId = await createCutoff({
      endDate: '2026-07-31',
      name: 'July Cycle',
      startDate: '2026-07-01',
    })
    await createIncome(firstCutoffId, 30000)
    await createIncome(selectedCutoffId, 40000)
    await createIncome(nextCutoffId, 50000)
    await createExpense(selectedCutoffId, 2000)
    await createSavings(selectedCutoffId, 6000)

    const result = await reportService.loadReports({
      scope: REPORT_SCOPES.specificCutoff,
      selectedCutoffId,
    })

    expect(result.kpis).toMatchObject({
      netCashflow: 32000,
      totalExpenses: 2000,
      totalIncome: 40000,
      totalSavings: 6000,
    })
    expect(result.datasets.cutoffComparison.map((cutoff) => cutoff.cutoffId)).toEqual([
      nextCutoffId,
      selectedCutoffId,
      firstCutoffId,
    ])
    expect(result.datasets.cutoffComparison).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cutoffId: selectedCutoffId,
          isHighlighted: true,
        }),
      ]),
    )
  })

  it('returns empty scoped records when current cutoff does not exist', async () => {
    await createCutoff({
      endDate: '2026-05-31',
      name: 'Past Cycle',
      startDate: '2026-05-01',
      status: 'closed',
    })

    const result = await reportService.loadReports({
      scope: REPORT_SCOPES.currentCutoff,
    })

    expect(result.kpis).toMatchObject({
      netCashflow: 0,
      totalExpenses: 0,
      totalIncome: 0,
      totalSavings: 0,
    })
    expect(result.datasets.cutoffComparison).toEqual([])
    expect(result.meta.emptyMessage).toBe('No records found for the current cutoff.')
  })
})
