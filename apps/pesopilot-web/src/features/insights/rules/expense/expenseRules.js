import { EXPENSE_RULE_STATUS, createExpenseRuleResult } from '../../models/expenseRuleResult.js'
import { EXPENSE_TREND } from '../../models/expenseInsight.js'
import { INSIGHT_SEVERITY } from '../../utils/insightSeverity.js'
import { EXPENSE_RULE_IDS } from './expenseRuleConstants.js'

function noDataResult({ evidence = [], id, message, ruleName, value = null, weight }) {
  return createExpenseRuleResult({
    evidence,
    id,
    message,
    ruleName,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.noData,
    value,
    weight,
  })
}

function hasExpenses(context) {
  return context.metrics.expenseCount > 0
}

export function evaluateExpenseExists(context, weight) {
  const expenseCount = context.metrics.expenseCount

  if (!context.currentCutoff) {
    return noDataResult({
      evidence: [
        {
          label: 'Current Cutoff',
          value: 'None',
          description: 'Expense intelligence is current-cutoff first.',
        },
      ],
      id: EXPENSE_RULE_IDS.expenseExists,
      message: 'No current cutoff is available for expense intelligence.',
      ruleName: 'Expense Exists',
      value: expenseCount,
      weight,
    })
  }

  if (!expenseCount) {
    return noDataResult({
      evidence: [
        {
          label: 'Current-Cutoff Expenses',
          value: 0,
        },
      ],
      id: EXPENSE_RULE_IDS.expenseExists,
      message: 'No expenses are recorded for the current cutoff.',
      ruleName: 'Expense Exists',
      value: expenseCount,
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Current-Cutoff Expenses',
        value: expenseCount,
      },
      {
        label: 'Total Expenses',
        value: context.metrics.totalExpenses,
      },
    ],
    id: EXPENSE_RULE_IDS.expenseExists,
    message: `${expenseCount} expenses are recorded for the current cutoff.`,
    passed: true,
    ruleName: 'Expense Exists',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: EXPENSE_RULE_STATUS.pass,
    value: expenseCount,
    weight,
  })
}

export function evaluateTopSpendingCategory(context, weight) {
  const category = context.metrics.topSpendingCategory

  if (!category) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.topSpendingCategory,
      message: 'No top spending category is available yet.',
      ruleName: 'Top Spending Category',
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Category',
        value: category.categoryName,
      },
      {
        label: 'Amount',
        value: category.amount,
      },
      {
        label: 'Share',
        value: category.percentage,
      },
    ],
    id: EXPENSE_RULE_IDS.topSpendingCategory,
    message: `${category.categoryName} is the top spending category at ${category.percentage}%.`,
    passed: true,
    ruleName: 'Top Spending Category',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.pass,
    value: category,
    weight,
  })
}

export function evaluateCategoryDistribution(context, weight) {
  const distribution = context.metrics.categoryDistribution

  if (distribution.length === 0) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.categoryDistribution,
      message: 'No category distribution is available yet.',
      ruleName: 'Category Distribution',
      value: [],
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: distribution.map((category) => ({
      label: category.categoryName,
      value: category.amount,
      description: `${category.percentage}% of current-cutoff expenses.`,
    })),
    id: EXPENSE_RULE_IDS.categoryDistribution,
    message: `Expenses are distributed across ${distribution.length} categories.`,
    passed: true,
    ruleName: 'Category Distribution',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.pass,
    value: distribution,
    weight,
  })
}

export function evaluateLargestExpense(context, weight) {
  const largestExpense = context.metrics.largestExpense

  if (!largestExpense) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.largestExpense,
      message: 'No largest expense is available yet.',
      ruleName: 'Largest Expense',
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Merchant',
        value: largestExpense.merchant,
      },
      {
        label: 'Amount',
        value: largestExpense.amount,
      },
      {
        label: 'Date',
        value: largestExpense.date,
      },
    ],
    id: EXPENSE_RULE_IDS.largestExpense,
    message: `${largestExpense.merchant} is the largest expense at ${largestExpense.amount}.`,
    passed: true,
    ruleName: 'Largest Expense',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.pass,
    value: largestExpense,
    weight,
  })
}

export function evaluateLargestMerchant(context, weight) {
  const largestMerchant = context.metrics.largestMerchant

  if (!largestMerchant) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.largestMerchant,
      message: 'No largest merchant is available yet.',
      ruleName: 'Largest Merchant',
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Merchant',
        value: largestMerchant.merchant,
      },
      {
        label: 'Amount',
        value: largestMerchant.amount,
      },
      {
        label: 'Transactions',
        value: largestMerchant.count,
      },
    ],
    id: EXPENSE_RULE_IDS.largestMerchant,
    message: `${largestMerchant.merchant} has the highest merchant total at ${largestMerchant.amount}.`,
    passed: true,
    ruleName: 'Largest Merchant',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.pass,
    value: largestMerchant,
    weight,
  })
}

export function evaluateDailySpendingRate(context, weight) {
  if (!hasExpenses(context)) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.dailySpendingRate,
      message: 'No daily spending rate is available without expenses.',
      ruleName: 'Daily Spending Rate',
      value: 0,
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Daily Spending Rate',
        value: context.metrics.dailySpendingRate,
      },
      {
        label: 'Current Period Days',
        value: context.metrics.currentPeriodDays,
      },
    ],
    id: EXPENSE_RULE_IDS.dailySpendingRate,
    message: `Daily spending rate is ${context.metrics.dailySpendingRate} for this cutoff.`,
    passed: true,
    ruleName: 'Daily Spending Rate',
    score: 100,
    severity: INSIGHT_SEVERITY.info,
    status: EXPENSE_RULE_STATUS.pass,
    value: context.metrics.dailySpendingRate,
    weight,
  })
}

export function evaluateExpenseTrend(context, weight) {
  const trend = context.metrics.trend

  if (trend.direction === EXPENSE_TREND.noData) {
    return noDataResult({
      evidence: [
        {
          label: 'Previous Cutoff',
          value: context.previousCutoff?.name ?? 'None',
        },
      ],
      id: EXPENSE_RULE_IDS.expenseTrend,
      message: 'Expense trend needs a previous cutoff with expenses.',
      ruleName: 'Expense Trend',
      value: trend,
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Current Expenses',
        value: trend.currentTotal,
      },
      {
        label: 'Comparison Expenses',
        value: trend.comparisonTotal,
      },
      {
        label: 'Change',
        value: trend.percentageChange,
      },
    ],
    id: EXPENSE_RULE_IDS.expenseTrend,
    message: `Expense trend is ${trend.direction.toLowerCase()} at ${trend.percentageChange}%.`,
    passed: trend.direction !== EXPENSE_TREND.increasing,
    ruleName: 'Expense Trend',
    score: trend.direction === EXPENSE_TREND.increasing ? 60 : 100,
    severity:
      trend.direction === EXPENSE_TREND.increasing
        ? INSIGHT_SEVERITY.warning
        : INSIGHT_SEVERITY.success,
    status:
      trend.direction === EXPENSE_TREND.increasing
        ? EXPENSE_RULE_STATUS.warning
        : EXPENSE_RULE_STATUS.pass,
    value: trend,
    weight,
  })
}

export function evaluateExpenseIncreaseDetection(context, weight) {
  const increase = context.metrics.increase

  if (!increase) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.expenseIncreaseDetection,
      message: 'No expense increase is detected.',
      ruleName: 'Expense Increase Detection',
      value: null,
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Increase Amount',
        value: increase.amount,
      },
      {
        label: 'Increase Percentage',
        value: increase.percentage,
      },
    ],
    id: EXPENSE_RULE_IDS.expenseIncreaseDetection,
    message: `Expenses increased by ${increase.percentage}% compared with the previous cutoff.`,
    passed: false,
    ruleName: 'Expense Increase Detection',
    score: increase.significant ? 30 : 60,
    severity: increase.significant
      ? INSIGHT_SEVERITY.critical
      : INSIGHT_SEVERITY.warning,
    status: EXPENSE_RULE_STATUS.warning,
    value: increase,
    weight,
  })
}

export function evaluateExpenseDecreaseDetection(context, weight) {
  const decrease = context.metrics.decrease

  if (!decrease) {
    return noDataResult({
      id: EXPENSE_RULE_IDS.expenseDecreaseDetection,
      message: 'No expense decrease is detected.',
      ruleName: 'Expense Decrease Detection',
      value: null,
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: [
      {
        label: 'Decrease Amount',
        value: decrease.amount,
      },
      {
        label: 'Decrease Percentage',
        value: decrease.percentage,
      },
    ],
    id: EXPENSE_RULE_IDS.expenseDecreaseDetection,
    message: `Expenses decreased by ${decrease.percentage}% compared with the previous cutoff.`,
    passed: true,
    ruleName: 'Expense Decrease Detection',
    score: 100,
    severity: INSIGHT_SEVERITY.success,
    status: EXPENSE_RULE_STATUS.pass,
    value: decrease,
    weight,
  })
}

export function evaluateSpendingAnomalies(context, weight) {
  const anomalies = context.metrics.anomalies

  if (anomalies.length === 0) {
    return createExpenseRuleResult({
      evidence: [
        {
          label: 'Detected Anomalies',
          value: 0,
        },
      ],
      id: EXPENSE_RULE_IDS.spendingAnomalies,
      message: 'No spending anomalies are detected.',
      passed: true,
      ruleName: 'Spending Anomalies',
      score: 100,
      severity: INSIGHT_SEVERITY.success,
      status: EXPENSE_RULE_STATUS.pass,
      value: [],
      weight,
    })
  }

  return createExpenseRuleResult({
    evidence: anomalies.map((anomaly) => ({
      label: anomaly.merchant,
      value: anomaly.amount,
      description: `Above anomaly threshold ${anomaly.threshold}.`,
    })),
    id: EXPENSE_RULE_IDS.spendingAnomalies,
    message: `${anomalies.length} spending anomalies are detected.`,
    passed: false,
    ruleName: 'Spending Anomalies',
    score: 40,
    severity: INSIGHT_SEVERITY.critical,
    status: EXPENSE_RULE_STATUS.warning,
    value: anomalies,
    weight,
  })
}
