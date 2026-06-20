import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import {
  clearQaData,
  devQaSeedInternals,
  QA_SEED_MARKER,
  seedBasicDataset,
  seedLargeDataset,
} from './devQaSeedService.js'

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('devQaSeedService', () => {
  async function createActiveCutoff(overrides = {}) {
    return salaryCutoffRepository.create({
      createdAt: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-24',
      expectedIncome: 42000,
      name: 'Real Active Salary Cycle',
      payday1: 10,
      payday2: 25,
      startDate: '2026-06-10',
      status: 'active',
      type: 'semi_monthly',
      updatedAt: '2026-06-01T00:00:00.000Z',
      ...overrides,
    })
  }

  it('generates valid dates and valid expense amounts', () => {
    const cutoff = {
      id: 1,
      startDate: '2026-06-10',
      endDate: '2026-06-24',
    }
    const expense = devQaSeedInternals.buildExpensePayload(cutoff, 4)

    expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(expense.date >= cutoff.startDate).toBe(true)
    expect(expense.date <= cutoff.endDate).toBe(true)
    expect(expense.amount).toBeGreaterThanOrEqual(50)
    expect(expense.amount).toBeLessThanOrEqual(5000)
  })

  it('generates repository-compatible QA markers', () => {
    const cutoffSpecs = devQaSeedInternals.buildBasicCutoffSpecs('2026-06-20')
    const inboxRecord = devQaSeedInternals.buildInboxRecord('2026-06-20', 0)

    expect(cutoffSpecs.every((cutoff) => cutoff.name.includes(QA_SEED_MARKER))).toBe(true)
    expect(inboxRecord.rawText).toContain(QA_SEED_MARKER)
    expect(inboxRecord.note).toContain(QA_SEED_MARKER)
  })

  it('uses salary cutoff types that are valid for new creation', () => {
    const cutoffSpecs = devQaSeedInternals.buildLargeCutoffSpecs('2026-06-20')

    expect(cutoffSpecs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'weekly' }),
        expect.objectContaining({ type: 'irregular' }),
      ]),
    )
    expect(cutoffSpecs.every((cutoff) =>
      ['monthly', 'semi_monthly', 'custom'].includes(cutoff.type),
    )).toBe(true)
  })

  it('seeds the basic dataset with QA markers', async () => {
    await expect(seedBasicDataset('2026-06-20')).resolves.toMatchObject({
      detectedExpenses: 3,
      expenses: 10,
      income: 3,
      salaryCutoffs: 2,
      savings: 3,
    })

    expect((await salaryCutoffRepository.findAll()).every((record) =>
      record.name.includes(QA_SEED_MARKER),
    )).toBe(true)
    expect((await expenseRepository.findAll()).every((record) =>
      record.note.includes(QA_SEED_MARKER),
    )).toBe(true)
    expect((await incomeRepository.findAll()).every((record) =>
      record.note.includes(QA_SEED_MARKER),
    )).toBe(true)
    expect((await savingsRepository.findAll()).every((record) =>
      record.note.includes(QA_SEED_MARKER),
    )).toBe(true)
    expect((await detectedExpenseRepository.findAll()).every((record) =>
      record.rawText.includes(QA_SEED_MARKER),
    )).toBe(true)
  })

  it('shifts QA cutoff windows when existing user cutoffs would overlap', async () => {
    await createActiveCutoff({ name: 'Real Current Salary Cycle' })

    await expect(seedBasicDataset('2026-06-20')).resolves.toMatchObject({
      detectedExpenses: 3,
      expenses: 10,
      income: 3,
      salaryCutoffs: 2,
      savings: 3,
    })

    const cutoffs = await salaryCutoffRepository.findAll()
    const realCutoff = cutoffs.find((cutoff) => cutoff.name === 'Real Current Salary Cycle')
    const qaCutoffs = cutoffs.filter((cutoff) => cutoff.name.includes(QA_SEED_MARKER))

    expect(realCutoff).toEqual(expect.objectContaining({ status: 'active' }))
    expect(qaCutoffs).toHaveLength(2)
    expect(qaCutoffs.every((cutoff) => cutoff.startDate > realCutoff.endDate)).toBe(true)
    expect(qaCutoffs.some((cutoff) => cutoff.status === 'active')).toBe(false)
  })

  it('targets the active cutoff for the basic dataset without creating QA cutoffs', async () => {
    const activeCutoffId = await createActiveCutoff()

    await expect(
      seedBasicDataset('2026-06-20', { targetActiveCutoff: true }),
    ).resolves.toMatchObject({
      detectedExpenses: 3,
      expenses: 10,
      income: 3,
      salaryCutoffs: 0,
      savings: 3,
      target: 'activeCutoff',
    })

    await expect(salaryCutoffRepository.findAll()).resolves.toHaveLength(1)

    const [expenses, income, savings] = await Promise.all([
      expenseRepository.findAll(),
      incomeRepository.findAll(),
      savingsRepository.findAll(),
    ])

    expect([...expenses, ...income, ...savings].every((record) =>
      String(record.cutoffId) === String(activeCutoffId),
    )).toBe(true)
    expect([...expenses, ...income, ...savings].every((record) =>
      record.date >= '2026-06-10' && record.date <= '2026-06-24',
    )).toBe(true)
    expect([...expenses, ...income, ...savings].every((record) =>
      record.note.includes(QA_SEED_MARKER),
    )).toBe(true)
  })

  it('targets the active cutoff for the large dataset with current-cycle expenses', async () => {
    const activeCutoffId = await createActiveCutoff()

    await expect(
      seedLargeDataset('2026-06-20', { targetActiveCutoff: true }),
    ).resolves.toMatchObject({
      detectedExpenses: 20,
      expenses: 200,
      income: 20,
      salaryCutoffs: 0,
      savings: 20,
      target: 'activeCutoff',
    })

    const expenses = await expenseRepository.findAll()

    expect(expenses).toHaveLength(200)
    expect(expenses.every((expense) =>
      String(expense.cutoffId) === String(activeCutoffId),
    )).toBe(true)
    expect(expenses.every((expense) =>
      expense.date >= '2026-06-10' && expense.date <= '2026-06-24',
    )).toBe(true)
  })

  it('falls back to generated QA cutoffs when active cutoff targeting has no active cutoff', async () => {
    await expect(
      seedBasicDataset('2026-06-20', { targetActiveCutoff: true }),
    ).resolves.toMatchObject({
      salaryCutoffs: 2,
      target: 'generatedCutoffs',
    })

    const cutoffs = await salaryCutoffRepository.findAll()

    expect(cutoffs).toHaveLength(2)
    expect(cutoffs.every((cutoff) => cutoff.name.includes(QA_SEED_MARKER))).toBe(true)
  })

  it('clears only QA records and preserves non-QA records', async () => {
    await seedBasicDataset('2026-06-20')
    await expenseRepository.create({
      amount: 100,
      categoryId: 'food',
      createdAt: '2026-06-20T00:00:00.000Z',
      cutoffId: null,
      date: '2026-06-20',
      emotionTag: null,
      merchant: 'Personal Record',
      note: 'not qa',
      paymentMethod: 'Cash',
      source: 'manual',
      updatedAt: '2026-06-20T00:00:00.000Z',
    })

    await expect(clearQaData()).resolves.toMatchObject({
      detectedExpenses: 3,
      expenses: 10,
      income: 3,
      salaryCutoffs: 2,
      savings: 3,
    })

    await expect(expenseRepository.findAll()).resolves.toEqual([
      expect.objectContaining({ merchant: 'Personal Record' }),
    ])
    await expect(incomeRepository.findAll()).resolves.toHaveLength(0)
    await expect(savingsRepository.findAll()).resolves.toHaveLength(0)
    await expect(salaryCutoffRepository.findAll()).resolves.toHaveLength(0)
    await expect(detectedExpenseRepository.findAll()).resolves.toHaveLength(0)
  })
})
