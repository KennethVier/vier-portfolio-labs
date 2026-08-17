import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsGoalRepository } from '@/lib/db/repositories/savingsGoalRepository.js'
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

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)
  return nextDate
}

function createCurrentCutoffPayload(name = 'Active Cutoff') {
  const today = new Date()

  return {
    createdAt: '2026-06-01T00:00:00.000Z',
    endDate: formatIsoDate(addDays(today, 7)),
    expectedIncome: 40000,
    name,
    startDate: formatIsoDate(addDays(today, -7)),
    status: 'active',
    type: 'semi_monthly',
    updatedAt: '2026-06-01T00:00:00.000Z',
  }
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
  it('creates, edits, archives, and deletes empty savings goals', async () => {
    const createdGoal = await savingsService.createSavingsGoal({
      name: 'Emergency Fund',
      targetAmount: 100000,
      targetDate: '2026-12-31',
      priority: 'high',
      status: 'active',
      note: 'Safety net',
    })

    expect(createdGoal).toMatchObject({
      name: 'Emergency Fund',
      priority: 'high',
      status: 'active',
      targetAmount: 100000,
    })

    const updatedGoal = await savingsService.updateSavingsGoal(createdGoal.id, {
      name: 'Emergency Buffer',
      targetAmount: 120000,
      targetDate: '',
      priority: 'medium',
      status: 'paused',
      note: '',
    })

    expect(updatedGoal).toMatchObject({
      createdAt: createdGoal.createdAt,
      name: 'Emergency Buffer',
      priority: 'medium',
      status: 'paused',
      targetAmount: 120000,
      targetDate: null,
    })

    const archivedGoal = await savingsService.archiveSavingsGoal(createdGoal.id)
    expect(archivedGoal.status).toBe('archived')

    await savingsService.deleteSavingsGoal(createdGoal.id)
    await expect(savingsGoalRepository.findById(createdGoal.id)).resolves.toBeUndefined()
  })

  it('blocks deleting savings goals with contributions', async () => {
    const goal = await savingsService.createSavingsGoal({
      name: 'Travel Fund',
      targetAmount: 50000,
      targetDate: '2026-10-01',
      priority: 'low',
      status: 'active',
      note: '',
    })
    await savingsService.createSavings({
      ...validSavings,
      goalId: goal.id,
      source: 'Travel Fund',
    })

    await expect(savingsService.deleteSavingsGoal(goal.id)).rejects.toThrow(
      'Archive the goal instead',
    )
    await expect(savingsGoalRepository.findById(goal.id)).resolves.toMatchObject({
      id: goal.id,
      status: 'active',
    })
  })

  it('derives savings goal totals and goal met status from linked contributions', async () => {
    const goal = await savingsService.createSavingsGoal({
      name: 'House Fund',
      targetAmount: 10000,
      targetDate: '2026-09-01',
      priority: 'high',
      status: 'active',
      note: '',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 4000,
      date: '2026-06-10',
      goalId: goal.id,
      source: 'House Fund',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 6500,
      date: '2026-06-20',
      goalId: goal.id,
      source: 'House Fund',
    })

    await expect(savingsService.loadSavingsGoals()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contributionCount: 2,
          goalMet: true,
          latestContributionDate: '2026-06-20',
          progress: 100,
          remainingAmount: 0,
          totalSaved: 10500,
        }),
      ]),
    )
  })

  it('filters contributions by goal and labels legacy savings as General Savings', async () => {
    const goal = await savingsService.createSavingsGoal({
      name: 'Education',
      targetAmount: '',
      targetDate: '',
      priority: 'medium',
      status: 'active',
      note: '',
    })
    const goalSavings = await savingsService.createSavings({
      ...validSavings,
      goalId: goal.id,
      source: 'Education',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 1000,
      goalId: '',
      source: 'General Savings',
    })

    await expect(savingsService.loadSavings({ goalId: goal.id })).resolves.toEqual([
      expect.objectContaining({
        id: goalSavings.id,
        goalId: goal.id,
        goalName: 'Education',
      }),
    ])

    await expect(savingsService.loadSavings({ source: 'General Savings' })).resolves.toEqual([
      expect.objectContaining({
        goalId: null,
        goalName: 'General Savings',
      }),
    ])
  })

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

  it('defaults new savings to the current cutoff when cutoffId is empty', async () => {
    const activeCutoffId = await salaryCutoffRepository.create(
      createCurrentCutoffPayload(),
    )

    const createdSavings = await savingsService.createSavings(validSavings)

    expect(createdSavings.cutoffId).toBe(activeCutoffId)
  })

  it('does not override a user-selected cutoff when creating savings', async () => {
    await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-06-16',
      endDate: '2026-06-30',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    const selectedCutoffId = await salaryCutoffRepository.create({
      name: 'Selected Cutoff',
      type: 'semi_monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      expectedIncome: 40000,
      status: 'planned',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const createdSavings = await savingsService.createSavings({
      ...validSavings,
      cutoffId: selectedCutoffId,
    })

    expect(createdSavings.cutoffId).toBe(selectedCutoffId)
  })

  it('does not auto-assign current cutoff during savings updates', async () => {
    const selectedCutoffId = await createCutoff('Selected Cutoff')
    const createdSavings = await savingsService.createSavings({
      ...validSavings,
      cutoffId: selectedCutoffId,
    })
    await salaryCutoffRepository.create({
      name: 'Active Cutoff',
      type: 'semi_monthly',
      startDate: '2026-07-01',
      endDate: '2026-07-15',
      expectedIncome: 40000,
      status: 'active',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })

    const updatedSavings = await savingsService.updateSavings(createdSavings.id, {
      ...validSavings,
      amount: 7000,
      cutoffId: '',
    })

    expect(updatedSavings).toMatchObject({
      amount: 7000,
      cutoffId: null,
    })
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

  it('calculates current-cutoff savings KPIs independently from table filters', async () => {
    const activeCutoffId = await salaryCutoffRepository.create(
      createCurrentCutoffPayload(),
    )
    const historicalCutoffId = await createCutoff('Historical Cutoff')
    const deletedCutoffId = await createCutoff('Deleted Cutoff')

    await savingsService.createSavings({
      ...validSavings,
      amount: 5000,
      cutoffId: activeCutoffId,
      source: 'Emergency Fund',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 2000,
      cutoffId: activeCutoffId,
      source: 'Travel Fund',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 6000,
      cutoffId: historicalCutoffId,
      source: 'Emergency Fund',
    })
    await savingsService.createSavings({
      ...validSavings,
      amount: 3000,
      cutoffId: deletedCutoffId,
      source: 'General Savings',
    })
    await savingsRepository.create({
      amount: 1000,
      createdAt: '2026-06-01T00:00:00.000Z',
      cutoffId: null,
      date: validSavings.date,
      note: validSavings.note,
      source: 'Other',
      updatedAt: '2026-06-01T00:00:00.000Z',
    })
    await salaryCutoffRepository.remove(deletedCutoffId)

    await expect(savingsService.loadSavings({ source: 'Travel Fund' })).resolves.toHaveLength(1)
    await expect(savingsService.loadSavingsKpis()).resolves.toEqual({
      currentCutoffId: activeCutoffId,
      largestSavingsType: 'Emergency Fund',
      savingsRecords: 2,
      totalSavings: 7000,
    })
  })

  it('returns zero savings KPIs when no current cutoff exists', async () => {
    await savingsService.createSavings(validSavings)

    await expect(savingsService.loadSavingsKpis()).resolves.toEqual({
      currentCutoffId: null,
      largestSavingsType: 'None',
      savingsRecords: 0,
      totalSavings: 0,
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
