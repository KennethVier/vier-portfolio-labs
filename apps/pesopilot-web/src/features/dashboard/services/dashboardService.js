import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { expenseService } from '@/features/expenses/services/expenseService.js'
import { incomeService } from '@/features/income/services/incomeService.js'
import { insightService } from '@/features/insights/services/insightService.js'
import { savingsService } from '@/features/savings/services/savingsService.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { SUMMARY_SECTION_TYPES } from '@/features/insights/summary/summaryConstants.js'

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

function getInsightExplanation(insights, fallback) {
  return insights?.cashflow?.explanation || insights?.expenses?.explanation || insights?.health?.explanation || fallback
}

export function getHealthScore(insights, hasCurrentCutoff = true) {
  const actualInsights = insights?.health !== undefined ? insights : arguments[1]
  const actualCutoff = typeof hasCurrentCutoff === 'boolean' ? hasCurrentCutoff : (arguments[2] ?? true)

  if (!actualCutoff) {
    return null
  }

  const insightScore = Number(actualInsights?.health?.score)

  if (Number.isFinite(insightScore)) {
    return insightScore
  }

  return null
}

function createNoCutoffStatus() {
  return {
    actionLabel: 'Create Cutoff',
    actionTo: '/salary-cutoff',
    icon: 'calendar_add_on',
    insight: 'Current-cycle financial status is unavailable until a salary cutoff covers today.',
    message: 'Create a salary cutoff that covers today to start current-cycle cashflow tracking.',
    title: 'No Active Cutoff',
    tone: 'neutral',
  }
}

export function deriveExpenseHelperText(insights, hasCurrentCutoff = true) {
  if (!hasCurrentCutoff) {
    return 'No active cutoff'
  }

  const paceStatus = insights?.cashflow?.metrics?.spendingPace?.status

  if (paceStatus && paceStatus !== 'No Data') {
    return `Pace: ${paceStatus}`
  }

  return 'Within range'
}

export function deriveBudgetAlert(cashflow, insights = null, hasCurrentCutoff = true) {
  if (!hasCurrentCutoff) {
    return createNoCutoffStatus()
  }

  const breakdown = Array.isArray(insights?.cashflow?.breakdown)
    ? insights.cashflow.breakdown
    : []

  const hasCritical = breakdown.some((rule) => rule?.severity === 'critical')
  const hasWarning = breakdown.some((rule) => rule?.severity === 'warning')

  let tone = 'neutral'
  let icon = 'info'
  let title = 'Cashflow Status'

  if (hasCritical) {
    tone = 'critical'
    icon = 'warning'
    title = 'Cashflow Deficit Risk'
  } else if (hasWarning) {
    tone = 'warning'
    icon = 'priority_high'
    title = 'Cashflow Warning'
  } else if (
    insights?.cashflow?.metrics?.position === 'Positive' ||
    insights?.cashflow?.metrics?.stability?.status === 'Stable'
  ) {
    tone = 'stable'
    icon = 'check_circle'
    title = 'Cashflow Stable'
  }

  const message =
    insights?.cashflow?.explanation ||
    'Cashflow is being tracked for the current cutoff.'

  let insightText = 'Cashflow data is up to date.'
  const paceStatus = insights?.cashflow?.metrics?.spendingPace?.status
  const position = insights?.cashflow?.metrics?.position

  if (paceStatus && paceStatus !== 'No Data') {
    insightText = `Spending pace is ${paceStatus} for this cutoff.`
  } else if (position && position !== 'No Data') {
    insightText = `Current cashflow position is ${position}.`
  } else if (insights?.cashflow?.explanation) {
    insightText = insights.cashflow.explanation
  }

  return {
    actionLabel: 'View Cashflow',
    actionTo: '/cashflow',
    icon,
    insight: insightText,
    message,
    title,
    tone,
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

export function buildAllocationMatrix(
  categoryDistribution = [],
  topSpendingCategory = null,
  currentCutoff = null,
) {
  if (
    !currentCutoff ||
    !Array.isArray(categoryDistribution) ||
    categoryDistribution.length === 0
  ) {
    return []
  }

  return categoryDistribution.slice(0, 5).map((row, index) => {
    const isTop = Boolean(
      topSpendingCategory?.categoryName &&
        row.categoryName === topSpendingCategory.categoryName,
    )

    return {
      category: row.categoryName,
      colorClassName: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      share: Math.round(row.percentage ?? 0),
      spent: row.amount ?? 0,
      status: isTop ? 'Top Category' : '—',
      tone: 'neutral',
    }
  })
}

export function getTopRecommendations(recommendations = [], hasCurrentCutoff = true) {
  if (!hasCurrentCutoff || !Array.isArray(recommendations)) {
    return []
  }

  return recommendations.slice(0, 2)
}

export function getExecutiveSummaryNarrative(summary = null, hasCurrentCutoff = true) {
  if (!hasCurrentCutoff || !summary?.sections) {
    return null
  }

  const executiveSection = summary.sections.find(
    (section) => section?.type === SUMMARY_SECTION_TYPES.executive,
  )

  if (!executiveSection?.paragraphs?.length) {
    return null
  }

  return executiveSection.paragraphs.map((paragraph) => paragraph.text).join(' ')
}

export function getCutoffPerformance(insights = null, hasCurrentCutoff = true) {
  if (!hasCurrentCutoff) {
    return null
  }

  return insights?.cutoff?.explanation ?? null
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
  currentCutoff,
  expenses,
  income,
  insights,
  savings,
}) {
  const hasCurrentCutoff = Boolean(currentCutoff)
  const categoryDistribution = insights?.expenses?.metrics?.categoryDistribution ?? []
  const topSpendingCategory = insights?.expenses?.metrics?.topSpendingCategory ?? null

  return {
    allocationRows: buildAllocationMatrix(
      categoryDistribution,
      topSpendingCategory,
      currentCutoff,
    ),
    budgetAlert: deriveBudgetAlert(cashflow, insights, hasCurrentCutoff),
    cashflow,
    currentCutoff,
    cutoffPerformance: getCutoffPerformance(insights, hasCurrentCutoff),
    cutoffProgress: calculateCutoffProgress(currentCutoff),
    expenseHelperText: deriveExpenseHelperText(insights, hasCurrentCutoff),
    healthScore: getHealthScore(insights, hasCurrentCutoff),
    healthStatus: hasCurrentCutoff ? insights?.health?.status ?? null : null,
    insights,
    recentTransactions: buildRecentTransactions({ expenses, income, savings }),
    spendingOverview: buildSpendingOverview(expenses, currentCutoff),
    summaryNarrative: getExecutiveSummaryNarrative(insights?.summary, hasCurrentCutoff),
    topRecommendations: getTopRecommendations(insights?.recommendations, hasCurrentCutoff),
  }
}

export const dashboardService = {
  async loadDashboard() {
    const [
      cashflowResult,
      currentCutoff,
      expenses,
      income,
      savings,
      insights,
    ] = await Promise.all([
      cashflowService.getCurrentCashflow(),
      cutoffService.findCurrentCutoff(),
      expenseService.loadExpenses(),
      incomeService.loadIncome(),
      savingsService.loadSavings(),
      insightService.loadInsights(),
    ])

    return buildDashboardModel({
      cashflow: cashflowResult.cashflow,
      currentCutoff,
      expenses,
      income,
      insights,
      savings,
    })
  },
}

export const dashboardServiceInternals = {
  buildAllocationMatrix,
  buildDashboardModel,
  createNoCutoffStatus,
  deriveBudgetAlert,
  deriveExpenseHelperText,
  getCurrentCutoffExpenses,
  getCutoffPerformance,
  getDayIndex,
  getExecutiveSummaryNarrative,
  getHealthScore,
  getInsightExplanation,
  getTopRecommendations,
}
