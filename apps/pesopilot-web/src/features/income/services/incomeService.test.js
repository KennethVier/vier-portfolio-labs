import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { DELETED_CUTOFF_LABEL, incomeService } from './incomeService.js'

const validIncome = {
  amount: 25000,
  source: 'Salary',
  date: '2026-06-15',
  cutoffId: '',
  note: 'Main pay',
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

describe('incomeService', () => {
  it('loads salary cutoffs for association', async () => {
    const cutoffId = await createCutoff()

    await expect(incomeService.loadSalaryCutoffs()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: cutoffId, name: 'June Second Half' }),
      ]),
    )
  })

  it('creates, updates, and deletes income through the repository layer', async () => {
    const cutoffId = await createCutoff()
    const createdIncome = await incomeService.createIncome({
      ...validIncome,
      cutoffId,
    })

    expect(createdIncome).toMatchObject({
      amount: 25000,
      source: 'Salary',
      cutoffId,
      note: 'Main pay',
    })

    const updatedIncome = await incomeService.updateIncome(createdIncome.id, {
      ...validIncome,
      amount: 30000,
      source: 'Bonus',
      cutoffId,
      note: 'Performance bonus',
    })

    expect(updatedIncome).toMatchObject({
      id: createdIncome.id,
      amount: 30000,
      source: 'Bonus',
      createdAt: createdIncome.createdAt,
    })

    await incomeService.deleteIncome(createdIncome.id)

    expect(await incomeRepository.findById(createdIncome.id)).toBeUndefined()
  })

  it('sorts income by date, createdAt, and id descending', async () => {
    await incomeRepository.create({
      ...validIncome,
      date: '2026-06-15',
      createdAt: '2026-06-15T08:00:00.000Z',
      updatedAt: '2026-06-15T08:00:00.000Z',
    })
    const newestCreatedId = await incomeRepository.create({
      ...validIncome,
      source: 'Bonus',
      date: '2026-06-15',
      createdAt: '2026-06-15T09:00:00.000Z',
      updatedAt: '2026-06-15T09:00:00.000Z',
    })
    const newestDateId = await incomeRepository.create({
      ...validIncome,
      source: 'Freelance',
      date: '2026-06-20',
      createdAt: '2026-06-15T07:00:00.000Z',
      updatedAt: '2026-06-15T07:00:00.000Z',
    })

    const income = await incomeService.loadIncome()

    expect(income.map((record) => record.id).slice(0, 2)).toEqual([
      newestDateId,
      newestCreatedId,
    ])
  })

  it('searches income by source and note case-insensitively', async () => {
    await incomeService.createIncome(validIncome)
    await incomeService.createIncome({
      ...validIncome,
      amount: 5000,
      source: 'Freelance',
      date: '2026-06-20',
      note: 'Client retainer',
    })

    await expect(incomeService.loadIncome({ search: 'salary' })).resolves.toHaveLength(1)
    await expect(incomeService.loadIncome({ search: 'CLIENT' })).resolves.toHaveLength(1)
  })

  it('filters income by cutoff, source, and date range together', async () => {
    const cutoffId = await createCutoff()
    await incomeService.createIncome({
      ...validIncome,
      cutoffId,
      date: '2026-06-20',
    })
    await incomeService.createIncome({
      ...validIncome,
      source: 'Bonus',
      date: '2026-05-30',
    })
    await incomeService.createIncome({
      ...validIncome,
      source: 'Salary',
      date: '2026-06-01',
    })

    const income = await incomeService.loadIncome({
      cutoffId,
      source: 'Salary',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
    })

    expect(income).toHaveLength(1)
    expect(income[0]).toMatchObject({ cutoffId, date: '2026-06-20' })
  })

  it('shows deleted cutoff fallback without removing historical cutoffId', async () => {
    const cutoffId = await createCutoff()
    const createdIncome = await incomeService.createIncome({
      ...validIncome,
      cutoffId,
    })

    await salaryCutoffRepository.remove(cutoffId)

    const income = await incomeService.loadIncome()

    expect(income[0]).toMatchObject({
      id: createdIncome.id,
      cutoffId,
      cutoffName: DELETED_CUTOFF_LABEL,
    })
  })

  it('calculates current-cutoff income KPIs independently from table filters', async () => {
    const activeCutoffId = await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const historicalCutoffId = await createCutoff('Historical Cutoff')
    const deletedCutoffId = await createCutoff('Deleted Cutoff')

    await incomeService.createIncome({
      ...validIncome,
      amount: 40000,
      cutoffId: activeCutoffId,
      source: 'Salary',
    })
    await incomeService.createIncome({
      ...validIncome,
      amount: 5000,
      cutoffId: activeCutoffId,
      source: 'Freelance',
    })
    await incomeService.createIncome({
      ...validIncome,
      amount: 40000,
      cutoffId: historicalCutoffId,
      source: 'Salary',
    })
    await incomeService.createIncome({
      ...validIncome,
      amount: 3000,
      cutoffId: deletedCutoffId,
      source: 'Bonus',
    })
    await incomeService.createIncome({
      ...validIncome,
      amount: 2000,
      cutoffId: '',
      source: 'Gift',
    })
    await salaryCutoffRepository.remove(deletedCutoffId)

    await expect(incomeService.loadIncome({ search: 'Freelance' })).resolves.toHaveLength(1)
    await expect(incomeService.loadIncomeKpis()).resolves.toEqual({
      currentCutoffId: activeCutoffId,
      incomeRecords: 2,
      otherIncome: 5000,
      salaryIncome: 40000,
      totalIncome: 45000,
    })
  })

  it('returns zero income KPIs when no current cutoff exists', async () => {
    await incomeService.createIncome(validIncome)

    await expect(incomeService.loadIncomeKpis()).resolves.toEqual({
      currentCutoffId: null,
      incomeRecords: 0,
      otherIncome: 0,
      salaryIncome: 0,
      totalIncome: 0,
    })
  })

  it('rejects invalid income before persistence', async () => {
    await expect(
      incomeService.createIncome({
        ...validIncome,
        amount: 0,
        source: '',
      }),
    ).rejects.toThrow()

    await expect(incomeRepository.findAll()).resolves.toHaveLength(0)
  })
})
