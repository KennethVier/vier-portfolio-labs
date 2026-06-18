import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { INBOX_STATUS } from '../constants/expenseInboxConstants.js'
import { expenseInboxService } from './expenseInboxService.js'

const baseDetectedExpense = {
  amount: 250,
  confidence: 0.92,
  createdAt: '2026-06-18T08:00:00.000Z',
  merchant: 'McDonalds',
  note: 'Lunch',
  rawText: 'McDonalds PHP 250 lunch',
  reviewedAt: null,
  source: 'receipt_scan',
  status: INBOX_STATUS.pending,
  suggestedCategoryId: 'food',
  suggestedPaymentMethod: 'Cash',
  transactionDate: '2026-06-18',
  updatedAt: '2026-06-18T08:00:00.000Z',
}

async function createDetectedExpense(overrides = {}) {
  return detectedExpenseRepository.create({
    ...baseDetectedExpense,
    ...overrides,
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

describe('expenseInboxService', () => {
  it('loads an empty inbox state', async () => {
    const inbox = await expenseInboxService.loadInbox()

    expect(inbox.records).toHaveLength(0)
    expect(inbox.kpis).toMatchObject({
      approvedToday: 0,
      pending: 0,
      rejectedToday: 0,
      total: 0,
    })
  })

  it('approves a pending record and converts it into an expense', async () => {
    const inboxId = await createDetectedExpense()

    const result = await expenseInboxService.approveInboxRecord(inboxId)
    const expenses = await expenseRepository.findAll()
    const inboxRecord = await detectedExpenseRepository.findById(inboxId)

    expect(result.expense).toMatchObject({
      amount: 250,
      categoryId: 'food',
      date: '2026-06-18',
      merchant: 'McDonalds',
      paymentMethod: 'Cash',
      source: 'expense_inbox',
    })
    expect(expenses).toHaveLength(1)
    expect(inboxRecord).toMatchObject({
      status: INBOX_STATUS.approved,
    })
    expect(inboxRecord.reviewedAt).toBeTruthy()
  })

  it('rejects a pending record without creating an expense', async () => {
    const inboxId = await createDetectedExpense()

    await expenseInboxService.rejectInboxRecord(inboxId)

    await expect(expenseRepository.findAll()).resolves.toHaveLength(0)
    await expect(detectedExpenseRepository.findById(inboxId)).resolves.toMatchObject({
      status: INBOX_STATUS.rejected,
    })
  })

  it('edits a pending record before approval', async () => {
    const inboxId = await createDetectedExpense()

    await expenseInboxService.updateInboxRecord(inboxId, {
      ...baseDetectedExpense,
      amount: 400,
      merchant: 'Meralco',
      note: 'Edited bill',
      suggestedCategoryId: 'bills',
      suggestedPaymentMethod: 'Bank Transfer',
      transactionDate: '2026-06-20',
    })

    await expenseInboxService.approveInboxRecord(inboxId)

    await expect(expenseRepository.findAll()).resolves.toEqual([
      expect.objectContaining({
        amount: 400,
        categoryId: 'bills',
        date: '2026-06-20',
        merchant: 'Meralco',
        note: 'Edited bill',
        paymentMethod: 'Bank Transfer',
      }),
    ])
  })

  it('prevents duplicate approval after a status transition', async () => {
    const inboxId = await createDetectedExpense()

    await expenseInboxService.approveInboxRecord(inboxId)

    await expect(
      expenseInboxService.approveInboxRecord(inboxId),
    ).rejects.toThrow('Only pending inbox records can be approved')
    await expect(expenseRepository.findAll()).resolves.toHaveLength(1)
  })

  it('filters by search, status, category, and date range', async () => {
    await createDetectedExpense()
    await createDetectedExpense({
      createdAt: '2026-06-16T08:00:00.000Z',
      merchant: 'Meralco',
      note: 'Utilities',
      source: 'manual_input',
      status: INBOX_STATUS.rejected,
      suggestedCategoryId: 'bills',
      transactionDate: '2026-06-16',
    })
    await createDetectedExpense({
      createdAt: '2026-05-10T08:00:00.000Z',
      merchant: 'Shopee',
      note: 'Office supplies',
      source: 'email_parse',
      suggestedCategoryId: 'shopping',
      transactionDate: '2026-05-10',
    })

    await expect(
      expenseInboxService.loadInbox({ search: 'utilities' }),
    ).resolves.toMatchObject({ records: [expect.objectContaining({ merchant: 'Meralco' })] })
    await expect(
      expenseInboxService.loadInbox({ status: INBOX_STATUS.pending }),
    ).resolves.toMatchObject({ records: expect.arrayContaining([
      expect.objectContaining({ merchant: 'McDonalds' }),
      expect.objectContaining({ merchant: 'Shopee' }),
    ]) })
    await expect(
      expenseInboxService.loadInbox({ categoryId: 'shopping' }),
    ).resolves.toMatchObject({ records: [expect.objectContaining({ merchant: 'Shopee' })] })
    await expect(
      expenseInboxService.loadInbox({
        endDate: '2026-06-30',
        startDate: '2026-06-01',
      }),
    ).resolves.toMatchObject({
      records: expect.not.arrayContaining([
        expect.objectContaining({ merchant: 'Shopee' }),
      ]),
    })
  })
})
