import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { cutoffService } from './cutoffService.js'

const firstHalfCutoff = {
  name: 'June First Half',
  type: 'semi_monthly',
  startDate: '2026-06-01',
  endDate: '2026-06-15',
  expectedIncome: 25000,
  actualIncome: '',
  status: 'planned',
}

const secondHalfCutoff = {
  name: 'June Second Half',
  type: 'semi_monthly',
  startDate: '2026-06-16',
  endDate: '2026-06-30',
  expectedIncome: 25000,
  actualIncome: '',
  status: 'planned',
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

describe('cutoffService', () => {
  it('creates, updates, and deletes salary cutoffs through the repository layer', async () => {
    const createdCutoff = await cutoffService.createCutoff(firstHalfCutoff)

    expect(createdCutoff).toMatchObject({
      name: 'June First Half',
      type: 'semi_monthly',
      expectedIncome: 25000,
      actualIncome: null,
      status: 'planned',
    })

    const updatedCutoff = await cutoffService.updateCutoff(createdCutoff.id, {
      ...firstHalfCutoff,
      name: 'June 1-15',
      actualIncome: 26000,
      status: 'active',
    })

    expect(updatedCutoff).toMatchObject({
      id: createdCutoff.id,
      name: 'June 1-15',
      actualIncome: 26000,
      status: 'active',
      createdAt: createdCutoff.createdAt,
    })

    await cutoffService.deleteCutoff(createdCutoff.id)

    expect(await salaryCutoffRepository.findById(createdCutoff.id)).toBeUndefined()
  })

  it('prevents overlapping cutoff date ranges', async () => {
    await cutoffService.createCutoff(firstHalfCutoff)

    await expect(
      cutoffService.createCutoff({
        ...secondHalfCutoff,
        startDate: '2026-06-10',
      }),
    ).rejects.toThrow('overlap')
  })

  it('keeps only one active salary cutoff', async () => {
    const firstCutoff = await cutoffService.createCutoff({
      ...firstHalfCutoff,
      status: 'active',
    })
    const secondCutoff = await cutoffService.createCutoff(secondHalfCutoff)

    await cutoffService.markCutoffActive(secondCutoff.id)

    await expect(
      salaryCutoffRepository.findById(firstCutoff.id),
    ).resolves.toMatchObject({ status: 'planned' })
    await expect(
      salaryCutoffRepository.findById(secondCutoff.id),
    ).resolves.toMatchObject({ status: 'active' })
  })

  it('detects explicit active cutoff before date-matching cutoffs', async () => {
    const dateMatchingCutoff = await cutoffService.createCutoff(firstHalfCutoff)
    const activeCutoff = await cutoffService.createCutoff({
      ...secondHalfCutoff,
      status: 'active',
    })

    await expect(cutoffService.findCurrentCutoff('2026-06-10')).resolves.toMatchObject({
      id: activeCutoff.id,
    })
    expect(dateMatchingCutoff.id).not.toBe(activeCutoff.id)
  })

  it('detects the newest date-matching cutoff when no explicit active cutoff exists', async () => {
    await salaryCutoffRepository.create({
      ...firstHalfCutoff,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const newerCutoffId = await salaryCutoffRepository.create({
      ...firstHalfCutoff,
      name: 'June Custom Window',
      type: 'custom',
      startDate: '2026-06-05',
      endDate: '2026-06-15',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    await expect(cutoffService.findCurrentCutoff('2026-06-10')).resolves.toMatchObject({
      id: newerCutoffId,
      name: 'June Custom Window',
    })
  })

  it('closes a salary cutoff', async () => {
    const cutoff = await cutoffService.createCutoff({
      ...firstHalfCutoff,
      status: 'active',
    })

    await expect(cutoffService.closeCutoff(cutoff.id)).resolves.toMatchObject({
      status: 'closed',
    })
  })

  it('assigns unlinked expenses inside the cutoff date range only', async () => {
    const cutoff = await cutoffService.createCutoff(firstHalfCutoff)
    const insideExpenseId = await expenseRepository.create({
      amount: 500,
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'Cash',
      date: '2026-06-10',
      cutoffId: null,
      emotionTag: 'Normal',
      note: 'Lunch',
      source: 'manual',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T00:00:00.000Z',
    })
    const outsideExpenseId = await expenseRepository.create({
      amount: 700,
      merchant: 'Meralco',
      categoryId: 'bills',
      paymentMethod: 'Bank Transfer',
      date: '2026-06-20',
      cutoffId: null,
      emotionTag: 'Normal',
      note: 'Utilities',
      source: 'manual',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    })

    await expect(cutoffService.assignExpensesToCutoff(cutoff.id)).resolves.toBe(1)
    await expect(expenseRepository.findById(insideExpenseId)).resolves.toMatchObject({
      cutoffId: cutoff.id,
    })
    await expect(expenseRepository.findById(outsideExpenseId)).resolves.toMatchObject({
      cutoffId: null,
    })
  })
})
