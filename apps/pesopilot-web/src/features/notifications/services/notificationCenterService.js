import { INBOX_STATUS } from '@/features/expense-inbox/constants/expenseInboxConstants.js'
import { cutoffWorkflowReminderService } from '@/features/salary-cutoff/services/cutoffWorkflowReminderService.js'
import { detectedExpenseRepository } from '@/lib/db/repositories/detectedExpenseRepository.js'

const INDIVIDUAL_INBOX_NOTIFICATION_LIMIT = 3
const NOTIFICATION_BADGE_CAP = 10

function sortPendingInboxRecords(records) {
  return [...records].sort((firstRecord, secondRecord) => {
    const firstCreated = firstRecord.createdAt ?? ''
    const secondCreated = secondRecord.createdAt ?? ''

    if (firstCreated !== secondCreated) {
      return secondCreated.localeCompare(firstCreated)
    }

    return (secondRecord.id ?? 0) - (firstRecord.id ?? 0)
  })
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    style: 'currency',
  }).format(Number(amount) || 0)
}

function buildInboxNotification(record) {
  return {
    actionLabel: 'Review Expense',
    dismissible: false,
    id: `pending-inbox-${record.id}`,
    message: `${record.merchant ?? 'Expense'} for ${formatAmount(record.amount)} is waiting for approval.`,
    priority: 5,
    storageKey: null,
    title: record.merchant ?? 'Pending expense review',
    to: '/expense-inbox',
    type: 'pending_inbox_review',
  }
}

function buildGroupedInboxNotification(records) {
  return {
    actionLabel: 'Open Expense Inbox',
    dismissible: false,
    id: 'pending-inbox-group',
    message: `You have ${records.length} expenses waiting for approval.`,
    pendingCount: records.length,
    priority: 5,
    storageKey: null,
    title: `Pending Expense Reviews (${records.length})`,
    to: '/expense-inbox',
    type: 'pending_inbox_group',
  }
}

function buildInboxNotifications(records) {
  const pendingRecords = sortPendingInboxRecords(
    records.filter((record) => record.status === INBOX_STATUS.pending),
  )

  if (pendingRecords.length > INDIVIDUAL_INBOX_NOTIFICATION_LIMIT) {
    return {
      activeCount: pendingRecords.length,
      notifications: [buildGroupedInboxNotification(pendingRecords)],
    }
  }

  return {
    activeCount: pendingRecords.length,
    notifications: pendingRecords.map(buildInboxNotification),
  }
}

function getBadgeLabel(count) {
  return count > NOTIFICATION_BADGE_CAP ? `${NOTIFICATION_BADGE_CAP}+` : String(count)
}

export const notificationCenterService = {
  async loadNotifications(options = {}) {
    const [workflowNotifications, inboxRecords] = await Promise.all([
      cutoffWorkflowReminderService.loadReminders(options),
      detectedExpenseRepository.findAll(),
    ])
    const inboxResult = buildInboxNotifications(inboxRecords)
    const activeCount = workflowNotifications.length + inboxResult.activeCount

    return {
      activeCount,
      badgeLabel: activeCount > 0 ? getBadgeLabel(activeCount) : '',
      notifications: [...workflowNotifications, ...inboxResult.notifications],
    }
  },

  dismissNotification(notification, options = {}) {
    cutoffWorkflowReminderService.dismissReminder(notification, options)
  },
}

export const notificationCenterServiceInternals = {
  buildGroupedInboxNotification,
  buildInboxNotification,
  buildInboxNotifications,
  getBadgeLabel,
  sortPendingInboxRecords,
}
