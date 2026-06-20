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
