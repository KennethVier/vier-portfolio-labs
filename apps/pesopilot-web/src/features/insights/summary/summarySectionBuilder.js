import {
  BASELINE_LABELS,
  METRIC_LABELS,
  METRIC_POLARITY,
  SEVERITY_WEIGHT,
} from './summaryConstants.js'
import { CASHFLOW_RULE_IDS } from '../rules/cashflow/cashflowRuleConstants.js'
import { GOAL_RULE_IDS } from '../rules/goal/goalRuleConstants.js'
import { INCOME_RULE_IDS } from '../rules/income/incomeRuleConstants.js'
import { SAVINGS_RULE_IDS } from '../rules/savings/savingsRuleConstants.js'

export function formatCurrency(amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '₱0'
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}

export function formatPercent(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '0%'
  return `${value.toLocaleString('en-PH', { maximumFractionDigits: 2 })}%`
}

export function hasSufficientFinancialData(bundle) {
  if (!bundle || typeof bundle !== 'object') return false

  const hasCashflow =
    bundle.cashflow?.metrics &&
    bundle.cashflow.metrics.position !== 'No Data' &&
    (bundle.cashflow.metrics.remainingCash !== 0 ||
      bundle.cashflow.metrics.netCashflow !== 0)

  const hasIncome =
    bundle.income?.metrics &&
    (bundle.income.metrics.totalIncome > 0 ||
      bundle.income.metrics.incomeCount > 0)

  const hasExpenses =
    bundle.expenses?.metrics &&
    (bundle.expenses.metrics.totalExpenses > 0 ||
      bundle.expenses.metrics.expenseCount > 0)

  const hasSavings =
    bundle.savings?.metrics &&
    (bundle.savings.metrics.totalSavings > 0 ||
      bundle.savings.metrics.savingsCount > 0 ||
      (bundle.savings.metrics.savingsRate?.status &&
        bundle.savings.metrics.savingsRate.status !== 'No Data'))

  const hasGoals =
    bundle.goals?.metrics &&
    (bundle.goals.metrics.totalGoals > 0 ||
      bundle.goals.metrics.activeGoals > 0)

  return Boolean(
    hasCashflow || hasIncome || hasExpenses || hasSavings || hasGoals,
  )
}

function getHighestSeverity(items) {
  if (!Array.isArray(items) || items.length === 0) return null

  let highest = null
  let maxWeight = -1
  for (const item of items) {
    const sev = item?.severity
    if (typeof sev !== 'string') continue
    const weight = Object.prototype.hasOwnProperty.call(SEVERITY_WEIGHT, sev)
      ? SEVERITY_WEIGHT[sev]
      : -1
    if (weight > maxWeight) {
      maxWeight = weight
      highest = sev
    } else if (highest === null) {
      highest = sev
    }
  }
  return highest
}

function findBreakdownSeverity(breakdown, ruleIds) {
  if (!Array.isArray(breakdown)) return null
  const matching = breakdown.filter((b) => ruleIds.includes(b?.id))
  return getHighestSeverity(matching)
}

function findHealthRiskSeverity(breakdown) {
  if (!Array.isArray(breakdown)) return null
  const negativeItems = breakdown.filter(
    (b) => b?.status === 'warning' || b?.status === 'fail',
  )
  return getHighestSeverity(negativeItems)
}

export function buildCandidateSections({
  insightBundle,
  recommendationBundle,
}) {
  if (!hasSufficientFinancialData(insightBundle)) {
    return {
      candidates: [],
      coverage: {
        current: 'unavailable',
        historical: 'unavailable',
        monthly: 'unavailable',
      },
      state: 'empty',
    }
  }

  const candidates = []
  let hasCurrent = false
  let hasMonthly = false
  let hasHistorical = false

  const cashflow = insightBundle.cashflow
  const income = insightBundle.income
  const expenses = insightBundle.expenses
  const savings = insightBundle.savings
  const goals = insightBundle.goals
  const health = insightBundle.health
  const cutoff = insightBundle.cutoff

  // ==========================================
  // 1. Current Position Candidates
  // ==========================================
  if (cashflow?.metrics && typeof cashflow.metrics.remainingCash === 'number') {
    const cash = cashflow.metrics.remainingCash
    const isPositive = cash >= 0
    candidates.push({
      evidence: [
        {
          label: 'Remaining Cash',
          source: 'cashflow.metrics.remainingCash',
          value: cash,
        },
      ],
      horizon: 'current',
      key: 'position_cash',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.cash',
      templateId: isPositive
        ? 'position.cash.positive'
        : 'position.cash.other',
      variables: { remainingCash: formatCurrency(cash) },
    })
    hasCurrent = true
  }

  if (income?.metrics && income.metrics.totalIncome > 0) {
    const total = income.metrics.totalIncome
    candidates.push({
      evidence: [
        {
          label: 'Total Income',
          source: 'income.metrics.totalIncome',
          value: total,
        },
      ],
      horizon: 'current',
      key: 'position_income',
      relatedInsights: ['income'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.income',
      templateId: 'position.income',
      variables: { totalIncome: formatCurrency(total) },
    })
    hasCurrent = true
  }

  if (expenses?.metrics && expenses.metrics.totalExpenses > 0) {
    const total = expenses.metrics.totalExpenses
    candidates.push({
      evidence: [
        {
          label: 'Total Expenses',
          source: 'expenses.metrics.totalExpenses',
          value: total,
        },
      ],
      horizon: 'current',
      key: 'position_expenses',
      relatedInsights: ['expense'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.expenses',
      templateId: 'position.expenses',
      variables: { totalExpenses: formatCurrency(total) },
    })
    hasCurrent = true
  }

  if (
    savings?.metrics?.savingsRate &&
    savings.metrics.savingsRate.status !== 'No Data' &&
    typeof savings.metrics.savingsRate.rate === 'number'
  ) {
    const rate = savings.metrics.savingsRate.rate
    candidates.push({
      evidence: [
        {
          label: 'Savings Rate',
          source: 'savings.metrics.savingsRate.rate',
          value: rate,
        },
      ],
      horizon: 'current',
      key: 'position_savings_rate',
      relatedInsights: ['savings'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.savingsRate',
      templateId: 'position.savingsRate',
      variables: { savingsRate: formatPercent(rate) },
    })
    hasCurrent = true
  }

  // Top spending category (Correction 4)
  const topCatName = expenses?.metrics?.topSpendingCategory?.categoryName
  if (typeof topCatName === 'string' && topCatName.trim() !== '') {
    candidates.push({
      evidence: [
        {
          label: 'Top Spending Category',
          source: 'expenses.metrics.topSpendingCategory.categoryName',
          value: topCatName,
        },
      ],
      horizon: 'current',
      key: 'position_top_category',
      relatedInsights: ['expense'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.topCategory',
      templateId: 'position.topCategory',
      variables: { category: topCatName },
    })
    hasCurrent = true
  }

  const paceStatus = cashflow?.metrics?.spendingPace?.status
  if (
    paceStatus &&
    paceStatus !== 'No Data' &&
    paceStatus !== 'Fast'
  ) {
    candidates.push({
      evidence: [
        {
          label: 'Spending Pace',
          source: 'cashflow.metrics.spendingPace.status',
          value: paceStatus,
        },
      ],
      horizon: 'current',
      key: 'position_pace',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.pace',
      templateId: 'position.pace',
      variables: { paceStatus: paceStatus.toLowerCase() },
    })
    hasCurrent = true
  }

  if (
    goals?.metrics &&
    goals.metrics.activeGoals > 0 &&
    typeof goals.metrics.overallCompletionRate === 'number'
  ) {
    const rate = goals.metrics.overallCompletionRate
    candidates.push({
      evidence: [
        {
          label: 'Goal Completion Rate',
          source: 'goals.metrics.overallCompletionRate',
          value: rate,
        },
      ],
      horizon: 'current',
      key: 'position_goals',
      relatedInsights: ['goal'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.goals',
      templateId: 'position.goals',
      variables: {
        activeGoals: goals.metrics.activeGoals,
        completionRate: formatPercent(rate),
      },
    })
    hasCurrent = true
  }

  if (
    health?.status &&
    typeof health.score === 'number'
  ) {
    candidates.push({
      evidence: [
        {
          label: 'Health Score',
          source: 'health.score',
          value: health.score,
        },
      ],
      horizon: 'current',
      key: 'position_health',
      relatedInsights: ['health'],
      relatedRecommendations: [],
      sectionType: 'currentPosition',
      subject: 'position.health',
      templateId: 'position.health',
      variables: {
        healthScore: health.score,
        healthStatus: health.status,
      },
    })
    hasCurrent = true
  }

  // ==========================================
  // 2. Risk Candidates
  // ==========================================
  // Rule-based risks: copy existing RuleResult severity from breakdown
  if (cashflow?.metrics?.position === 'Negative') {
    const sev = findBreakdownSeverity(cashflow.breakdown, [
      CASHFLOW_RULE_IDS.remainingCash,
      CASHFLOW_RULE_IDS.netCashflow,
    ])
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Cashflow Position',
          source: 'cashflow.metrics.position',
          value: cashflow.metrics.position,
        },
      ],
      horizon: 'current',
      key: 'risk_cashflow_negative',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'cashflow_position',
      templateId: 'risk.cash.negative',
      variables: {},
    })
    hasCurrent = true
  }

  if (cashflow?.metrics?.spendingPace?.status === 'Fast') {
    const sev = findBreakdownSeverity(cashflow.breakdown, [
      CASHFLOW_RULE_IDS.spendingPace,
    ])
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Spending Pace',
          source: 'cashflow.metrics.spendingPace.status',
          value: 'Fast',
        },
      ],
      horizon: 'current',
      key: 'risk_spending_pace_fast',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'spending_pace',
      templateId: 'risk.pace.fast',
      variables: {},
    })
    hasCurrent = true
  }

  if (cashflow?.metrics?.incomeCoverage?.status === 'Uncovered') {
    const sev = findBreakdownSeverity(cashflow.breakdown, [
      CASHFLOW_RULE_IDS.incomeCoverage,
    ])
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Income Coverage',
          source: 'cashflow.metrics.incomeCoverage.status',
          value: 'Uncovered',
        },
      ],
      horizon: 'current',
      key: 'risk_income_coverage_uncovered',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'income_coverage',
      templateId: 'risk.coverage.uncovered',
      variables: {},
    })
    hasCurrent = true
  } else if (cashflow?.metrics?.incomeCoverage?.status === 'Partial') {
    const sev = findBreakdownSeverity(cashflow.breakdown, [
      CASHFLOW_RULE_IDS.incomeCoverage,
    ])
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Income Coverage',
          source: 'cashflow.metrics.incomeCoverage.status',
          value: 'Partial',
        },
      ],
      horizon: 'current',
      key: 'risk_income_coverage_partial',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'income_coverage',
      templateId: 'risk.coverage.partial',
      variables: {},
    })
    hasCurrent = true
  }

  const stabilityStatus = cashflow?.metrics?.stability?.status
  if (stabilityStatus === 'Strained' || stabilityStatus === 'Unstable') {
    const sev = findBreakdownSeverity(cashflow.breakdown, [
      CASHFLOW_RULE_IDS.cashflowStability,
    ])
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Cashflow Stability',
          source: 'cashflow.metrics.stability.status',
          value: stabilityStatus,
        },
      ],
      horizon: 'current',
      key: 'risk_cashflow_stability',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'cashflow_stability',
      templateId: 'risk.cashflow.stability',
      variables: { stabilityStatus: stabilityStatus.toLowerCase() },
    })
    hasCurrent = true
  }

  if (income?.metrics?.missingIncome?.missing === true) {
    const sev = findBreakdownSeverity(income.breakdown, [
      INCOME_RULE_IDS.missingIncomeDetection,
    ])
    candidates.push({
      domain: 'income',
      evidence: [
        {
          label: 'Missing Scheduled Income',
          source: 'income.metrics.missingIncome.missing',
          value: true,
        },
      ],
      horizon: 'current',
      key: 'risk_income_missing',
      relatedInsights: ['income'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'missing_income',
      templateId: 'risk.income.missing',
      variables: {},
    })
    hasCurrent = true
  }

  if (income?.metrics?.stability?.status === 'Unstable') {
    const sev = findBreakdownSeverity(income.breakdown, [
      INCOME_RULE_IDS.incomeStability,
    ])
    candidates.push({
      domain: 'income',
      evidence: [
        {
          label: 'Income Stability',
          source: 'income.metrics.stability.status',
          value: 'Unstable',
        },
      ],
      horizon: 'current',
      key: 'risk_income_unstable',
      relatedInsights: ['income'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'income_stability',
      templateId: 'risk.income.unstable',
      variables: {},
    })
    hasCurrent = true
  }

  if (savings?.metrics?.savingsRate?.status === 'Low') {
    const sev = findBreakdownSeverity(savings.breakdown, [
      SAVINGS_RULE_IDS.savingsRate,
    ])
    const rate = savings.metrics.savingsRate.rate ?? 0
    candidates.push({
      domain: 'savings',
      evidence: [
        {
          label: 'Savings Rate',
          source: 'savings.metrics.savingsRate.rate',
          value: rate,
        },
      ],
      horizon: 'current',
      key: 'risk_savings_low',
      relatedInsights: ['savings'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'savings_rate',
      templateId: 'risk.savings.low',
      variables: { savingsRate: formatPercent(rate) },
    })
    hasCurrent = true
  }

  if (goals?.metrics?.goalsWithoutContributions?.length > 0) {
    const count = goals.metrics.goalsWithoutContributions.length
    const sev = findBreakdownSeverity(goals.breakdown, [
      GOAL_RULE_IDS.goalsWithoutContributions,
    ])
    candidates.push({
      domain: 'goal',
      evidence: [
        {
          label: 'Goals Without Contributions Count',
          source: 'goals.metrics.goalsWithoutContributions.length',
          value: count,
        },
      ],
      horizon: 'current',
      key: 'risk_goals_no_contributions',
      relatedInsights: ['goal'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'goal_contributions',
      templateId: 'risk.goal.noContributions',
      variables: { goalCount: count },
    })
    hasCurrent = true
  }

  if (health?.status === 'Critical' || health?.status === 'Needs Attention') {
    const sev = findHealthRiskSeverity(health.breakdown)
    candidates.push({
      domain: 'health',
      evidence: [
        {
          label: 'Health Status',
          source: 'health.status',
          value: health.status,
        },
      ],
      horizon: 'current',
      key: 'risk_health_status',
      relatedInsights: ['health'],
      relatedRecommendations: [],
      sectionType: 'risks',
      severity: sev,
      subject: 'health_status',
      templateId: 'risk.health',
      variables: { healthStatus: health.status },
    })
    hasCurrent = true
  }

  // ==========================================
  // 3. Positive Observation Candidates
  // ==========================================
  if (cashflow?.metrics?.position === 'Positive') {
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Cashflow Position',
          source: 'cashflow.metrics.position',
          value: 'Positive',
        },
      ],
      horizon: 'current',
      key: 'positive_cashflow_position',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'cashflow_position',
      templateId: 'positive.cashflow',
      variables: {},
    })
    hasCurrent = true
  }

  if (paceStatus === 'On Pace' || paceStatus === 'Slow') {
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Spending Pace',
          source: 'cashflow.metrics.spendingPace.status',
          value: paceStatus,
        },
      ],
      horizon: 'current',
      key: 'positive_spending_pace',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'spending_pace',
      templateId: 'positive.pace',
      variables: {},
    })
    hasCurrent = true
  }

  if (cashflow?.metrics?.incomeCoverage?.status === 'Covered') {
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Income Coverage',
          source: 'cashflow.metrics.incomeCoverage.status',
          value: 'Covered',
        },
      ],
      horizon: 'current',
      key: 'positive_income_coverage',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'income_coverage',
      templateId: 'positive.coverage',
      variables: {},
    })
    hasCurrent = true
  }

  if (stabilityStatus === 'Stable') {
    candidates.push({
      domain: 'cashflow',
      evidence: [
        {
          label: 'Cashflow Stability',
          source: 'cashflow.metrics.stability.status',
          value: 'Stable',
        },
      ],
      horizon: 'current',
      key: 'positive_cashflow_stability',
      relatedInsights: ['cashflow'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'cashflow_stability',
      templateId: 'positive.cashflowStability',
      variables: {},
    })
    hasCurrent = true
  }

  if (income?.metrics?.stability?.status === 'Stable') {
    candidates.push({
      domain: 'income',
      evidence: [
        {
          label: 'Income Stability',
          source: 'income.metrics.stability.status',
          value: 'Stable',
        },
      ],
      horizon: 'current',
      key: 'positive_income_stability',
      relatedInsights: ['income'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'income_stability',
      templateId: 'positive.incomeStability',
      variables: {},
    })
    hasCurrent = true
  }

  const savingsRateStatus = savings?.metrics?.savingsRate?.status
  if (savingsRateStatus === 'Strong' || savingsRateStatus === 'Acceptable') {
    const rate = savings.metrics.savingsRate.rate ?? 0
    candidates.push({
      domain: 'savings',
      evidence: [
        {
          label: 'Savings Rate',
          source: 'savings.metrics.savingsRate.rate',
          value: rate,
        },
      ],
      horizon: 'current',
      key: 'positive_savings_rate',
      relatedInsights: ['savings'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'savings_rate',
      templateId: 'positive.savingsRate',
      variables: { savingsRate: formatPercent(rate) },
    })
    hasCurrent = true
  }

  if (savings?.metrics?.consistency?.status === 'Stable') {
    candidates.push({
      domain: 'savings',
      evidence: [
        {
          label: 'Savings Consistency',
          source: 'savings.metrics.consistency.status',
          value: 'Stable',
        },
      ],
      horizon: 'current',
      key: 'positive_savings_consistency',
      relatedInsights: ['savings'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'savings_consistency',
      templateId: 'positive.savingsConsistency',
      variables: {},
    })
    hasCurrent = true
  }

  if (goals?.metrics?.completedGoals > 0) {
    const count = goals.metrics.completedGoals
    candidates.push({
      domain: 'goal',
      evidence: [
        {
          label: 'Completed Goals',
          source: 'goals.metrics.completedGoals',
          value: count,
        },
      ],
      horizon: 'current',
      key: 'positive_goals_completed',
      relatedInsights: ['goal'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'goals_completed',
      templateId: 'positive.goalsCompleted',
      variables: { completedGoals: count },
    })
    hasCurrent = true
  }

  if (health?.status === 'Excellent' || health?.status === 'Healthy') {
    candidates.push({
      domain: 'health',
      evidence: [
        {
          label: 'Health Status',
          source: 'health.status',
          value: health.status,
        },
      ],
      horizon: 'current',
      key: 'positive_health_status',
      relatedInsights: ['health'],
      relatedRecommendations: [],
      sectionType: 'positiveObservations',
      subject: 'health_status',
      templateId: 'positive.health',
      variables: { healthStatus: health.status },
    })
    hasCurrent = true
  }

  // ==========================================
  // 4. Monthly Comparisons & Highlights
  // ==========================================
  // Income monthlyComparison
  const incMonthly = income?.metrics?.monthlyComparison
  if (
    incMonthly &&
    incMonthly.currentMonth != null &&
    incMonthly.previousMonth != null &&
    incMonthly.direction &&
    incMonthly.direction !== 'No Data'
  ) {
    const isIncrease = incMonthly.direction === 'Increasing'
    const metricLabel = METRIC_LABELS.income
    const percent = formatPercent(Math.abs(incMonthly.percentageChange))
    const baselineLabel = BASELINE_LABELS.lastMonth
    const isGood = isIncrease
      ? METRIC_POLARITY.income.increase === 'good'
      : METRIC_POLARITY.income.decrease === 'good'

    candidates.push({
      domain: 'income',
      evidence: [
        {
          label: 'Income Monthly Percentage Change',
          source: 'income.metrics.monthlyComparison.percentageChange',
          value: incMonthly.percentageChange,
        },
      ],
      horizon: 'monthly',
      key: 'income_monthly_comparison',
      relatedInsights: ['income'],
      relatedRecommendations: [],
      sectionType: isGood ? 'highlights' : 'risks',
      severity: isGood ? null : null, // Comparison risks have no source RuleResult severity (Correction 2)
      subject: 'comparison_income_monthly',
      templateId: isGood
        ? isIncrease
          ? 'highlight.change.up'
          : 'highlight.change.down'
        : isIncrease
          ? 'risk.change.up'
          : 'risk.change.down',
      variables: { baselineLabel, metricLabel, percent },
    })
    hasMonthly = true
  }

  // Cutoff averageComparison
  const avgComp = cutoff?.metrics?.averageComparison
  if (avgComp && avgComp.monthCount > 0) {
    const metricsToCheck = ['income', 'expenses', 'savings', 'remainingCash']
    for (const metricKey of metricsToCheck) {
      const comp = avgComp[metricKey]
      if (comp && comp.direction && comp.direction !== 'No Data') {
        const isIncrease = comp.direction === 'Increasing'
        const metricLabel = METRIC_LABELS[metricKey]
        const percent = formatPercent(Math.abs(comp.percentageChange))
        const baselineLabel = BASELINE_LABELS.monthlyAverage
        const isGood = isIncrease
          ? METRIC_POLARITY[metricKey].increase === 'good'
          : METRIC_POLARITY[metricKey].decrease === 'good'

        candidates.push({
          domain: 'cutoff',
          evidence: [
            {
              label: `${metricLabel} Average Comparison Change`,
              source: `cutoff.metrics.averageComparison.${metricKey}.percentageChange`,
              value: comp.percentageChange,
            },
          ],
          horizon: 'monthly',
          key: `cutoff_avg_${metricKey}`,
          relatedInsights: ['cutoff'],
          relatedRecommendations: [],
          sectionType: isGood ? 'highlights' : 'risks',
          severity: null, // No source RuleResult severity
          subject: `comparison_${metricKey}_average`,
          templateId: isGood
            ? isIncrease
              ? 'highlight.change.up'
              : 'highlight.change.down'
            : isIncrease
              ? 'risk.change.up'
              : 'risk.change.down',
          variables: { baselineLabel, metricLabel, percent },
        })
        hasMonthly = true
      }
    }
  }

  // ==========================================
  // 5. Historical Comparisons & Trends
  // ==========================================
  const prevCutoffComp = cutoff?.metrics?.previousCutoffComparison
  const historicalMetrics = ['income', 'expenses', 'savings', 'remainingCash']

  for (const metricKey of historicalMetrics) {
    let comp = prevCutoffComp?.[metricKey]
    let sourcePath = `cutoff.metrics.previousCutoffComparison.${metricKey}.percentageChange`

    // Fallbacks if cutoff comparison is 'No Data'
    if (!comp || comp.direction === 'No Data') {
      if (metricKey === 'income' && income?.metrics?.previousCutoffComparison) {
        comp = income.metrics.previousCutoffComparison
        sourcePath = 'income.metrics.previousCutoffComparison.percentageChange'
      } else if (
        metricKey === 'savings' &&
        savings?.metrics?.previousCutoffComparison
      ) {
        comp = savings.metrics.previousCutoffComparison
        sourcePath = 'savings.metrics.previousCutoffComparison.percentageChange'
      } else if (metricKey === 'expenses' && expenses?.metrics?.trend) {
        comp = expenses.metrics.trend
        sourcePath = 'expenses.metrics.trend.percentageChange'
      }
    }

    if (comp && comp.direction && comp.direction !== 'No Data') {
      const isIncrease = comp.direction === 'Increasing'
      const metricLabel = METRIC_LABELS[metricKey]
      const percent = formatPercent(Math.abs(comp.percentageChange))
      const baselineLabel = BASELINE_LABELS.lastCutoff
      const isGood = isIncrease
        ? METRIC_POLARITY[metricKey].increase === 'good'
        : METRIC_POLARITY[metricKey].decrease === 'good'

      candidates.push({
        domain: metricKey === 'remainingCash' ? 'cutoff' : metricKey,
        evidence: [
          {
            label: `${metricLabel} Previous Cutoff Change`,
            source: sourcePath,
            value: comp.percentageChange,
          },
        ],
        horizon: 'historical',
        key: `prev_cutoff_${metricKey}`,
        relatedInsights: [metricKey === 'remainingCash' ? 'cutoff' : metricKey],
        relatedRecommendations: [],
        sectionType: isGood ? 'highlights' : 'risks',
        severity: null, // Comparison risks have no source RuleResult severity
        subject: `comparison_${metricKey}_previous_cutoff`,
        templateId: isGood
          ? isIncrease
            ? 'highlight.change.up'
            : 'highlight.change.down'
          : isIncrease
            ? 'risk.change.up'
            : 'risk.change.down',
        variables: { baselineLabel, metricLabel, percent },
      })
      hasHistorical = true
    }
  }

  // Cutoff trend
  const cutoffTrend = cutoff?.metrics?.trend
  if (
    cutoffTrend &&
    cutoffTrend.cutoffsCompared >= 2 &&
    (cutoffTrend.direction === 'Increasing' ||
      cutoffTrend.direction === 'Decreasing')
  ) {
    const isIncreasing = cutoffTrend.direction === 'Increasing'
    candidates.push({
      domain: 'cutoff',
      evidence: [
        {
          label: 'Cutoff Trend Direction',
          source: 'cutoff.metrics.trend.direction',
          value: cutoffTrend.direction,
        },
      ],
      horizon: 'historical',
      key: 'cutoff_trend',
      relatedInsights: ['cutoff'],
      relatedRecommendations: [],
      sectionType: isIncreasing ? 'highlights' : 'risks',
      severity: null, // Trend risks have no source RuleResult severity
      subject: 'cutoff_trend',
      templateId: isIncreasing ? 'highlight.trend.up' : 'risk.trend.down',
      variables: { cutoffsCompared: cutoffTrend.cutoffsCompared },
    })
    hasHistorical = true
  }

  // ==========================================
  // 6. Priority Actions Candidates
  // ==========================================
  if (Array.isArray(recommendationBundle?.recommendations)) {
    for (const rec of recommendationBundle.recommendations) {
      if (rec && typeof rec === 'object') {
        candidates.push({
          domain: rec.domain ?? 'general',
          evidence: Array.isArray(rec.evidence) ? [...rec.evidence] : [],
          horizon: 'current',
          key: `action_${rec.id}`,
          rank: rec.rank ?? null,
          relatedInsights: rec.domain ? [rec.domain] : [],
          relatedRecommendations: [rec.id],
          sectionType: 'priorityActions',
          subject: `action_${rec.id}`,
          templateId: 'action.default',
          variables: {
            explanation: rec.explanation ?? '',
            title: rec.title ?? '',
          },
        })
        hasCurrent = true
      }
    }
  }

  return {
    candidates,
    coverage: {
      current: hasCurrent ? 'available' : 'unavailable',
      historical: hasHistorical ? 'available' : 'unavailable',
      monthly: hasMonthly ? 'available' : 'unavailable',
    },
    state: 'ready',
  }
}
