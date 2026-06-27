import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { expenseService } from '@/features/expenses/services/expenseService.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const CATEGORY_COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-tertiary',
  'bg-error',
  'bg-primary-container',
]

function getAmount(record) {
  return Number(record?.amount) || 0
}

function getCashflowValue(cashflow, key) {
  return Number(cashflow?.[key]) || 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseIsoDate(value) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00.000Z`)
}

function getDayIndex(date) {
  const parsedDate = parseIsoDate(date)

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return (parsedDate.getUTCDay() + 6) % 7
}

function isCurrentCutoffRecord(record, currentCutoff) {
  return Boolean(
    currentCutoff?.id &&
      record?.cutoffId &&
      String(record.cutoffId) === String(currentCutoff.id),
  )
}

function getCurrentCutoffExpenses(expenses, currentCutoff) {
  if (!currentCutoff) {
    return []
  }

  return expenses.filter((expense) => isCurrentCutoffRecord(expense, currentCutoff))
}

function buildCategoryLookup(categories) {
  return new Map(categories.map((category) => [String(category.id), category]))
}

export function calculateHealthScore(cashflow) {
  if (!cashflow) {
    return null
  }

  let score = 100

  if (getCashflowValue(cashflow, 'remainingCash') < 0) {
    score -= 20
  }

  if (getCashflowValue(cashflow, 'expenseRate') > 80) {
    score -= 10
  }

  if (getCashflowValue(cashflow, 'savingsRate') < 10) {
    score -= 10
  }

  if (getCashflowValue(cashflow, 'incomeVariance') < 0) {
    score -= 10
  }

  return clamp(score, 0, 100)
}

export function deriveExpenseHelperText(cashflow) {
  const expenseRate = getCashflowValue(cashflow, 'expenseRate')

  if (expenseRate >= 90) {
    return 'Critical usage'
  }

  if (expenseRate >= 75) {
    return 'High usage'
  }

  return 'Within range'
}

export function deriveBudgetAlert(cashflow) {
  const remainingCash = getCashflowValue(cashflow, 'remainingCash')
  const expenseRate = getCashflowValue(cashflow, 'expenseRate')

  if (remainingCash < 0) {
    return {
      actionLabel: 'Review Spending',
      icon: 'warning',
      insight: 'AI placeholder: Focus on essential spending until cashflow recovers.',
      message: 'Your current cutoff cashflow is negative. Reduce discretionary expenses before the next cutoff.',
      title: 'Cashflow Risk Alert',
      tone: 'critical',
    }
  }

  if (expenseRate >= 90) {
    return {
      actionLabel: 'Review Expenses',
      icon: 'warning',
      insight: 'AI placeholder: Expenses are close to consuming all actual income.',
      message: 'Expenses have reached a critical share of your actual income for this cutoff.',
      title: 'Expense Usage Warning',
      tone: 'warning',
    }
  }

  if (expenseRate >= 75) {
    return {
      actionLabel: 'Check Categories',
      icon: 'priority_high',
      insight: 'AI placeholder: Keep an eye on categories with the largest shares.',
      message: 'Expenses are elevated for this cutoff. Monitor high-spend categories closely.',
      title: 'Spending Caution',
      tone: 'caution',
    }
  }

  return {
    actionLabel: 'View Details',
    icon: 'check_circle',
    insight: 'AI placeholder: Cashflow looks stable for the current cutoff.',
    message: 'Current spending is within a stable range for this cutoff.',
    title: 'Cashflow Stable',
    tone: 'stable',
  }
}

export function buildSpendingOverview(expenses, currentCutoff) {
  const currentExpenses = getCurrentCutoffExpenses(expenses, currentCutoff)
  const totals = DAY_LABELS.map((label) => ({ amount: 0, label, percent: 0 }))

  currentExpenses.forEach((expense) => {
    const dayIndex = getDayIndex(expense.date)

    if (dayIndex === null) {
      return
    }

    totals[dayIndex].amount += getAmount(expense)
  })

  const maxAmount = Math.max(...totals.map((day) => day.amount), 0)

  return totals.map((day) => ({
    ...day,
    percent: maxAmount === 0 ? 0 : Math.round((day.amount / maxAmount) * 100),
  }))
}

function getAllocationStatus(share) {
  if (share >= 40) {
    return { label: 'High', tone: 'critical' }
  }

  if (share >= 20) {
    return { label: 'Moderate', tone: 'warning' }
  }

  return { label: 'Normal', tone: 'success' }
}

export function buildAllocationMatrix(expenses, categories, currentCutoff) {
  const currentExpenses = getCurrentCutoffExpenses(expenses, currentCutoff)
  const categoriesById = buildCategoryLookup(categories)
  const totalsByCategory = new Map()

  currentExpenses.forEach((expense) => {
    const categoryName =
      categoriesById.get(String(expense.categoryId))?.name ?? 'Uncategorized'

    totalsByCategory.set(
      categoryName,
      (totalsByCategory.get(categoryName) ?? 0) + getAmount(expense),
    )
  })

  const totalSpent = [...totalsByCategory.values()].reduce(
    (total, amount) => total + amount,
    0,
  )

  return [...totalsByCategory.entries()]
    .sort((firstCategory, secondCategory) => {
      if (secondCategory[1] === firstCategory[1]) {
        return firstCategory[0].localeCompare(secondCategory[0])
      }

      return secondCategory[1] - firstCategory[1]
    })
    .slice(0, 5)
    .map(([category, spent], index) => {
      const share = totalSpent === 0 ? 0 : Math.round((spent / totalSpent) * 100)
      const status = getAllocationStatus(share)

      return {
        category,
        colorClassName: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        share,
        spent,
        status: status.label,
        tone: status.tone,
      }
    })
}

export function deriveCoachMessages(cashflow) {
  const remainingCash = getCashflowValue(cashflow, 'remainingCash')
  const savingsRate = getCashflowValue(cashflow, 'savingsRate')
  const expenseRate = getCashflowValue(cashflow, 'expenseRate')

  if (remainingCash < 0) {
    return [
      {
        label: 'Cashflow Risk',
        message: 'Cashflow is negative. Reduce discretionary expenses before the next cutoff.',
      },
      {
        label: 'Action Focus',
        message: 'Prioritize bills, transport, and food until the current cycle stabilizes.',
      },
    ]
  }

  if (savingsRate >= 20) {
    return [
      {
        label: 'Savings Strength',
        message: 'Strong savings rate. Keep protecting this cutoff.',
      },
      {
        label: 'Cycle Discipline',
        message: 'Your current savings share leaves room for steady cashflow control.',
      },
    ]
  }

  if (expenseRate >= 80) {
    return [
      {
        label: 'Expense Pressure',
        message: 'Expenses are consuming most of your income this cutoff.',
      },
      {
        label: 'Action Focus',
        message: 'Review the largest spending categories before adding new expenses.',
      },
    ]
  }

  return [
    {
      label: 'Stable Cycle',
      message: 'Cashflow looks stable for the current cutoff.',
    },
    {
      label: 'Next Step',
      message: 'Keep recording income, expenses, and savings to improve dashboard accuracy.',
    },
  ]
}

export function calculateCutoffProgress(currentCutoff, today = new Date()) {
  const startDate = parseIsoDate(currentCutoff?.startDate)
  const endDate = parseIsoDate(currentCutoff?.endDate)

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return {
      daysLeft: 0,
      progress: 0,
    }
  }

  const todayStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  const elapsedDays = Math.floor((todayStart.getTime() - startDate.getTime()) / 86400000) + 1
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - todayStart.getTime()) / 86400000),
  )

  return {
    daysLeft,
    progress: clamp(Math.round((elapsedDays / totalDays) * 100), 0, 100),
  }
}

function normalizeTransaction(record, type) {
  const amountDirection = type === 'income' ? 1 : -1

  return {
    amount: getAmount(record) * amountDirection,
    date: record.date,
    id: `${type}-${record.id}`,
    label:
      type === 'expense'
        ? record.merchant ?? record.categoryName ?? record.categoryId ?? 'Expense'
        : record.source ?? 'Transaction',
    type,
  }
}

export function buildRecentTransactions({ expenses = [], income = [], savings = [] } = {}) {
  return [
    ...income.map((record) => normalizeTransaction(record, 'income')),
    ...expenses.map((record) => normalizeTransaction(record, 'expense')),
    ...savings.map((record) => normalizeTransaction(record, 'savings')),
  ]
    .sort((firstTransaction, secondTransaction) => {
      if (secondTransaction.date === firstTransaction.date) {
        return secondTransaction.id.localeCompare(firstTransaction.id)
      }

      return secondTransaction.date.localeCompare(firstTransaction.date)
    })
    .slice(0, 5)
}

function buildDashboardModel({
  cashflow,
  categories,
  currentCutoff,
  expenses,
  income,
  savings,
}) {
  return {
    allocationRows: buildAllocationMatrix(expenses, categories, currentCutoff),
    budgetAlert: deriveBudgetAlert(cashflow),
    cashflow,
    coachMessages: deriveCoachMessages(cashflow),
    currentCutoff,
    cutoffProgress: calculateCutoffProgress(currentCutoff),
    expenseHelperText: deriveExpenseHelperText(cashflow),
    healthScore: calculateHealthScore(cashflow),
    recentTransactions: buildRecentTransactions({ expenses, income, savings }),
    spendingOverview: buildSpendingOverview(expenses, currentCutoff),
  }
}

export const dashboardService = {
  async loadDashboard() {
    const [
      cashflowResult,
      currentCutoff,
      expenses,
      categories,
      income,
      savings,
    ] = await Promise.all([
      cashflowService.getCurrentCashflow(),
      cutoffService.findCurrentCutoff(),
      expenseService.loadExpenses(),
      expenseService.loadCategories(),
      incomeService.loadIncome(),
      savingsService.loadSavings(),
    ])

    return buildDashboardModel({
      cashflow: cashflowResult.cashflow,
      categories,
      currentCutoff,
      expenses,
      income,
      savings,
    })
  },
}

export const dashboardServiceInternals = {
  buildDashboardModel,
  getCurrentCutoffExpenses,
  getDayIndex,
}
