import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import {
  generateMonthlyCycle,
  generateNextMonthlyCycle,
  generateNextSemiMonthlyCycle,
  generateSemiMonthlyCycle,
} from './cutoffCycle.js'
import { cutoffService } from './cutoffService.js'

const customCutoff = {
  name: 'June Custom Cycle',
  type: 'custom',
  startDate: '2026-06-01',
  endDate: '2026-06-15',
  expectedIncome: 25000,
  status: 'planned',
}

const monthlyCutoff = {
  name: 'Monthly Salary Cycle',
  type: 'monthly',
  payday1: 25,
  expectedIncome: 50000,
  referenceDate: '2026-06-20',
  status: 'planned',
}

const semiMonthlyCutoff = {
  name: 'Semi-monthly Salary Cycle',
  type: 'semi_monthly',
  payday1: 10,
  payday2: 25,
  expectedIncome: 25000,
  referenceDate: '2026-06-20',
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

describe('cutoff cycle generation', () => {
  it('generates monthly current and next cycles', () => {
    expect(
      generateMonthlyCycle({ payday1: 25, referenceDate: '2026-06-20' }),
    ).toEqual({
      startDate: '2026-05-25',
      endDate: '2026-06-24',
    })

    expect(
      generateMonthlyCycle({ payday1: 25, referenceDate: '2026-06-25' }),
    ).toEqual({
      startDate: '2026-06-25',
      endDate: '2026-07-24',
    })

    expect(
      generateNextMonthlyCycle({ payday1: 25, referenceDate: '2026-06-20' }),
    ).toEqual({
      startDate: '2026-06-25',
      endDate: '2026-07-24',
    })
  })

  it('generates semi-monthly cycles for 10/25 and 15/30 paydays', () => {
    expect(
      generateSemiMonthlyCycle({
        payday1: 10,
        payday2: 25,
        referenceDate: '2026-06-20',
      }),
    ).toEqual({
      startDate: '2026-06-10',
      endDate: '2026-06-24',
    })

    expect(
      generateNextSemiMonthlyCycle({
        payday1: 10,
        payday2: 25,
        referenceDate: '2026-06-20',
      }),
    ).toEqual({
      startDate: '2026-06-25',
      endDate: '2026-07-09',
    })

    expect(
      generateSemiMonthlyCycle({
        payday1: 15,
        payday2: 30,
        referenceDate: '2026-06-30',
      }),
    ).toEqual({
      startDate: '2026-06-30',
      endDate: '2026-07-14',
    })
  })

  it('clamps payday dates to the last day of short months', () => {
    expect(
      generateMonthlyCycle({ payday1: 31, referenceDate: '2026-02-20' }),
    ).toEqual({
      startDate: '2026-01-31',
      endDate: '2026-02-27',
    })

    expect(
      generateSemiMonthlyCycle({
        payday1: 15,
        payday2: 31,
        referenceDate: '2026-04-30',
      }),
    ).toEqual({
      startDate: '2026-04-30',
      endDate: '2026-05-14',
    })
  })
})

describe('cutoffService', () => {
  it('creates, updates, and deletes generated salary cutoffs', async () => {
    const createdCutoff = await cutoffService.createCutoff(monthlyCutoff)

    expect(createdCutoff).toMatchObject({
      endDate: '2026-06-24',
      expectedIncome: 50000,
      payday1: 25,
      payday2: null,
      startDate: '2026-05-25',
      status: 'planned',
      type: 'monthly',
    })

    const updatedCutoff = await cutoffService.updateCutoff(createdCutoff.id, {
      name: monthlyCutoff.name,
      type: monthlyCutoff.type,
      expectedIncome: 55000,
      payday1: 30,
      status: 'active',
    })

    expect(updatedCutoff).toMatchObject({
      id: createdCutoff.id,
      createdAt: createdCutoff.createdAt,
      expectedIncome: 55000,
      payday1: 30,
      startDate: '2026-04-30',
      status: 'active',
    })

    await cutoffService.deleteCutoff(createdCutoff.id)

    expect(await salaryCutoffRepository.findById(createdCutoff.id)).toBeUndefined()
  })

  it('stores semi-monthly generated dates and paydays', async () => {
    await expect(cutoffService.createCutoff(semiMonthlyCutoff)).resolves.toMatchObject({
      endDate: '2026-06-24',
      payday1: 10,
      payday2: 25,
      startDate: '2026-06-10',
    })
  })

  it('stores custom dates and null payday fields', async () => {
    await expect(
      cutoffService.createCutoff({
        ...customCutoff,
        payday1: 10,
        payday2: 25,
      }),
    ).resolves.toMatchObject({
      endDate: '2026-06-15',
      payday1: null,
      payday2: null,
      startDate: '2026-06-01',
      type: 'custom',
    })
  })

  it('rejects legacy weekly and irregular cutoff saves', async () => {
    await expect(
      cutoffService.createCutoff({
        ...customCutoff,
        type: 'weekly',
      }),
    ).rejects.toThrow()

    await expect(
      cutoffService.createCutoff({
        ...customCutoff,
        type: 'irregular',
      }),
    ).rejects.toThrow()
  })

  it('prevents overlapping cutoff date ranges', async () => {
    await cutoffService.createCutoff(customCutoff)

    await expect(
      cutoffService.createCutoff({
        ...customCutoff,
        name: 'Overlapping Window',
        startDate: '2026-06-10',
        endDate: '2026-06-30',
      }),
    ).rejects.toThrow('overlap')
  })

  it('keeps only one active salary cutoff', async () => {
    const firstCutoff = await cutoffService.createCutoff({
      ...customCutoff,
      status: 'active',
    })
    const secondCutoff = await cutoffService.createCutoff({
      ...customCutoff,
      name: 'June Second Half',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
    })

    await cutoffService.markCutoffActive(secondCutoff.id)

    await expect(
      salaryCutoffRepository.findById(firstCutoff.id),
    ).resolves.toMatchObject({ status: 'planned' })
    await expect(
      salaryCutoffRepository.findById(secondCutoff.id),
    ).resolves.toMatchObject({ status: 'active' })
  })

  it('detects explicit active cutoff before date-matching cutoffs', async () => {
    const dateMatchingCutoff = await cutoffService.createCutoff(customCutoff)
    const activeCutoff = await cutoffService.createCutoff({
      ...customCutoff,
      name: 'June Second Half',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      status: 'active',
    })

    await expect(cutoffService.findCurrentCutoff('2026-06-10')).resolves.toMatchObject({
      id: activeCutoff.id,
    })
    expect(dateMatchingCutoff.id).not.toBe(activeCutoff.id)
  })

  it('detects the newest date-matching cutoff when no explicit active cutoff exists', async () => {
    await salaryCutoffRepository.create({
      ...customCutoff,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const newerCutoffId = await salaryCutoffRepository.create({
      ...customCutoff,
      name: 'June Custom Window',
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
      ...customCutoff,
      status: 'active',
    })

    await expect(cutoffService.closeCutoff(cutoff.id)).resolves.toMatchObject({
      status: 'closed',
    })
  })

  it('creates the next monthly cutoff from the selected cutoff end date', async () => {
    const cutoff = await cutoffService.createCutoff({
      ...monthlyCutoff,
      referenceDate: '2026-06-25',
      status: 'active',
    })

    await expect(cutoffService.createNextCutoff(cutoff.id)).resolves.toMatchObject({
      expectedIncome: 50000,
      payday1: 25,
      payday2: null,
      startDate: '2026-07-25',
      endDate: '2026-08-24',
      status: 'planned',
      type: 'monthly',
    })
  })

  it('creates the next semi-monthly cutoff from the selected cutoff end date', async () => {
    const cutoff = await cutoffService.createCutoff({
      ...semiMonthlyCutoff,
      referenceDate: '2026-06-25',
      status: 'active',
    })

    await expect(cutoffService.createNextCutoff(cutoff.id)).resolves.toMatchObject({
      expectedIncome: 25000,
      payday1: 10,
      payday2: 25,
      startDate: '2026-07-10',
      endDate: '2026-07-24',
      status: 'planned',
      type: 'semi_monthly',
    })
  })

  it('prevents creating an overlapping next cutoff', async () => {
    const cutoff = await cutoffService.createCutoff({
      ...monthlyCutoff,
      referenceDate: '2026-06-25',
      status: 'active',
    })
    await cutoffService.createCutoff({
      ...customCutoff,
      name: 'Existing Next Window',
      startDate: '2026-07-25',
      endDate: '2026-08-24',
    })

    await expect(cutoffService.createNextCutoff(cutoff.id)).rejects.toThrow('overlap')
    await expect(salaryCutoffRepository.findAll()).resolves.toHaveLength(2)
  })

  it('does not create next cutoff for custom cutoffs', async () => {
    const cutoff = await cutoffService.createCutoff(customCutoff)

    await expect(cutoffService.createNextCutoff(cutoff.id)).rejects.toThrow(
      'Only Monthly and Semi-monthly cutoffs can generate a next cutoff',
    )
  })

  it('assigns unlinked expenses inside the generated cutoff date range only', async () => {
    const cutoff = await cutoffService.createCutoff(semiMonthlyCutoff)
    const insideExpenseId = await expenseRepository.create({
      amount: 500,
      merchant: 'Jollibee',
      categoryId: 'food',
      paymentMethod: 'Cash',
      date: '2026-06-20',
      cutoffId: null,
      emotionTag: 'Normal',
      note: 'Lunch',
      source: 'manual',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    })
    const outsideExpenseId = await expenseRepository.create({
      amount: 700,
      merchant: 'Meralco',
      categoryId: 'bills',
      paymentMethod: 'Bank Transfer',
      date: '2026-06-25',
      cutoffId: null,
      emotionTag: 'Normal',
      note: 'Utilities',
      source: 'manual',
      createdAt: '2026-06-25T00:00:00.000Z',
      updatedAt: '2026-06-25T00:00:00.000Z',
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
