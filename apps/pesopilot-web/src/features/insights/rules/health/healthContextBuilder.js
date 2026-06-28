import { expenseService } from '@/features/expenses/services/expenseService.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

function getPercent(numerator, denominator) {
  if (!denominator) {
    return 0
  }

  return (numerator / denominator) * 100
}

function getCurrentGoalContributionCount(savingsRecords, activeGoals) {
  const activeGoalIds = new Set(activeGoals.map((goal) => String(goal.id)))

  return savingsRecords.filter(
    (savings) => savings.goalId && activeGoalIds.has(String(savings.goalId)),
  ).length
}

export async function buildHealthContext({ scope } = {}) {
  const currentCutoff = await cutoffService.findCurrentCutoff()

  if (!currentCutoff) {
    return {
      scope,
      currentCutoff: null,
      income: {
        incomeRecords: 0,
        totalIncome: 0,
      },
      expenses: {
        totalExpenses: 0,
        transactionCount: 0,
      },
      savings: {
        savingsRecords: 0,
        totalSavings: 0,
      },
      cashflow: {
        remainingCash: 0,
      },
      ratios: {
        expenseRate: 0,
        savingsRate: 0,
      },
      goals: {
        activeGoalCount: 0,
        currentCutoffGoalContributionCount: 0,
      },
    }
  }

  const [incomeKpis, expenseKpis, savingsKpis, savingsGoals, currentSavings] =
    await Promise.all([
      incomeService.loadIncomeKpis(),
      expenseService.loadExpenseKpis(),
      savingsService.loadSavingsKpis(),
      savingsService.loadSavingsGoals(),
      savingsService.loadSavings({ cutoffId: currentCutoff.id }),
    ])
  const activeGoals = savingsGoals.filter((goal) => goal.status === 'active')
  const totalIncome = Number(incomeKpis.totalIncome) || 0
  const totalExpenses = Number(expenseKpis.totalExpenses) || 0
  const totalSavings = Number(savingsKpis.totalSavings) || 0

  return {
    scope,
    currentCutoff,
    income: {
      incomeRecords: incomeKpis.incomeRecords,
      totalIncome,
    },
    expenses: {
      totalExpenses,
      transactionCount: expenseKpis.transactionCount,
    },
    savings: {
      savingsRecords: savingsKpis.savingsRecords,
      totalSavings,
    },
    cashflow: {
      remainingCash: totalIncome - totalExpenses - totalSavings,
    },
    ratios: {
      expenseRate: getPercent(totalExpenses, totalIncome),
      savingsRate: getPercent(totalSavings, totalIncome),
    },
    goals: {
      activeGoalCount: activeGoals.length,
      currentCutoffGoalContributionCount: getCurrentGoalContributionCount(
        currentSavings,
        activeGoals,
      ),
    },
  }
}
