import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { cashflowSnapshotRepository } from '@/lib/db/repositories/cashflowSnapshotRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { cashflowService } from './cashflowService.js'

async function createCutoff(overrides = {}) {
  return salaryCutoffRepository.create({
    name: 'June Second Half',
    type: 'semi_monthly',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    expectedIncome: 30000,
    status: 'planned',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  })
}

async function createIncome(cutoffId, amount) {
  return incomeRepository.create({
    amount,
    source: 'Salary',
    date: '2026-06-20',
    cutoffId,
    note: null,
    createdAt: '2026-06-20T00:00:00.000Z',
    updatedAt: '2026-06-20T00:00:00.000Z',
  })
}

async function createExpense(cutoffId, amount) {
  return expenseRepository.create({
    amount,
    merchant: 'Jollibee',
    categoryId: 'food',
    paymentMethod: 'Cash',
    date: '2026-06-21',
    cutoffId,
    emotionTag: null,
    note: null,
    source: 'manual',
    createdAt: '2026-06-21T00:00:00.000Z',
    updatedAt: '2026-06-21T00:00:00.000Z',
  })
}

async function createSavings(cutoffId, amount) {
  return savingsRepository.create({
    amount,
    source: 'Emergency Fund',
    date: '2026-06-22',
    cutoffId,
    note: null,
    createdAt: '2026-06-22T00:00:00.000Z',
    updatedAt: '2026-06-22T00:00:00.000Z',
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

describe('cashflowService', () => {
  it('calculates current-state cashflow totals for a cutoff', async () => {
    const cutoffId = await createCutoff({ expectedIncome: 28000 })
    await createIncome(cutoffId, 20000)
    await createIncome(cutoffId, 5000)
    await createExpense(cutoffId, 7000)
    await createExpense(cutoffId, 3000)
    await createSavings(cutoffId, 4000)

    const result = await cashflowService.calculateCashflowForCutoff(cutoffId)

    expect(result.hasCurrentCutoff).toBe(true)
    expect(result.cashflow).toMatchObject({
      cutoffId,
      cutoffName: 'June Second Half',
      expectedIncome: 28000,
      actualIncome: 25000,
      totalExpenses: 10000,
      totalSavings: 4000,
      remainingCash: 11000,
      incomeVariance: -3000,
    })
  })

  it('calculates expense and savings rates using actualIncome as denominator', async () => {
    const cutoffId = await createCutoff()
    await createIncome(cutoffId, 20000)
    await createExpense(cutoffId, 5000)
    await createSavings(cutoffId, 2500)

    const result = await cashflowService.calculateCashflowForCutoff(cutoffId)

    expect(result.cashflow.expenseRate).toBe(25)
    expect(result.cashflow.savingsRate).toBe(12.5)
  })

  it('returns zero rates when actual income is zero', async () => {
    const cutoffId = await createCutoff()
    await createExpense(cutoffId, 5000)
    await createSavings(cutoffId, 2500)

    const result = await cashflowService.calculateCashflowForCutoff(cutoffId)

    expect(result.cashflow.actualIncome).toBe(0)
    expect(result.cashflow.expenseRate).toBe(0)
    expect(result.cashflow.savingsRate).toBe(0)
  })

  it('calculates positive income variance', async () => {
    const cutoffId = await createCutoff({ expectedIncome: 20000 })
    await createIncome(cutoffId, 26000)

    const result = await cashflowService.calculateCashflowForCutoff(cutoffId)

    expect(result.cashflow.incomeVariance).toBe(6000)
  })

  it('uses explicit active cutoff for current cashflow', async () => {
    await createCutoff({
      name: 'Date Matching Cutoff',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      expectedIncome: 10000,
      status: 'planned',
    })
    const activeCutoffId = await createCutoff({
      name: 'Active Cutoff',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 20000,
      status: 'active',
    })
    await createIncome(activeCutoffId, 20000)

    const result = await cashflowService.getCurrentCashflow('2026-06-10')

    expect(result.cashflow).toMatchObject({
      cutoffId: activeCutoffId,
      cutoffName: 'Active Cutoff',
      actualIncome: 20000,
    })
  })

  it('falls back to date range cutoff when no active cutoff exists', async () => {
    const cutoffId = await createCutoff({
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })
    await createIncome(cutoffId, 12000)

    const result = await cashflowService.getCurrentCashflow('2026-06-10')

    expect(result.cashflow).toMatchObject({
      cutoffId,
      actualIncome: 12000,
    })
  })

  it('returns empty state result when there is no current cutoff', async () => {
    await createCutoff({
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    })

    const result = await cashflowService.getCurrentCashflow('2026-07-01')

    expect(result).toEqual({
      cashflow: null,
      hasCurrentCutoff: false,
    })
  })

  it('derives actualIncome from income records and never persists snapshots', async () => {
    const cutoffId = await createCutoff()
    await createIncome(cutoffId, 15000)

    const result = await cashflowService.calculateCashflowForCutoff(cutoffId)

    expect(result.cashflow.actualIncome).toBe(15000)
    await expect(cashflowSnapshotRepository.findAll()).resolves.toHaveLength(0)
  })
})
