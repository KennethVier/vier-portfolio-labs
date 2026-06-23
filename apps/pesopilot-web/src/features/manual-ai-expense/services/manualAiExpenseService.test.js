import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { expenseInboxService } from '@/features/expense-inbox/services/expenseInboxService.js'
import { merchantRuleService } from '@/features/merchant-rules/services/merchantRuleService.js'

import { MANUAL_AI_DETECTED_SOURCE } from '../utils/expenseTextParser.js'
import { manualAiExpenseService } from './manualAiExpenseService.js'

beforeEach(async () => {
  await db.open()
  await clearDatabase()
  await seedDatabase()
})

afterEach(async () => {
  await clearDatabase()
  db.close()
})

describe('manualAiExpenseService', () => {
  it('creates a pending detected expense record from a parsed result', async () => {
    const parsedResult = await manualAiExpenseService.parseWithMerchantRules(
      'Bought Jollibee for 250 yesterday using GCash',
      { referenceDate: '2026-06-21' },
    )

    const createdRecord =
      await manualAiExpenseService.submitToInbox(parsedResult)
    const records = await detectedExpenseRepository.findAll()

    expect(createdRecord).toMatchObject({
      amount: 250,
      merchant: 'Jollibee',
      rawText: 'Bought Jollibee for 250 yesterday using GCash',
      source: MANUAL_AI_DETECTED_SOURCE,
      status: 'PENDING',
      categorySource: 'merchant_rule',
      suggestedCategoryId: 'food',
      suggestedPaymentMethod: 'GCash',
      transactionDate: '2026-06-20',
    })
    expect(createdRecord.merchantRuleId).toBeTruthy()
    expect(records).toHaveLength(1)
  })

  it('uses merchant rules to override parser category guesses', async () => {
    await merchantRuleService.learnCategoryCorrection({
      categoryId: 'shopping',
      merchant: 'Starbucks',
    })

    const parsedResult = await manualAiExpenseService.parseWithMerchantRules(
      'Coffee at Starbucks 180 today cash',
      { referenceDate: '2026-06-21' },
    )

    expect(parsedResult).toMatchObject({
      categoryName: 'Shopping',
      categorySource: 'merchant_rule',
      suggestedCategoryId: 'shopping',
    })
    expect(parsedResult.merchantRuleId).toBeTruthy()
  })

  it('does not create an official expense when submitting to the inbox', async () => {
    const parsedResult = manualAiExpenseService.parse(
      'Paid Meralco bill 1850 today',
      { referenceDate: '2026-06-21' },
    )

    await manualAiExpenseService.submitToInbox(parsedResult)

    await expect(expenseRepository.findAll()).resolves.toHaveLength(0)
  })

  it('still routes approval through the existing Expense Inbox workflow', async () => {
    const parsedResult = manualAiExpenseService.parse(
      'Grab ride 320 from office to home',
      { referenceDate: '2026-06-21' },
    )
    const createdRecord =
      await manualAiExpenseService.submitToInbox(parsedResult)

    await expenseInboxService.approveInboxRecord(createdRecord.id, {
      ...createdRecord,
      suggestedPaymentMethod: 'Cash',
    })

    await expect(expenseRepository.findAll()).resolves.toEqual([
      expect.objectContaining({
        amount: 320,
        categoryId: 'transport',
        merchant: 'Grab',
        paymentMethod: 'Cash',
        source: 'expense_inbox',
      }),
    ])
    await expect(detectedExpenseRepository.findById(createdRecord.id)).resolves
      .toMatchObject({
        source: MANUAL_AI_DETECTED_SOURCE,
        status: 'APPROVED',
      })
  })
})
