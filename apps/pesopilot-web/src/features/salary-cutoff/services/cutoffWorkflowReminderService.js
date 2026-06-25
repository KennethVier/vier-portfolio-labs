import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'

import { cutoffService } from './cutoffService.js'

const STORAGE_PREFIX = 'pesopilot:cutoff-workflow-reminder'

function getStorageKey(type, cutoffId) {
  return `${STORAGE_PREFIX}:${type}:${cutoffId}`
}

function getStorage(storage) {
  if (storage) {
    return storage
  }

  return globalThis.localStorage ?? null
}

function isDismissed(type, cutoffId, storage) {
  const reminderStorage = getStorage(storage)

  if (!reminderStorage) {
    return false
  }

  return reminderStorage.getItem(getStorageKey(type, cutoffId)) === 'dismissed'
}

function buildReminder(type, cutoff) {
  const reminderDetails = {
    no_income: {
      actionLabel: 'Record Income',
      message: 'You have not recorded income for this cycle yet.',
      title: 'New cutoff cycle started',
      to: '/income',
    },
    no_savings: {
      actionLabel: 'Add Savings',
      message:
        "Consider allocating part of this cycle's income to savings before spending.",
      title: 'Income recorded',
      to: '/savings',
    },
  }[type]

  return {
    ...reminderDetails,
    cutoffId: cutoff.id,
    id: `${type}-${cutoff.id}`,
    storageKey: getStorageKey(type, cutoff.id),
    type,
  }
}

export const cutoffWorkflowReminderService = {
  async loadReminders({ storage } = {}) {
    const currentCutoff = await cutoffService.findCurrentCutoff()

    if (!currentCutoff?.id) {
      return []
    }

    const [incomeRecords, savingsRecords] = await Promise.all([
      incomeService.loadIncome({ cutoffId: currentCutoff.id }),
      savingsService.loadSavings({ cutoffId: currentCutoff.id }),
    ])
    const reminders = []

    if (
      incomeRecords.length === 0 &&
      !isDismissed('no_income', currentCutoff.id, storage)
    ) {
      reminders.push(buildReminder('no_income', currentCutoff))
    }

    if (
      incomeRecords.length > 0 &&
      savingsRecords.length === 0 &&
      !isDismissed('no_savings', currentCutoff.id, storage)
    ) {
      reminders.push(buildReminder('no_savings', currentCutoff))
    }

    return reminders
  },

  dismissReminder(reminder, { storage } = {}) {
    const reminderStorage = getStorage(storage)

    if (!reminderStorage || !reminder?.type || !reminder?.cutoffId) {
      return
    }

    reminderStorage.setItem(
      getStorageKey(reminder.type, reminder.cutoffId),
      'dismissed',
    )
  },
}

export const cutoffWorkflowReminderServiceInternals = {
  getStorageKey,
}
