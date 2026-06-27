import { SAVINGS_SOURCES } from '../constants/savingsConstants.js'

export const SAVINGS_FORM_MODE = {
  general: 'general',
  goalContribution: 'goalContribution',
}

export function resolveContributionSource(goal) {
  const goalName = String(goal?.name ?? '').trim()

  if (SAVINGS_SOURCES.includes(goalName)) {
    return goalName
  }

  return 'General Savings'
}
