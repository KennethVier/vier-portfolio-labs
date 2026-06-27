import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { INBOX_STATUS } from '@/features/expense-inbox/constants/expenseInboxConstants.js'
import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'
import { seedDatabase } from '@/lib/db/seed.js'

import {
  notificationCenterService,
  notificationCenterServiceInternals,
} from './notificationCenterService.js'

function pendingRecord(id, createdAt = `2026-06-2${id}T00:00:00.000Z`) {
  return {
    amount: 100 + id,
    createdAt,
    id,
    merchant: `Merchant ${id}`,
    status: INBOX_STATUS.pending,
  }
}

describe('notificationCenterServiceInternals', () => {
  it('caps badge labels at 10+', () => {
    expect(notificationCenterServiceInternals.getBadgeLabel(0)).toBe('0')
    expect(notificationCenterServiceInternals.getBadgeLabel(10)).toBe('10')
    expect(notificationCenterServiceInternals.getBadgeLabel(11)).toBe('10+')
  })

  it('renders one to three pending inbox records individually', () => {
    const result = notificationCenterServiceInternals.buildInboxNotifications([
      pendingRecord(1),
      pendingRecord(2),
      { ...pendingRecord(3), status: INBOX_STATUS.approved },
    ])

    expect(result.activeCount).toBe(2)
    expect(result.notifications).toHaveLength(2)
    expect(result.notifications[0]).toMatchObject({
      dismissible: false,
      type: 'pending_inbox_review',
    })
  })

  it('groups more than three pending inbox records', () => {
    const result = notificationCenterServiceInternals.buildInboxNotifications([
      pendingRecord(1),
      pendingRecord(2),
      pendingRecord(3),
      pendingRecord(4),
    ])

    expect(result.activeCount).toBe(4)
    expect(result.notifications).toEqual([
      expect.objectContaining({
        message: 'You have 4 expenses waiting for approval.',
        title: 'Pending Expense Reviews (4)',
        type: 'pending_inbox_group',
      }),
    ])
  })

  it('sorts pending records newest first', () => {
    expect(
      notificationCenterServiceInternals
        .sortPendingInboxRecords([
          pendingRecord(1, '2026-06-20T00:00:00.000Z'),
          pendingRecord(2, '2026-06-22T00:00:00.000Z'),
          pendingRecord(3, '2026-06-21T00:00:00.000Z'),
        ])
        .map((record) => record.id),
    ).toEqual([2, 3, 1])
  })
})

describe('notificationCenterService', () => {
  beforeEach(async () => {
    await db.open()
    await clearDatabase()
    await seedDatabase()
  })

  afterEach(async () => {
    await clearDatabase()
    db.close()
  })

  it('combines workflow reminders with pending inbox counts', async () => {
    await detectedExpenseRepository.create({
      amount: 385,
      confidence: 0.9,
      createdAt: '2026-06-26T00:00:00.000Z',
      merchant: 'Starbucks',
      rawText: 'Coffee at Starbucks 385',
      reviewedAt: null,
      source: 'manual_ai_input',
      status: INBOX_STATUS.pending,
      suggestedCategoryId: 'food',
      suggestedPaymentMethod: 'Cash',
      transactionDate: '2026-06-26',
      updatedAt: '2026-06-26T00:00:00.000Z',
    })
    await detectedExpenseRepository.create({
      amount: 100,
      confidence: 0.9,
      createdAt: '2026-06-25T00:00:00.000Z',
      merchant: 'Approved',
      rawText: 'Approved expense',
      reviewedAt: '2026-06-25T00:00:00.000Z',
      source: 'manual_ai_input',
      status: INBOX_STATUS.approved,
      suggestedCategoryId: 'food',
      suggestedPaymentMethod: 'Cash',
      transactionDate: '2026-06-25',
      updatedAt: '2026-06-25T00:00:00.000Z',
    })

    const result = await notificationCenterService.loadNotifications()

    expect(result.activeCount).toBe(2)
    expect(result.badgeLabel).toBe('2')
    expect(result.notifications.map((notification) => notification.type)).toEqual([
      'no_current_cutoff',
      'pending_inbox_review',
    ])
  })
})
