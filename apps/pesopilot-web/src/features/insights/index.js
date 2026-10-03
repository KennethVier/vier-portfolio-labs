export { createInsightBundle } from './models/insightBundle.js'
export {
  createEmptyExpenseMetrics,
  createExpenseInsight,
  EXPENSE_TREND,
} from './models/expenseInsight.js'
export {
  createExpenseRuleResult,
  EXPENSE_RULE_STATUS,
} from './models/expenseRuleResult.js'
export {
  createEmptyGoalMetrics,
  createGoalInsight,
  GOAL_CONSISTENCY,
} from './models/goalInsight.js'
export {
  createGoalRuleResult,
  GOAL_RULE_STATUS,
} from './models/goalRuleResult.js'
export { createHealthInsight, HEALTH_STATUS } from './models/healthInsight.js'
export {
  createHealthRuleResult,
  HEALTH_RULE_STATUS,
} from './models/healthRuleResult.js'
export {
  createEmptyIncomeMetrics,
  createIncomeInsight,
  INCOME_STABILITY,
  INCOME_TREND,
} from './models/incomeInsight.js'
export {
  createIncomeRuleResult,
  INCOME_RULE_STATUS,
} from './models/incomeRuleResult.js'
export {
  CUTOFF_TREND,
  createCutoffInsight,
  createEmptyCutoffMetrics,
} from './models/cutoffInsight.js'
export {
  CUTOFF_RULE_STATUS,
  createCutoffRuleResult,
} from './models/cutoffRuleResult.js'
export { generateCutoffInsight } from './rules/cutoff/cutoffEngine.js'
export {
  CUTOFF_RULE_IDS,
  CUTOFF_RULE_WEIGHTS,
  cutoffRuleRegistry,
} from './rules/cutoff/cutoffRuleRegistry.js'
export {
  createEmptySavingsMetrics,
  createSavingsInsight,
  SAVINGS_CONSISTENCY,
  SAVINGS_RATE_STATUS,
  SAVINGS_TREND,
} from './models/savingsInsight.js'
export {
  createSavingsRuleResult,
  SAVINGS_RULE_STATUS,
} from './models/savingsRuleResult.js'
export { INSIGHT_TYPES } from './models/insightTypes.js'
export { useInsights } from './hooks/useInsights.js'
export { insightService } from './services/insightService.js'
export { generateExpenseInsight } from './rules/expense/expenseEngine.js'
export {
  EXPENSE_RULE_IDS,
  EXPENSE_RULE_WEIGHTS,
  expenseRuleRegistry,
} from './rules/expense/expenseRuleRegistry.js'
export { generateGoalInsight } from './rules/goal/goalEngine.js'
export {
  GOAL_RULE_IDS,
  GOAL_RULE_WEIGHTS,
  goalRuleRegistry,
} from './rules/goal/goalRuleRegistry.js'
export { generateHealthInsight } from './rules/health/healthEngine.js'
export {
  HEALTH_RULE_IDS,
  HEALTH_RULE_WEIGHTS,
  healthRuleRegistry,
} from './rules/health/healthRuleRegistry.js'
export { generateIncomeInsight } from './rules/income/incomeEngine.js'
export {
  INCOME_RULE_IDS,
  INCOME_RULE_WEIGHTS,
  incomeRuleRegistry,
} from './rules/income/incomeRuleRegistry.js'
export { generateSavingsInsight } from './rules/savings/savingsEngine.js'
export {
  SAVINGS_RULE_IDS,
  SAVINGS_RULE_WEIGHTS,
  savingsRuleRegistry,
} from './rules/savings/savingsRuleRegistry.js'
export {
  DEFAULT_INSIGHT_SCOPE,
  INSIGHT_SCOPES,
} from './utils/insightConstants.js'
export {
  INSIGHT_PRIORITY,
  INSIGHT_PRIORITY_WEIGHT,
  getInsightPriorityWeight,
} from './utils/insightPriority.js'
export { INSIGHT_SEVERITY } from './utils/insightSeverity.js'
export {
  createRecommendation,
  RECOMMENDATION_DOMAINS,
} from './models/recommendation.js'
export { createRecommendationBundle } from './models/recommendationBundle.js'
export { generateRecommendations } from './rules/recommendation/recommendationEngine.js'
export { recommendationRuleRegistry } from './rules/recommendation/recommendationRuleRegistry.js'
export {
  DOMAINS_ORDER,
  RECOMMENDATION_ACTION_KEYS,
  RECOMMENDATION_RULE_IDS,
} from './rules/recommendation/recommendationRuleConstants.js'
export {
  createFinancialSummary,
  ENGINE_VERSION,
  NARRATIVE_VERSION,
  SUMMARY_TYPE,
  SUMMARY_VERSION,
} from './models/financialSummary.js'
export {
  createSummaryParagraph,
  createSummarySection,
} from './models/summarySection.js'
export {
  CANONICAL_SECTION_ORDER,
  SECTION_CAPS,
  SUMMARY_SECTION_TITLES,
  SUMMARY_SECTION_TYPES,
} from './summary/summaryConstants.js'
export { generateFinancialSummary } from './summary/summaryEngine.js'
export {
  summaryHistoryService,
  SUMMARY_HISTORY_TYPES,
} from './services/summaryHistoryService.js'
