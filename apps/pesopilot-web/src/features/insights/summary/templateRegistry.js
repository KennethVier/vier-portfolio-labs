import { EMPTY_SUMMARY_TEXT } from './summaryConstants.js'

const RAW_TEMPLATES = [
  // Executive
  {
    category: 'executive',
    id: 'exec.attention',
    text: 'Your financial position requires attention this salary cycle. Taking prompt action on priority concerns will help stabilize your situation.',
  },
  {
    category: 'executive',
    id: 'exec.attention.action',
    text: 'Your financial position requires attention this salary cycle. Your top priority is to {topActionTitle}.',
  },
  {
    category: 'executive',
    id: 'exec.stable',
    text: 'Your finances remain generally healthy and stable this salary cycle. Continuing your current discipline will keep you on track.',
  },
  {
    category: 'executive',
    id: 'exec.stable.action',
    text: 'Your finances remain generally healthy and stable this salary cycle. Your recommended focus is to {topActionTitle}.',
  },
  {
    category: 'executive',
    id: 'exec.neutral',
    text: 'Your financial overview for this cycle has been compiled. Review your key metrics and recommended actions below.',
  },
  {
    category: 'executive',
    id: 'exec.neutral.action',
    text: 'Your financial overview for this cycle has been compiled. Your primary action is to {topActionTitle}.',
  },

  // Position
  {
    category: 'currentPosition',
    id: 'position.cash.positive',
    text: 'You currently have {remainingCash} remaining before your next payday.',
  },
  {
    category: 'currentPosition',
    id: 'position.cash.other',
    text: 'Remaining cash for this period stands at {remainingCash}.',
  },
  {
    category: 'currentPosition',
    id: 'position.income',
    text: 'Total recorded income for this period is {totalIncome}.',
  },
  {
    category: 'currentPosition',
    id: 'position.expenses',
    text: 'Total expenses for this period stand at {totalExpenses}.',
  },
  {
    category: 'currentPosition',
    id: 'position.savingsRate',
    text: 'You saved {savingsRate} of your income this cutoff.',
  },
  {
    category: 'currentPosition',
    id: 'position.topCategory',
    text: '{category} remains your largest spending category.',
  },
  {
    category: 'currentPosition',
    id: 'position.pace',
    text: 'Your spending pace is currently {paceStatus} relative to the cycle timeline.',
  },
  {
    category: 'currentPosition',
    id: 'position.goals',
    text: 'Overall goal completion rate is {completionRate} across {activeGoals} active goals.',
  },
  {
    category: 'currentPosition',
    id: 'position.health',
    text: 'Overall financial health is evaluated as {healthStatus} with a score of {healthScore}.',
  },

  // Highlights
  {
    category: 'highlights',
    id: 'highlight.change.up',
    text: '{metricLabel} increased by {percent} compared to {baselineLabel}.',
  },
  {
    category: 'highlights',
    id: 'highlight.change.down',
    text: '{metricLabel} decreased by {percent} compared to {baselineLabel}.',
  },
  {
    category: 'highlights',
    id: 'highlight.trend.up',
    text: 'Remaining cash has trended upward over the last {cutoffsCompared} cutoffs.',
  },

  // Risks
  {
    category: 'risks',
    id: 'risk.cash.negative',
    text: 'Remaining cash or net cashflow is in a negative position.',
  },
  {
    category: 'risks',
    id: 'risk.pace.fast',
    text: 'Your spending pace is faster than elapsed cycle time, which may deplete remaining funds before payday.',
  },
  {
    category: 'risks',
    id: 'risk.coverage.uncovered',
    text: 'Current income does not cover required outflows for this period.',
  },
  {
    category: 'risks',
    id: 'risk.coverage.partial',
    text: 'Income only partially covers required outflows for this period.',
  },
  {
    category: 'risks',
    id: 'risk.cashflow.stability',
    text: 'Cashflow stability is currently {stabilityStatus}.',
  },
  {
    category: 'risks',
    id: 'risk.income.missing',
    text: 'Expected scheduled income was not detected for this period.',
  },
  {
    category: 'risks',
    id: 'risk.income.unstable',
    text: 'Income records indicate higher variability across cycles.',
  },
  {
    category: 'risks',
    id: 'risk.savings.low',
    text: 'Savings rate of {savingsRate} is below the recommended healthy threshold.',
  },
  {
    category: 'risks',
    id: 'risk.goal.noContributions',
    text: '{goalCount} active goals received no contributions during this period.',
  },
  {
    category: 'risks',
    id: 'risk.health',
    text: 'Financial health is currently evaluated as {healthStatus}.',
  },
  {
    category: 'risks',
    id: 'risk.change.up',
    text: '{metricLabel} increased by {percent} compared to {baselineLabel}.',
  },
  {
    category: 'risks',
    id: 'risk.change.down',
    text: '{metricLabel} decreased by {percent} compared to {baselineLabel}.',
  },
  {
    category: 'risks',
    id: 'risk.trend.down',
    text: 'Remaining cash has trended downward over the last {cutoffsCompared} cutoffs.',
  },

  // Positive Observations
  {
    category: 'positiveObservations',
    id: 'positive.cashflow',
    text: 'Remaining cash and net cashflow remain in a positive position.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.pace',
    text: 'Spending pace remains on track throughout this cycle.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.coverage',
    text: 'Income fully covers all required obligations for this period.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.cashflowStability',
    text: 'Cashflow stability remains consistent and healthy.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.incomeStability',
    text: 'Income records demonstrate consistent and stable earnings.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.savingsRate',
    text: 'Savings rate remains strong at {savingsRate}.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.savingsConsistency',
    text: 'Savings contributions were maintained consistently.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.goalsCompleted',
    text: 'You have completed {completedGoals} financial goals.',
  },
  {
    category: 'positiveObservations',
    id: 'positive.health',
    text: 'Financial health score remains in the {healthStatus} range.',
  },

  // Priority Actions
  {
    category: 'priorityActions',
    id: 'action.default',
    text: '{title}. {explanation}',
  },

  // Closing
  {
    category: 'closing',
    id: 'closing.attention',
    text: 'Overall, prompt attention to spending control and upcoming obligations will help restore financial stability.',
  },
  {
    category: 'closing',
    id: 'closing.stable',
    text: 'Overall, your finances remain stable. Continuing your current habits while following priority recommendations will support your financial goals.',
  },
  {
    category: 'closing',
    id: 'closing.neutral',
    text: 'Reviewing your transactions and maintaining regular tracking will support informed financial decisions.',
  },

  // Empty State
  {
    category: 'emptyState',
    id: 'summary.empty',
    text: EMPTY_SUMMARY_TEXT,
  },
]

export const TEMPLATE_REGISTRY = Object.freeze(
  new Map(
    RAW_TEMPLATES.map((tmpl) => [
      tmpl.id,
      Object.freeze({
        category: tmpl.category,
        id: tmpl.id,
        language: 'en',
        text: tmpl.text,
        version: '1.0.0',
      }),
    ]),
  ),
)

export function getTemplate(templateId) {
  return TEMPLATE_REGISTRY.get(templateId) ?? null
}

export function renderTemplate(templateId, variables = {}) {
  const template = getTemplate(templateId)
  if (!template) return null

  // Ensure all {varName} placeholders are provided in variables
  const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g
  let match
  while ((match = placeholderRegex.exec(template.text)) !== null) {
    const varName = match[1]
    if (variables[varName] === undefined || variables[varName] === null) {
      return null
    }
  }

  return template.text.replace(placeholderRegex, (_, varName) =>
    String(variables[varName] ?? ''),
  )
}
