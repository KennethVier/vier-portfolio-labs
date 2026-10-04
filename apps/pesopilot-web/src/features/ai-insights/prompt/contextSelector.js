export const CONTEXT_VERSION = '1.0.0'

function getDomainProp(domain, prop) {
  if (!domain || typeof domain !== 'object') return undefined
  if (domain.metrics && domain.metrics[prop] !== undefined) {
    return domain.metrics[prop]
  }
  return domain[prop]
}

function selectHealth(health) {
  if (!health || typeof health !== 'object') return null
  return {
    score: getDomainProp(health, 'score'),
    status: getDomainProp(health, 'status'),
  }
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

function selectGoals(goals) {
  if (!goals || typeof goals !== 'object') return null
  return {
    totalGoals: getDomainProp(goals, 'totalGoals'),
    activeGoals: getDomainProp(goals, 'activeGoals'),
    completedGoals: getDomainProp(goals, 'completedGoals'),
    totalTargetAmount: getDomainProp(goals, 'totalTargetAmount'),
    totalSavedAmount: getDomainProp(goals, 'totalSavedAmount'),
    overallCompletionRate: getDomainProp(goals, 'overallCompletionRate'),
  }
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

  return recommendationBundle.recommendations.map((r) => ({
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

function selectFinancialSummary(financialSummary) {
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
          ? section.paragraphs.map((p) => ({
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
  const selectedFinancialSummary = selectFinancialSummary(financialSummary)

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

