import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'

import { cutoffWorkflowReminderService } from './cutoffWorkflowReminderService.js'

class MemoryStorage {
  constructor() {
    this.items = new Map()
  }

  getItem(key) {
    return this.items.get(key) ?? null
  }

  setItem(key, value) {
    this.items.set(key, value)
  }
}

async function createActiveCutoff() {
  return salaryCutoffRepository.create({
    createdAt: '2026-06-01T00:00:00.000Z',
    endDate: '2026-06-30',
    expectedIncome: 40000,
    name: 'Active Cutoff',
    startDate: '2026-06-16',
    status: 'active',
    type: 'semi_monthly',
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

describe('cutoffWorkflowReminderService', () => {
  it('returns no reminders when there is no current cutoff', async () => {
    await expect(
      cutoffWorkflowReminderService.loadReminders({
        storage: new MemoryStorage(),
      }),
    ).resolves.toEqual([])
  })

  it('shows no-income reminder when current cutoff has no income', async () => {
    const cutoffId = await createActiveCutoff()

    await expect(
      cutoffWorkflowReminderService.loadReminders({
        storage: new MemoryStorage(),
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        cutoffId,
        title: 'New cutoff cycle started',
        type: 'no_income',
      }),
    ])
  })

  it('shows savings allocation reminder when income exists but savings do not', async () => {
    const cutoffId = await createActiveCutoff()
    await incomeService.createIncome({
      amount: 40000,
      cutoffId,
      date: '2026-06-20',
      note: 'Main pay',
      source: 'Salary',
    })

    await expect(
      cutoffWorkflowReminderService.loadReminders({
        storage: new MemoryStorage(),
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        actionLabel: 'Add Savings',
        cutoffId,
        type: 'no_savings',
      }),
    ])
  })

  it('suppresses a dismissed reminder for the same cutoff', async () => {
    await createActiveCutoff()
    const storage = new MemoryStorage()
    const [reminder] = await cutoffWorkflowReminderService.loadReminders({
      storage,
    })

    cutoffWorkflowReminderService.dismissReminder(reminder, { storage })

    await expect(
      cutoffWorkflowReminderService.loadReminders({ storage }),
    ).resolves.toEqual([])
  })

  it('does not show reminders when current cutoff has income and savings', async () => {
    const cutoffId = await createActiveCutoff()
    await incomeService.createIncome({
      amount: 40000,
      cutoffId,
      date: '2026-06-20',
      note: 'Main pay',
      source: 'Salary',
    })
    await savingsService.createSavings({
      amount: 5000,
      cutoffId,
      date: '2026-06-21',
      note: 'Cycle allocation',
      source: 'Emergency Fund',
    })

    await expect(
      cutoffWorkflowReminderService.loadReminders({
        storage: new MemoryStorage(),
      }),
    ).resolves.toEqual([])
  })
})
