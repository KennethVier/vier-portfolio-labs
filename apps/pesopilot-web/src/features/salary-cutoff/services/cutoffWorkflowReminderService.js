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
    no_current_cutoff: {
      actionLabel: 'Create Cutoff',
      message: 'Create a cutoff to start tracking this salary cycle.',
      priority: 1,
      title: 'No active cutoff exists.',
      to: '/salary-cutoff',
    },
    no_income: {
      actionLabel: 'Record Income',
      message: 'You have not recorded income for this cycle yet.',
      priority: 2,
      title: 'New cutoff cycle started',
      to: '/income',
    },
    no_savings: {
      actionLabel: 'Add Savings',
      message:
        "Consider allocating part of this cycle's income to savings before spending.",
      priority: 3,
      title: 'Income recorded',
      to: '/savings',
    },
  }[type]

  return {
    ...reminderDetails,
    cutoffId: cutoff?.id ?? null,
    dismissible: type !== 'no_current_cutoff',
    id: cutoff?.id ? `${type}-${cutoff.id}` : type,
    storageKey: cutoff?.id ? getStorageKey(type, cutoff.id) : null,
    type,
  }
}

function buildGoalReminder(goal) {
  return {
    actionLabel: 'Add Contribution',
    cutoffId: null,
    dismissible: true,
    goalId: goal.id,
    id: `goal_no_contribution-${goal.id}`,
    message: `${goal.name} has no contributions yet.`,
    priority: 4,
    storageKey: getStorageKey('goal_no_contribution', goal.id),
    title: 'Savings goal needs a first contribution',
    to: '/savings',
    type: 'goal_no_contribution',
  }
}

function sortReminders(reminders) {
  return [...reminders].sort((firstReminder, secondReminder) => {
    if (firstReminder.priority !== secondReminder.priority) {
      return firstReminder.priority - secondReminder.priority
    }

    return firstReminder.id.localeCompare(secondReminder.id)
  })
}

export const cutoffWorkflowReminderService = {
  async loadReminders({ storage } = {}) {
    const currentCutoff = await cutoffService.findCurrentCutoff()

    if (!currentCutoff?.id) {
      return [buildReminder('no_current_cutoff', null)]
    }

    const [incomeRecords, savingsRecords, savingsGoals] = await Promise.all([
      incomeService.loadIncome({ cutoffId: currentCutoff.id }),
      savingsService.loadSavings({ cutoffId: currentCutoff.id }),
      savingsService.loadSavingsGoals(),
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

    savingsGoals
      .filter(
        (goal) =>
          goal.status === 'active' &&
          goal.contributionCount === 0 &&
          !isDismissed('goal_no_contribution', goal.id, storage),
      )
      .forEach((goal) => reminders.push(buildGoalReminder(goal)))

    return sortReminders(reminders)
  },

  dismissReminder(reminder, { storage } = {}) {
    const reminderStorage = getStorage(storage)

    if (!reminderStorage || !reminder?.storageKey || !reminder.dismissible) {
      return
    }

    reminderStorage.setItem(reminder.storageKey, 'dismissed')
  },
}

export const cutoffWorkflowReminderServiceInternals = {
  buildGoalReminder,
  buildReminder,
  getStorageKey,
  sortReminders,
}
