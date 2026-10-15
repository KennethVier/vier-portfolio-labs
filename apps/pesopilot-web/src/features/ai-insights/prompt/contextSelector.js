import { GOAL_RULE_IDS } from '../../insights/rules/goal/goalRuleConstants.js'
import { HEALTH_RULE_IDS } from '../../insights/rules/health/healthRuleConstants.js'
import {
  RECOMMENDATION_ACTION_KEYS,
  RECOMMENDATION_RULE_IDS,
} from '../../insights/rules/recommendation/recommendationRuleConstants.js'

export const CONTEXT_VERSION = '1.0.0'

// ---------------------------------------------------------------------------
// v1 MVP AI context boundary (ADR-008 scope)
//
// Savings Goals (Phase 14+) and the composite Financial Health Score
// (Phase 16+) are outside the v1 MVP. Historical RecommendationBundles and
// FinancialSummaries may still embed that legacy content, so it is excluded
// here, at the point where deterministic context enters the AI prompt.
//
// Policy:
// - Exclusion is decided ONLY from structured provenance (domain, id,
//   actionKey, sourceRuleIds, evidence ruleId/source, paragraph key,
//   templateId, relatedInsights, relatedRecommendations). Free text is never
//   scanned, so ordinary wording such as "goal" or "healthy" is unaffected.
// - Mixed provenance is excluded conservatively: if ANY provenance marker of a
//   recommendation or summary paragraph references a prohibited source, the
//   whole item is dropped from the AI context. Text is never rewritten.
// - Health rule ids that collide with authorized rule ids (e.g.
//   'remaining_cash') are NOT used as markers; Health recommendations are
//   identified by their own domain/id/actionKey instead.
// - Source objects and stored summaries are never mutated or deleted.
// ---------------------------------------------------------------------------

const PROHIBITED_DOMAINS = new Set(['goal', 'goals', 'health'])

const PROHIBITED_RECOMMENDATION_IDS = new Set([
  RECOMMENDATION_RULE_IDS.goalNoContributions,
  RECOMMENDATION_RULE_IDS.healthLowStatus,
])

const PROHIBITED_ACTION_KEYS = new Set([
  RECOMMENDATION_ACTION_KEYS.reviewGoalContributions,
  RECOMMENDATION_ACTION_KEYS.reviewFinancialHealth,
])

// Goal rule ids do not collide with any authorized domain rule id.
const PROHIBITED_SOURCE_RULE_IDS = new Set([
  ...Object.values(GOAL_RULE_IDS),
  HEALTH_RULE_IDS.goalContributionParticipation,
])

// Legacy Phase 14+/16+ summary paragraph keys and template ids.
const PROHIBITED_PARAGRAPH_KEYS = new Set([
  'position_goals',
  'position_health',
  'risk_goals_no_contributions',
  'risk_health_status',
  'positive_goals_completed',
  'positive_health_status',
])

const PROHIBITED_TEMPLATE_IDS = new Set([
  'position.goals',
  'position.health',
  'risk.goal.noContributions',
  'risk.health',
  'positive.goalsCompleted',
  'positive.health',
].map((id) => id.toLowerCase()))

const PROHIBITED_EVIDENCE_SOURCE_PREFIXES = [
  'goals.',
  'health.',
  'goal.',
  'goals/',
  'goal/',
  'health/',
]

const MAX_EVIDENCE_TRAVERSAL_DEPTH = 10
const MAX_EVIDENCE_TRAVERSAL_NODES = 1024

function normalizeIdentifier(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function isProhibitedEvidence(evidence) {
  const seen = new Set()
  let visited = 0

  function inspect(node, depth) {
    // Count primitives and array elements too, so wide structures have a bound.
    visited += 1
    if (visited > MAX_EVIDENCE_TRAVERSAL_NODES || depth > MAX_EVIDENCE_TRAVERSAL_DEPTH) {
      return true
    }
    if (!node || typeof node !== 'object') return false
    if (seen.has(node)) return true

    seen.add(node)
    try {
      if (Array.isArray(node)) {
        for (const item of node) {
          if (inspect(item, depth + 1)) return true
        }
        return false
      }

      const source = normalizeIdentifier(node.source)
      if (
        PROHIBITED_DOMAINS.has(source) ||
        PROHIBITED_EVIDENCE_SOURCE_PREFIXES.some((prefix) => source.startsWith(prefix))
      ) return true

      const ruleId = normalizeIdentifier(node.ruleId)
      if (PROHIBITED_SOURCE_RULE_IDS.has(ruleId) || PROHIBITED_RECOMMENDATION_IDS.has(ruleId)) {
        return true
      }
      if (
        asArray(node.sourceRuleIds).some((id) =>
          PROHIBITED_SOURCE_RULE_IDS.has(normalizeIdentifier(id)),
        ) ||
        PROHIBITED_DOMAINS.has(normalizeIdentifier(node.domain)) ||
        PROHIBITED_ACTION_KEYS.has(normalizeIdentifier(node.actionKey))
      ) return true

      for (const key in node) {
        if (Object.hasOwn(node, key) && inspect(node[key], depth + 1)) return true
      }
      return false
    } catch {
      // Only structural evidence inspection is caught; an unreadable item is excluded.
      return true
    } finally {
      seen.delete(node)
    }
  }

  return inspect(evidence, 0)
}

function isProhibitedRecommendation(r) {
  if (!r || typeof r !== 'object') return true
  try {
    if (PROHIBITED_DOMAINS.has(normalizeIdentifier(r.domain))) return true
    if (PROHIBITED_RECOMMENDATION_IDS.has(normalizeIdentifier(r.id))) return true
    if (PROHIBITED_ACTION_KEYS.has(normalizeIdentifier(r.actionKey))) return true
    if (asArray(r.sourceRuleIds).some((id) =>
      PROHIBITED_SOURCE_RULE_IDS.has(normalizeIdentifier(id)),
    )) return true
    return isProhibitedEvidence(r.evidence)
  } catch {
    return true
  }
}

function collectExcludedRecommendationIds(recommendationBundle) {
  const excluded = new Set(PROHIBITED_RECOMMENDATION_IDS)
  for (const r of asArray(recommendationBundle?.recommendations)) {
    if (r && typeof r === 'object' && isProhibitedRecommendation(r)) {
      try {
        const id = normalizeIdentifier(r.id)
        if (id) excluded.add(id)
      } catch {
        // An unreadable id cannot be referenced reliably by a summary.
      }
    }
  }
  return excluded
}

function isProhibitedParagraph(p, excludedRecommendationIds) {
  if (!p || typeof p !== 'object') return true
  try {
    const key = normalizeIdentifier(p.key)
    if (PROHIBITED_PARAGRAPH_KEYS.has(key)) return true
    if (PROHIBITED_TEMPLATE_IDS.has(normalizeIdentifier(p.templateId))) return true
    if (asArray(p.relatedInsights).some((d) =>
      PROHIBITED_DOMAINS.has(normalizeIdentifier(d)),
    )) return true
    if (asArray(p.relatedRecommendations).some((id) =>
      excludedRecommendationIds.has(normalizeIdentifier(id)),
    )) return true
    if (key.startsWith('action_') && excludedRecommendationIds.has(key.slice(7))) {
      return true
    }
    return isProhibitedEvidence(p.evidence)
  } catch {
    return true
  }
}

function getDomainProp(domain, prop) {
  if (!domain || typeof domain !== 'object') return undefined
  if (domain.metrics && domain.metrics[prop] !== undefined) {
    return domain.metrics[prop]
  }
  return domain[prop]
}

function selectHealth() {
  return null
}

function selectIncome(income) {
  if (!income || typeof income !== 'object') return null
  return {
    totalIncome: getDomainProp(income, 'totalIncome'),
    incomeCount: getDomainProp(income, 'incomeCount'),
    averageIncome: getDomainProp(income, 'averageIncome'),
    trend: getDomainProp(income, 'trend'),
    previousCutoffComparison: getDomainProp(income, 'previousCutoffComparison'),
    missingIncome: getDomainProp(income, 'missingIncome'),
    stability: getDomainProp(income, 'stability'),
  }
}

function selectExpenses(expenses) {
  if (!expenses || typeof expenses !== 'object') return null
  return {
    totalExpenses: getDomainProp(expenses, 'totalExpenses'),
    expenseCount: getDomainProp(expenses, 'expenseCount'),
    dailySpendingRate: getDomainProp(expenses, 'dailySpendingRate'),
    currentPeriodDays: getDomainProp(expenses, 'currentPeriodDays'),
    topSpendingCategory: getDomainProp(expenses, 'topSpendingCategory'),
    trend: getDomainProp(expenses, 'trend'),
    increase: getDomainProp(expenses, 'increase'),
    decrease: getDomainProp(expenses, 'decrease'),
  }
}

function selectSavings(savings) {
  if (!savings || typeof savings !== 'object') return null
  return {
    totalSavings: getDomainProp(savings, 'totalSavings'),
    savingsCount: getDomainProp(savings, 'savingsCount'),
    averageContribution: getDomainProp(savings, 'averageContribution'),
    savingsRate: getDomainProp(savings, 'savingsRate'),
    trend: getDomainProp(savings, 'trend'),
    previousCutoffComparison: getDomainProp(savings, 'previousCutoffComparison'),
    contributionFrequency: getDomainProp(savings, 'contributionFrequency'),
    consistency: getDomainProp(savings, 'consistency'),
  }
}

function selectGoals() {
  return null
}

function selectCashflow(cashflow) {
  if (!cashflow || typeof cashflow !== 'object') return null
  return {
    remainingCash: getDomainProp(cashflow, 'remainingCash'),
    netCashflow: getDomainProp(cashflow, 'netCashflow'),
    position: getDomainProp(cashflow, 'position'),
    spendingPace: getDomainProp(cashflow, 'spendingPace'),
    incomeCoverage: getDomainProp(cashflow, 'incomeCoverage'),
    savingsCoverage: getDomainProp(cashflow, 'savingsCoverage'),
    stability: getDomainProp(cashflow, 'stability'),
  }
}

function selectCutoff(cutoff) {
  if (!cutoff || typeof cutoff !== 'object') return null
  return {
    currentCutoff: getDomainProp(cutoff, 'currentCutoff'),
    previousCutoffComparison: getDomainProp(cutoff, 'previousCutoffComparison'),
    averageComparison: getDomainProp(cutoff, 'averageComparison'),
    trend: getDomainProp(cutoff, 'trend'),
  }
}

function selectRecommendations(recommendationBundle) {
  if (
    !recommendationBundle ||
    !Array.isArray(recommendationBundle.recommendations)
  ) {
    return []
  }

  return recommendationBundle.recommendations
    .filter((r) => !isProhibitedRecommendation(r))
    .map((r) => ({
    id: r.id,
    domain: r.domain,
    actionKey: r.actionKey,
    title: r.title,
    explanation: r.explanation,
    severity: r.severity,
    priority: r.priority,
    rank: r.rank,
    evidence: Array.isArray(r.evidence) ? [...r.evidence] : r.evidence ?? [],
    sourceRuleIds: Array.isArray(r.sourceRuleIds)
      ? [...r.sourceRuleIds]
      : r.sourceRuleIds ?? [],
  }))
}

function selectFinancialSummary(financialSummary, excludedRecommendationIds) {
  if (!financialSummary || typeof financialSummary !== 'object') {
    return {}
  }

  const meta = financialSummary.metadata
  const metadata =
    meta && typeof meta === 'object'
      ? {
          summaryId: meta.summaryId ?? '',
          summaryType: meta.summaryType ?? '',
          engineVersion: meta.engineVersion ?? '',
          narrativeVersion: meta.narrativeVersion ?? '',
          templateVersion: meta.templateVersion ?? '',
          language: meta.language ?? 'en',
        }
      : {
          summaryId: '',
          summaryType: '',
          engineVersion: '',
          narrativeVersion: '',
          templateVersion: '',
          language: 'en',
        }

  const state =
    financialSummary.state ?? financialSummary.diagnostics?.state ?? null

  const sections = Array.isArray(financialSummary.sections)
    ? financialSummary.sections.map((section) => ({
        type: section?.type ?? '',
        title: section?.title ?? '',
        paragraphs: Array.isArray(section?.paragraphs)
          ? section.paragraphs
              .filter((p) => !isProhibitedParagraph(p, excludedRecommendationIds))
              .map((p) => ({
              key: p?.key ?? '',
              text: p?.text ?? '',
              horizon: p?.horizon ?? '',
              relatedInsights: Array.isArray(p?.relatedInsights)
                ? [...p.relatedInsights]
                : [],
              relatedRecommendations: Array.isArray(p?.relatedRecommendations)
                ? [...p.relatedRecommendations]
                : [],
            }))
          : [],
      }))
    : []

  return {
    version: financialSummary.version ?? '',
    scope: financialSummary.scope ?? '',
    generatedAt: financialSummary.generatedAt ?? null,
    metadata,
    state,
    sections,
  }
}

export function selectPromptContext({
  conversationContext = null,
  memoryContext = null,
  financialSummary,
  insightBundle,
  recommendationBundle,
} = {}) {
  const scope =
    financialSummary?.scope ||
    insightBundle?.scope ||
    recommendationBundle?.scope ||
    ''

  const sourceTimestamps = {
    insights: insightBundle?.generatedAt ?? null,
    recommendations: recommendationBundle?.generatedAt ?? null,
    summary: financialSummary?.generatedAt ?? null,
  }

  const insights = {
    health: selectHealth(insightBundle?.health),
    income: selectIncome(insightBundle?.income),
    expenses: selectExpenses(insightBundle?.expenses),
    savings: selectSavings(insightBundle?.savings),
    goals: selectGoals(insightBundle?.goals),
    cashflow: selectCashflow(insightBundle?.cashflow),
    cutoff: selectCutoff(insightBundle?.cutoff),
  }

  const recommendations = selectRecommendations(recommendationBundle)
  const selectedFinancialSummary = selectFinancialSummary(
    financialSummary,
    collectExcludedRecommendationIds(recommendationBundle),
  )

  let selectedConversationContext = null
  if (conversationContext && typeof conversationContext === 'object') {
    selectedConversationContext = {
      version: conversationContext.version ?? '1.0.0',
      topic: {
        current: conversationContext.topic?.current ?? 'general',
      },
      clarification: {
        required: Boolean(conversationContext.clarification?.required),
        reason: conversationContext.clarification?.reason ?? null,
        missingFields: Array.isArray(
          conversationContext.clarification?.missingFields,
        )
          ? [...conversationContext.clarification.missingFields]
          : [],
      },
      recentMessages: Array.isArray(conversationContext.recentMessages)
        ? conversationContext.recentMessages.map((m) => ({
            role: m?.role ?? '',
            content: m?.content ?? '',
          }))
        : [],
    }
  }

  let selectedMemoryContext = null
  if (memoryContext && typeof memoryContext === 'object') {
    selectedMemoryContext = {
      version: memoryContext.version ?? '1.0.0',
      items: Array.isArray(memoryContext.items)
        ? memoryContext.items.map((item) => ({
            type: item?.type ?? '',
            content: item?.content ?? '',
          }))
        : [],
    }
  }

  return {
    version: CONTEXT_VERSION,
    scope,
    sourceTimestamps,
    financialSummary: selectedFinancialSummary,
    recommendations,
    insights,
    conversationContext: selectedConversationContext,
    memoryContext: selectedMemoryContext,
  }
}

