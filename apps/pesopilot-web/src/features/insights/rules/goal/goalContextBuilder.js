import { savingsService } from '@/features/savings/services/savingsService.js'

function normalizeContribution(contribution) {
  return {
    id: contribution.id ?? null,
    amount: Number(contribution.amount) || 0,
    cutoffId: contribution.cutoffId ?? null,
    date: contribution.date ?? null,
    goalId: contribution.goalId ?? null,
    source: contribution.source ?? null,
  }
}

export async function buildGoalContext({ scope } = {}) {
  const [goals, savingsRecords] = await Promise.all([
    savingsService.loadSavingsGoals(),
    savingsService.loadSavings(),
  ])
  const contributions = savingsRecords
    .filter((savings) => savings.goalId)
    .map(normalizeContribution)

  return {
    scope,
    goals,
    contributions,
    diagnostics: {
      warnings: goals.length === 0 ? ['No savings goals'] : [],
    },
  }
}
