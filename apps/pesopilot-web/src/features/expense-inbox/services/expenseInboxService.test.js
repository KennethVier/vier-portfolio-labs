import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { merchantRuleRepository } from '@/lib/db/repositories/merchantRuleRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

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
    payday1: 16,
    payday2: 31,
    type: 'semi_monthly',
    updatedAt: '2026-06-01T00:00:00.000Z',
  }
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

  it('assigns approved expenses to the current cutoff when one exists', async () => {
    const cutoff = await cutoffService.createCutoff(createCurrentCutoffPayload('June current cycle'))
    const inboxId = await createDetectedExpense()

    const result = await expenseInboxService.approveInboxRecord(inboxId)

    expect(result.expense).toMatchObject({
      cutoffId: cutoff.id,
      source: 'expense_inbox',
    })
    await expect(expenseRepository.findAll()).resolves.toEqual([
      expect.objectContaining({
        cutoffId: cutoff.id,
      }),
    ])
  })

  it('requires a payment method before approving a record', async () => {
    const inboxId = await createDetectedExpense({
      suggestedPaymentMethod: null,
    })

    await expect(
      expenseInboxService.approveInboxRecord(inboxId),
    ).rejects.toThrow('Payment method is required before approving this expense')
    await expect(expenseRepository.findAll()).resolves.toHaveLength(0)
    await expect(detectedExpenseRepository.findById(inboxId)).resolves.toMatchObject({
      status: INBOX_STATUS.pending,
    })
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

  it('preserves category source metadata when loading and approving records', async () => {
    const inboxId = await createDetectedExpense({
      categorySource: 'merchant_rule',
      merchantRuleId: 42,
    })

    await expect(expenseInboxService.loadInbox()).resolves.toMatchObject({
      records: [
        expect.objectContaining({
          categorySource: 'merchant_rule',
          merchantRuleId: 42,
        }),
      ],
    })

    const result = await expenseInboxService.approveInboxRecord(inboxId)

    expect(result.inboxRecord).toMatchObject({
      categorySource: 'merchant_rule',
      merchantRuleId: 42,
      status: INBOX_STATUS.approved,
    })
  })

  it('learns a user merchant rule when category is corrected before approval', async () => {
    const inboxId = await createDetectedExpense({
      merchant: 'Starbucks',
      suggestedCategoryId: 'food',
    })

    await expenseInboxService.approveInboxRecord(inboxId, {
      ...baseDetectedExpense,
      merchant: 'Starbucks',
      rememberMerchantRule: true,
      suggestedCategoryId: 'shopping',
    })

    await expect(merchantRuleRepository.findAll()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: 'shopping',
          keyword: 'Starbucks',
          source: 'user',
        }),
      ]),
    )
    await expect(detectedExpenseRepository.findById(inboxId)).resolves
      .toMatchObject({
        categorySource: 'manual_override',
        status: INBOX_STATUS.approved,
      })
  })

  it('does not learn merchant rules for unknown merchants', async () => {
    const inboxId = await createDetectedExpense({
      merchant: 'Unknown Merchant',
      suggestedCategoryId: 'other',
    })

    await expenseInboxService.updateInboxRecord(inboxId, {
      ...baseDetectedExpense,
      merchant: 'Unknown Merchant',
      rememberMerchantRule: true,
      suggestedCategoryId: 'food',
    })

    await expect(merchantRuleRepository.findAll()).resolves.not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          keyword: 'Unknown Merchant',
          source: 'user',
        }),
      ]),
    )
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
