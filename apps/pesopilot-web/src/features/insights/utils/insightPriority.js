export const INSIGHT_PRIORITY = Object.freeze({
  high: 'high',
  low: 'low',
  medium: 'medium',
  urgent: 'urgent',
})

export const INSIGHT_PRIORITY_WEIGHT = Object.freeze({
  [INSIGHT_PRIORITY.low]: 1,
  [INSIGHT_PRIORITY.medium]: 2,
  [INSIGHT_PRIORITY.high]: 3,
  [INSIGHT_PRIORITY.urgent]: 4,
})

export function getInsightPriorityWeight(priority) {
  return INSIGHT_PRIORITY_WEIGHT[priority] ?? 0
}
