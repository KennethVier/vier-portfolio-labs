import { DOMAINS_ORDER, SEVERITY_WEIGHT } from '../rules/recommendation/recommendationRuleConstants.js'

export const SUMMARY_SECTION_TYPES = Object.freeze({
  closing: 'closing_summary',
  currentPosition: 'current_position',
  executive: 'executive',
  highlights: 'financial_highlights',
  positiveObservations: 'positive_observations',
  priorityActions: 'priority_actions',
  risks: 'risks',
})

export const SUMMARY_SECTION_TITLES = Object.freeze({
  [SUMMARY_SECTION_TYPES.executive]: 'Executive Summary',
  [SUMMARY_SECTION_TYPES.currentPosition]: 'Current Financial Position',
  [SUMMARY_SECTION_TYPES.highlights]: 'Financial Highlights',
  [SUMMARY_SECTION_TYPES.risks]: 'Risks',
  [SUMMARY_SECTION_TYPES.positiveObservations]: 'Positive Observations',
  [SUMMARY_SECTION_TYPES.priorityActions]: 'Priority Actions',
  [SUMMARY_SECTION_TYPES.closing]: 'Closing Summary',
})

export const CANONICAL_SECTION_ORDER = Object.freeze([
  SUMMARY_SECTION_TYPES.executive,
  SUMMARY_SECTION_TYPES.currentPosition,
  SUMMARY_SECTION_TYPES.highlights,
  SUMMARY_SECTION_TYPES.risks,
  SUMMARY_SECTION_TYPES.positiveObservations,
  SUMMARY_SECTION_TYPES.priorityActions,
  SUMMARY_SECTION_TYPES.closing,
])

export const SECTION_CAPS = Object.freeze({
  highlights: 3,
  positiveObservations: 3,
  priorityActions: 3,
  risks: 5,
})

export const METRIC_POLARITY = Object.freeze({
  expenses: Object.freeze({ decrease: 'good', increase: 'bad' }),
  income: Object.freeze({ decrease: 'bad', increase: 'good' }),
  remainingCash: Object.freeze({ decrease: 'bad', increase: 'good' }),
  savings: Object.freeze({ decrease: 'bad', increase: 'good' }),
})

export const BASELINE_LABELS = Object.freeze({
  lastCutoff: 'your previous cutoff',
  lastMonth: 'last month',
  monthlyAverage: 'your monthly average',
})

export const METRIC_LABELS = Object.freeze({
  expenses: 'Expenses',
  income: 'Income',
  remainingCash: 'Remaining cash',
  savings: 'Savings',
})

export const EMPTY_SUMMARY_TEXT =
  'Not enough financial information is currently available to generate a financial summary.'

export const NARRATIVE_TONES = Object.freeze({
  attention: 'attention',
  neutral: 'neutral',
  stable: 'stable',
})

export { DOMAINS_ORDER, SEVERITY_WEIGHT }
