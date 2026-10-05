import {
  createMemoryDto,
  createMemoryRecord,
  MEMORY_TYPES,
  MEMORY_IMPORTANCES,
} from '../../memory/memoryService.js'

export function createSyntheticFinancialSummary(overrides = {}) {
  return Object.freeze({
    version: '1.0.0',
    scope: 'monthly',
    generatedAt: '2026-10-05T00:00:00.000Z',
    netSavings: 5000,
    healthScore: 85,
    status: 'healthy',
    monthlyIncome: 50000,
    monthlyExpenses: 45000,
    savingsRate: 10,
    metadata: Object.freeze({
      summaryId: 'sum-synth-1',
      summaryType: 'monthly',
      engineVersion: '1.0.0',
      narrativeVersion: '1.0.0',
      templateVersion: '1.0.0',
      language: 'en',
    }),
    sections: Object.freeze([
      Object.freeze({
        type: 'overview',
        title: 'Monthly Financial Summary',
        paragraphs: Object.freeze([
          Object.freeze({
            key: 'p1',
            text: 'Your net savings of P5,000 indicates a healthy cash position.',
            horizon: 'monthly',
            relatedInsights: Object.freeze(['synth-ins-1']),
            relatedRecommendations: Object.freeze(['synth-rec-1']),
          }),
        ]),
      }),
    ]),
    ...overrides,
  })
}

export function createSyntheticInsightBundle(overrides = {}) {
  return Object.freeze({
    generatedAt: '2026-10-05T00:00:00.000Z',
    health: Object.freeze({ score: 85, status: 'healthy' }),
    income: Object.freeze({ totalIncome: 50000, incomeCount: 2 }),
    expenses: Object.freeze({ totalExpenses: 45000, expenseCount: 15 }),
    savings: Object.freeze({ totalSavings: 5000, savingsRate: 10 }),
    insights: Object.freeze([
      Object.freeze({
        id: 'synth-ins-1',
        type: 'health',
        severity: 'positive',
        title: 'Emergency Buffer On Track',
        message: 'Your current savings reserve covers essential expenses.',
      }),
      Object.freeze({
        id: 'synth-ins-2',
        type: 'expense',
        severity: 'neutral',
        title: 'Discretionary Outflow Stable',
        message: 'Dining and entertainment spending remained within normal boundaries.',
      }),
    ]),
    ...overrides,
  })
}

export function createSyntheticRecommendationBundle(overrides = {}) {
  return Object.freeze({
    recommendations: Object.freeze([
      Object.freeze({
        id: 'synth-rec-1',
        priority: 'high',
        title: 'Maintain Automated Savings',
        description: 'Keep transferring 10% of monthly income to your reserve account.',
      }),
      Object.freeze({
        id: 'synth-rec-2',
        priority: 'medium',
        title: 'Review Variable Utility Expenses',
        description: 'Check electricity and subscription bills for minor potential savings.',
      }),
    ]),
    ...overrides,
  })
}

export function createSyntheticConversationContext(overrides = {}) {
  return Object.freeze({
    version: '1.0.0',
    topic: Object.freeze({ current: 'savings', ...(overrides.topic || {}) }),
    clarification: Object.freeze({
      required: false,
      reason: null,
      missingFields: Object.freeze([]),
      ...(overrides.clarification || {}),
    }),
    recentMessages: Object.freeze(
      (overrides.recentMessages || [
        { role: 'user', content: 'Can you explain my current financial health?' },
        { role: 'assistant', content: 'Your financial position is healthy with P5,000 net savings.' },
      ]).map((m) => Object.freeze({ role: m.role, content: m.content })),
    ),
  })
}

export function createSyntheticMemoryRecordItem(overrides = {}) {
  const memoryId = overrides.memoryId || overrides.id || 'synth-mem-1'
  return createMemoryRecord({
    candidate: {
      type: overrides.type || MEMORY_TYPES.communicationPreference,
      content: overrides.content || 'Prefers concise bullet points in financial explanations.',
      importance: overrides.importance || MEMORY_IMPORTANCES.medium,
      topics: overrides.topics || ['general'],
      workflowTypes: overrides.workflowTypes || ['financial-summary-explanation'],
      source: overrides.source || { type: 'user' },
      explicitlyConfirmed: true,
    },
    memoryId,
    createdAt: overrides.createdAt || '2026-10-05T00:00:00.000Z',
  })
}

export function createSyntheticMemoryState(records = null) {
  const finalRecords = records || [
    createSyntheticMemoryRecordItem(),
    createSyntheticMemoryRecordItem({
      id: 'synth-mem-2',
      type: MEMORY_TYPES.coachingPreference,
      content: 'Focuses on conservative debt elimination before riskier investments.',
      importance: MEMORY_IMPORTANCES.high,
    }),
  ]

  return createMemoryDto({
    userId: 'synth-user-42',
    records: finalRecords,
  })
}

export function createSyntheticWorkflowInput(overrides = {}) {
  return Object.freeze({
    workflowId: overrides.workflowId || undefined,
    templateId: overrides.templateId || 'financial-summary-explanation',
    insightBundle: overrides.insightBundle || createSyntheticInsightBundle(),
    recommendationBundle: overrides.recommendationBundle || createSyntheticRecommendationBundle(),
    financialSummary: overrides.financialSummary || createSyntheticFinancialSummary(),
    provider: Object.freeze({
      id: 'ollama',
      model: 'llama3.2',
      config: Object.freeze({}),
      ...(overrides.provider || {}),
    }),
    conversationContext: overrides.conversationContext !== undefined
      ? overrides.conversationContext
      : createSyntheticConversationContext(),
    memoryState: overrides.memoryState !== undefined
      ? overrides.memoryState
      : null,
  })
}
