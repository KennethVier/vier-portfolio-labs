import { createRecommendation } from '../../models/recommendation.js'
import { CASHFLOW_RULE_IDS } from '../cashflow/cashflowRuleConstants.js'
import { CUTOFF_RULE_IDS } from '../cutoff/cutoffRuleConstants.js'
import { EXPENSE_RULE_IDS } from '../expense/expenseRuleConstants.js'
import { GOAL_RULE_IDS } from '../goal/goalRuleConstants.js'
import { INCOME_RULE_IDS } from '../income/incomeRuleConstants.js'
import { SAVINGS_RULE_IDS } from '../savings/savingsRuleConstants.js'
import { INSIGHT_PRIORITY } from '../../utils/insightPriority.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import {
  RECOMMENDATION_ACTION_KEYS,
  RECOMMENDATION_RULE_IDS,
} from './recommendationRuleConstants.js'

function extractEvidence(evidenceList, targetRuleIds) {
  if (!Array.isArray(evidenceList)) return []
  return evidenceList
    .filter((item) => targetRuleIds.includes(item?.ruleId))
    .map((item) => ({
      label: item.label,
      value: item.value,
      ruleId: item.ruleId,
      ...(item.description ? { description: item.description } : {}),
    }))
}

export function evaluateCashflowNegativePosition(bundle) {
  const cashflow = bundle?.cashflow
  if (!cashflow?.metrics) return null

  const position = cashflow.metrics.position
  if (position !== 'Negative') return null

  const sourceRuleIds = [
    CASHFLOW_RULE_IDS.remainingCash,
    CASHFLOW_RULE_IDS.netCashflow,
  ]
  const evidence = extractEvidence(cashflow.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.cashflowNegativePosition,
    domain: 'cashflow',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewCashPosition,
    title: 'Negative Cashflow Position',
    explanation:
      'Remaining cash or net cashflow is negative. Consider reviewing current spending and upcoming cash needs.',
    severity: INSIGHT_SEVERITY.critical,
    priority: INSIGHT_PRIORITY.urgent,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateCashflowFastSpendingPace(bundle) {
  const pace = bundle?.cashflow?.metrics?.spendingPace
  if (!pace || pace.status !== 'Fast') return null

  const sourceRuleIds = [CASHFLOW_RULE_IDS.spendingPace]
  const evidence = extractEvidence(bundle.cashflow.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.cashflowFastSpendingPace,
    domain: 'cashflow',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewSpendingPace,
    title: 'Fast Spending Pace',
    explanation:
      'Current spending pace is faster than elapsed cycle time. Consider moderating discretionary expenses.',
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.high,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateCashflowIncomeCoverage(bundle) {
  const coverage = bundle?.cashflow?.metrics?.incomeCoverage
  if (!coverage || (coverage.status !== 'Uncovered' && coverage.status !== 'Partial')) {
    return null
  }

  const sourceRuleIds = [CASHFLOW_RULE_IDS.incomeCoverage]
  const evidence = extractEvidence(bundle.cashflow.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  const isUncovered = coverage.status === 'Uncovered'

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.cashflowIncomeCoverage,
    domain: 'cashflow',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewUpcomingObligations,
    title: 'Insufficient Income Coverage',
    explanation: isUncovered
      ? 'Income does not cover required outflows. Consider reviewing upcoming commitments.'
      : 'Income only partially covers required outflows. Consider reviewing upcoming commitments.',
    severity: isUncovered ? INSIGHT_SEVERITY.critical : INSIGHT_SEVERITY.warning,
    priority: isUncovered ? INSIGHT_PRIORITY.urgent : INSIGHT_PRIORITY.high,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateExpenseCategoryConcentration(bundle) {
  const expenses = bundle?.expenses
  const topCategory = expenses?.metrics?.topSpendingCategory
  if (!topCategory || typeof topCategory.percentage !== 'number' || topCategory.percentage < 40) {
    return null
  }

  const sourceRuleIds = [EXPENSE_RULE_IDS.topSpendingCategory]
  const evidence = extractEvidence(expenses.evidence, [
    EXPENSE_RULE_IDS.topSpendingCategory,
    EXPENSE_RULE_IDS.categoryDistribution,
  ])
  if (evidence.length === 0) return null

  const categoryName = String(topCategory.categoryName ?? 'Category')

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.expenseCategoryConcentration,
    domain: 'expense',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewExpenses,
    title: 'High Category Spending Concentration',
    explanation: `${categoryName} accounts for ${topCategory.percentage}% of current spending. Consider reviewing ${categoryName.toLowerCase()} expenses next cutoff.`,
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateExpenseRisingSpending(bundle) {
  const expenses = bundle?.expenses
  const trend = expenses?.metrics?.trend
  if (!trend || trend.direction !== 'Increasing') return null

  const sourceRuleIds = [EXPENSE_RULE_IDS.expenseTrend]
  const evidence = extractEvidence(expenses.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.expenseRisingSpending,
    domain: 'expense',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewExpenses,
    title: 'Increasing Expense Trend',
    explanation: `Current expenses are trending upward by ${trend.percentageChange}%. Consider reviewing recent expense increases.`,
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateIncomeMissingIncome(bundle) {
  const income = bundle?.income
  const missingIncome = income?.metrics?.missingIncome
  if (!missingIncome || !missingIncome.missing) return null

  const sourceRuleIds = [INCOME_RULE_IDS.missingIncomeDetection]
  const evidence = extractEvidence(income.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  const isCritical = missingIncome.expectedIncome > 0

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.incomeMissingIncome,
    domain: 'income',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewIncomeRecords,
    title: 'Missing Expected Income',
    explanation:
      'Expected income is missing for the current cutoff. Consider verifying incoming salary or deposit records.',
    severity: isCritical ? INSIGHT_SEVERITY.critical : INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.high,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateIncomeUnstable(bundle) {
  const income = bundle?.income
  const stability = income?.metrics?.stability
  if (!stability || stability.status !== 'Unstable') return null

  const sourceRuleIds = [INCOME_RULE_IDS.incomeStability]
  const evidence = extractEvidence(income.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.incomeUnstable,
    domain: 'income',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewIncomeVariability,
    title: 'Unstable Income Stream',
    explanation:
      'Income stream shows high variability across pay periods. Consider planning for cashflow fluctuations.',
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateSavingsLowRate(bundle) {
  const savings = bundle?.savings
  const savingsRate = savings?.metrics?.savingsRate
  if (!savingsRate || savingsRate.status !== 'Low') return null

  const sourceRuleIds = [SAVINGS_RULE_IDS.savingsRate]
  const evidence = extractEvidence(savings.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.savingsLowRate,
    domain: 'savings',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewSavingsAllocation,
    title: 'Low Savings Rate',
    explanation: `Current savings rate is below the configured healthy range at ${savingsRate.rate}%. Consider reviewing your savings allocation.`,
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateGoalNoContributions(bundle) {
  const goals = bundle?.goals
  const goalsWithout = goals?.metrics?.goalsWithoutContributions
  if (!Array.isArray(goalsWithout) || goalsWithout.length === 0) return null

  const sourceRuleIds = [GOAL_RULE_IDS.goalsWithoutContributions]
  const evidence = extractEvidence(goals.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.goalNoContributions,
    domain: 'goal',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewGoalContributions,
    title: 'Goals Without Contributions',
    explanation: `${goalsWithout.length} savings goals currently have no linked contributions. Consider reviewing goal allocations.`,
    severity: INSIGHT_SEVERITY.info,
    priority: INSIGHT_PRIORITY.low,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateCutoffExpensesUp(bundle) {
  const cutoff = bundle?.cutoff
  const prevComparison = cutoff?.metrics?.previousCutoffComparison
  if (
    !prevComparison?.expenses ||
    prevComparison.expenses.direction !== 'Increasing'
  ) {
    return null
  }

  const sourceRuleIds = [CUTOFF_RULE_IDS.expenseComparison]
  const evidence = extractEvidence(cutoff.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.cutoffExpensesUp,
    domain: 'cutoff',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewExpenses,
    title: 'Cutoff Expenses Higher Than Previous',
    explanation: `Expenses increased by ${prevComparison.expenses.percentageChange}% compared to previous cutoff. Consider reviewing spending changes.`,
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateCutoffCashTrendDown(bundle) {
  const cutoff = bundle?.cutoff
  const trend = cutoff?.metrics?.trend
  if (!trend || trend.direction !== 'Decreasing') return null

  const sourceRuleIds = [CUTOFF_RULE_IDS.cutoffTrend]
  const evidence = extractEvidence(cutoff.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.cutoffCashTrendDown,
    domain: 'cutoff',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewCashPosition,
    title: 'Decreasing Cutoff Remaining Cash Trend',
    explanation:
      'Remaining cash is trending downward across recent cutoffs. Consider monitoring cycle end balances.',
    severity: INSIGHT_SEVERITY.warning,
    priority: INSIGHT_PRIORITY.medium,
    evidence,
    sourceRuleIds,
  })
}

export function evaluateHealthLowStatus(bundle) {
  const health = bundle?.health
  if (!health) return null

  const isCritical = health.status === 'Critical'
  const isNeedsAttention = health.status === 'Needs Attention'
  if (!isCritical && !isNeedsAttention) return null

  // Correction 5: Extract actual contributing health rules from breakdown
  const contributingRules = Array.isArray(health.breakdown)
    ? health.breakdown.filter((item) =>
        [INSIGHT_SEVERITY.critical, INSIGHT_SEVERITY.warning].includes(
          item.severity,
        ),
      )
    : []

  const sourceRuleIds = contributingRules.map((rule) => rule.id)
  if (sourceRuleIds.length === 0) return null

  const evidence = extractEvidence(health.evidence, sourceRuleIds)
  if (evidence.length === 0) return null

  return createRecommendation({
    id: RECOMMENDATION_RULE_IDS.healthLowStatus,
    domain: 'health',
    actionKey: RECOMMENDATION_ACTION_KEYS.reviewFinancialHealth,
    title: 'Financial Health Attention Required',
    explanation: `Financial health is ${health.status.toLowerCase()} with a score of ${health.score}. Consider addressing contributing areas.`,
    severity: isCritical ? INSIGHT_SEVERITY.critical : INSIGHT_SEVERITY.warning,
    priority: isCritical ? INSIGHT_PRIORITY.urgent : INSIGHT_PRIORITY.high,
    evidence,
    sourceRuleIds,
  })
}
