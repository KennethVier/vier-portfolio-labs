import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { DELETED_CUTOFF_LABEL, savingsService } from './savingsService.js'

const validSavings = {
  amount: 5000,
  source: 'Emergency Fund',
  date: '2026-06-15',
  cutoffId: '',
  note: 'Buffer',
}

async function createCutoff(name = 'June Second Half') {
  return salaryCutoffRepository.create({
    name,
    type: 'semi_monthly',
    startDate: '2026-06-16',
    endDate: '2026-06-30',
    expectedIncome: 25000,
    status: 'planned',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
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

describe('savingsService', () => {
  it('loads salary cutoffs for association', async () => {
    const cutoffId = await createCutoff()

    await expect(savingsService.loadSalaryCutoffs()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: cutoffId, name: 'June Second Half' }),
      ]),
    )
  })

  it('creates, updates, and deletes savings through the repository layer', async () => {
    const cutoffId = await createCutoff()
    const createdSavings = await savingsService.createSavings({
      ...validSavings,
      cutoffId,
    })

    expect(createdSavings).toMatchObject({
      amount: 5000,
      source: 'Emergency Fund',
      cutoffId,
      note: 'Buffer',
    })

    const updatedSavings = await savingsService.updateSavings(createdSavings.id, {
      ...validSavings,
      amount: 7000,
      source: 'Travel Fund',
      cutoffId,
      note: 'Trip allocation',
    })

    expect(updatedSavings).toMatchObject({
      id: createdSavings.id,
      amount: 7000,
      source: 'Travel Fund',
      createdAt: createdSavings.createdAt,
    })

    await savingsService.deleteSavings(createdSavings.id)

    expect(await savingsRepository.findById(createdSavings.id)).toBeUndefined()
  })

  it('sorts savings by date, createdAt, and id descending', async () => {
    await savingsRepository.create({
      ...validSavings,
      date: '2026-06-15',
      createdAt: '2026-06-15T08:00:00.000Z',
      updatedAt: '2026-06-15T08:00:00.000Z',
    })
    const newestCreatedId = await savingsRepository.create({
      ...validSavings,
      source: 'Travel Fund',
      date: '2026-06-15',
      createdAt: '2026-06-15T09:00:00.000Z',
      updatedAt: '2026-06-15T09:00:00.000Z',
    })
    const newestDateId = await savingsRepository.create({
      ...validSavings,
      source: 'Education',
      date: '2026-06-20',
      createdAt: '2026-06-15T07:00:00.000Z',
      updatedAt: '2026-06-15T07:00:00.000Z',
    })

    const savings = await savingsService.loadSavings()

    expect(savings.map((record) => record.id).slice(0, 2)).toEqual([
      newestDateId,
      newestCreatedId,
    ])
  })

  it('searches savings by source and note case-insensitively', async () => {
    await savingsService.createSavings(validSavings)
    await savingsService.createSavings({
      ...validSavings,
      amount: 2500,
      source: 'Investment',
      date: '2026-06-20',
      note: 'Label only allocation',
    })

    await expect(savingsService.loadSavings({ search: 'emergency' })).resolves.toHaveLength(1)
    await expect(savingsService.loadSavings({ search: 'LABEL ONLY' })).resolves.toHaveLength(1)
  })

  it('filters savings by cutoff, source, and date range together', async () => {
    const cutoffId = await createCutoff()
    await savingsService.createSavings({
      ...validSavings,
      cutoffId,
      date: '2026-06-20',
    })
    await savingsService.createSavings({
      ...validSavings,
      source: 'Travel Fund',
      date: '2026-05-30',
    })
    await savingsService.createSavings({
      ...validSavings,
      source: 'Emergency Fund',
      date: '2026-06-01',
    })

    const savings = await savingsService.loadSavings({
      cutoffId,
      source: 'Emergency Fund',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
    })

    expect(savings).toHaveLength(1)
    expect(savings[0]).toMatchObject({ cutoffId, date: '2026-06-20' })
  })

  it('shows deleted cutoff fallback without removing historical cutoffId', async () => {
    const cutoffId = await createCutoff()
    const createdSavings = await savingsService.createSavings({
      ...validSavings,
      cutoffId,
    })

    await salaryCutoffRepository.remove(cutoffId)

    const savings = await savingsService.loadSavings()

    expect(savings[0]).toMatchObject({
      id: createdSavings.id,
      cutoffId,
      cutoffName: DELETED_CUTOFF_LABEL,
    })
  })

  it('rejects invalid savings before persistence', async () => {
    await expect(
      savingsService.createSavings({
        ...validSavings,
        amount: 0,
        source: '',
      }),
    ).rejects.toThrow()

    await expect(savingsRepository.findAll()).resolves.toHaveLength(0)
  })
})
