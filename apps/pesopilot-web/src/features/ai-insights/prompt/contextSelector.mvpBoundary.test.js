import { describe, expect, it } from 'vitest'
import { buildPromptPackage } from './promptBuilder.js'
import { selectPromptContext } from './contextSelector.js'
import { guardrailEngine } from '../guardrails/guardrailEngine.js'

// Codex audit FIX 1: legacy Goal (Phase 14+) / Health (Phase 16+) content
// embedded in historical RecommendationBundles and FinancialSummaries must not
// reach the AI prompt. Filtering is provenance-based, not text-based.

const GOAL_MARKER = 'LEGACY_GOAL_MARKER_7f3a'
const HEALTH_MARKER = 'LEGACY_HEALTH_MARKER_9c1b'

function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj)
    for (const value of Object.values(obj)) deepFreeze(value)
  }
  return obj
}

function makeInsightBundle() {
  return {
    generatedAt: '2026-10-15T00:00:00.000Z',
    scope: 'current_cutoff',
    cashflow: { metrics: { remainingCash: 12000, netCashflow: 12000, position: 'Positive' } },
    income: { metrics: { totalIncome: 30000, incomeCount: 2 } },
    expenses: { metrics: { totalExpenses: 15000, expenseCount: 40 } },
    savings: { metrics: { totalSavings: 3000, savingsCount: 2 } },
    cutoff: { metrics: { currentCutoff: '2026-10-15' } },
    goals: { metrics: { activeGoals: 2, overallCompletionRate: 40 } },
    health: { score: 42, status: 'Needs Attention' },
  }
}

function makeRecommendationBundle() {
  return {
    generatedAt: '2026-10-15T00:00:00.000Z',
    scope: 'current_cutoff',
    recommendations: [
      {
        id: 'cashflow_fast_spending_pace',
        domain: 'cashflow',
        actionKey: 'review_spending_pace',
        title: 'Fast Spending Pace',
        explanation: 'Spending pace is fast. Keep your savings goal of discipline in mind.',
        severity: 'warning',
        priority: 'high',
        rank: 1,
        evidence: [{ label: 'Pace', value: 'Fast', ruleId: 'spending_pace' }],
        sourceRuleIds: ['spending_pace'],
      },
      {
        id: 'health_low_status',
        domain: 'health',
        actionKey: 'review_financial_health',
        title: `Financial Health Attention Required ${HEALTH_MARKER}`,
        explanation: `Financial health score is 42. ${HEALTH_MARKER}`,
        severity: 'warning',
        priority: 'high',
        rank: 2,
        evidence: [{ label: 'Remaining Cash', value: 1, ruleId: 'remaining_cash' }],
        sourceRuleIds: ['remaining_cash'],
      },
      {
        id: 'expense_rising_spending',
        domain: 'expense',
        actionKey: 'review_expenses',
        title: 'Increasing Expense Trend',
        explanation: 'Expenses trending upward by 12%.',
        severity: 'warning',
        priority: 'medium',
        rank: 3,
        evidence: [{ label: 'Trend', value: 12, ruleId: 'expense_trend' }],
        sourceRuleIds: ['expense_trend'],
      },
      {
        id: 'goal_no_contributions',
        domain: 'goal',
        actionKey: 'review_goal_contributions',
        title: `Goals Without Contributions ${GOAL_MARKER}`,
        explanation: `2 savings goals have no contributions. ${GOAL_MARKER}`,
        severity: 'info',
        priority: 'low',
        rank: 4,
        evidence: [{ label: 'Goals', value: 2, ruleId: 'goals_without_contributions' }],
        sourceRuleIds: ['goals_without_contributions'],
      },
      {
        // Disguised as savings, but goal-linked via source rule reference.
        id: 'legacy_disguised_rec',
        domain: 'savings',
        actionKey: 'review_savings_allocation',
        title: `Disguised Goal Rec ${GOAL_MARKER}`,
        explanation: `Goal progress lagging. ${GOAL_MARKER}`,
        severity: 'info',
        priority: 'low',
        rank: 5,
        evidence: [{ label: 'Progress', value: 10, ruleId: 'savings_rate' }],
        sourceRuleIds: ['savings_rate', 'goal_progress'],
      },
      {
        // Goal-linked only through evidence ruleId.
        id: 'legacy_evidence_rec',
        domain: 'savings',
        actionKey: 'review_savings_allocation',
        title: `Evidence Goal Rec ${GOAL_MARKER}`,
        explanation: `Remaining goal amount. ${GOAL_MARKER}`,
        severity: 'info',
        priority: 'low',
        rank: 6,
        evidence: [{ label: 'Remaining', value: 5000, ruleId: 'remaining_amount' }],
        sourceRuleIds: ['savings_rate'],
      },
      {
        id: 'income_missing_income',
        domain: 'income',
        actionKey: 'review_income_records',
        title: 'Missing Expected Income',
        explanation: 'Expected income missing.',
        severity: 'critical',
        priority: 'high',
        rank: 7,
        evidence: [{ label: 'Missing', value: true, ruleId: 'missing_income_detection' }],
        sourceRuleIds: ['missing_income_detection'],
      },
      {
        id: 'savings_low_rate',
        domain: 'savings',
        actionKey: 'review_savings_allocation',
        title: 'Low Savings Rate',
        explanation: 'Savings rate is below the configured healthy range at 5%.',
        severity: 'warning',
        priority: 'medium',
        rank: 8,
        evidence: [{ label: 'Rate', value: 5, ruleId: 'savings_rate' }],
        sourceRuleIds: ['savings_rate'],
      },
      {
        id: 'cutoff_expenses_up',
        domain: 'cutoff',
        actionKey: 'review_expenses',
        title: 'Cutoff Expenses Higher Than Previous',
        explanation: 'Expenses increased by 10%.',
        severity: 'warning',
        priority: 'medium',
        rank: 9,
        evidence: [{ label: 'Change', value: 10, ruleId: 'expense_comparison' }],
        sourceRuleIds: ['expense_comparison'],
      },
    ],
  }
}

function para(overrides) {
  return {
    key: '',
    templateId: '',
    text: '',
    horizon: 'current',
    variables: {},
    evidence: [],
    relatedInsights: [],
    relatedRecommendations: [],
    ...overrides,
  }
}

function makeFinancialSummary() {
  return {
    version: '1.0.0',
    scope: 'current_cutoff',
    generatedAt: '2026-10-15T00:00:00.000Z',
    metadata: { summaryId: 's1', summaryType: 'cutoff', language: 'en' },
    sections: [
      {
        type: 'executive',
        title: 'Executive Summary',
        paragraphs: [
          // Mixed provenance: exec paragraph built around a Health top action.
          para({
            key: 'executive_summary',
            templateId: 'exec.attention.action',
            text: `Your top priority is to Financial Health Attention Required ${HEALTH_MARKER}.`,
            relatedInsights: ['cashflow'],
            relatedRecommendations: ['health_low_status'],
          }),
        ],
      },
      {
        type: 'currentPosition',
        title: 'Current Position',
        paragraphs: [
          para({
            key: 'position_cash',
            templateId: 'position.cash.positive',
            text: 'You currently have ₱12,000.00 remaining before your next payday.',
            relatedInsights: ['cashflow'],
          }),
          para({
            key: 'position_health',
            templateId: 'position.health',
            text: `Overall financial health is Needs Attention with a score of 42. ${HEALTH_MARKER}`,
            relatedInsights: ['health'],
            evidence: [{ label: 'Health Score', source: 'health.score', value: 42 }],
          }),
          para({
            key: 'position_income',
            templateId: 'position.income',
            text: 'Total recorded income for this period is ₱30,000.00.',
            relatedInsights: ['income'],
          }),
          para({
            key: 'position_goals',
            templateId: 'position.goals',
            text: `Overall goal completion rate is 40% across 2 active goals. ${GOAL_MARKER}`,
            relatedInsights: ['goal'],
          }),
          para({
            key: 'position_expenses',
            templateId: 'position.expenses',
            text: 'Total expenses for this period stand at ₱15,000.00.',
            relatedInsights: ['expense'],
          }),
          para({
            key: 'position_savings_rate',
            templateId: 'position.savingsRate',
            text: 'You saved 10% of your income this cutoff.',
            relatedInsights: ['savings'],
          }),
        ],
      },
      {
        type: 'risks',
        title: 'Risks',
        paragraphs: [
          para({
            key: 'risk_goals_no_contributions',
            templateId: 'risk.goal.noContributions',
            text: `2 active goals received no contributions. ${GOAL_MARKER}`,
            relatedInsights: ['goal'],
          }),
          para({
            key: 'risk_spending_pace_fast',
            templateId: 'risk.pace.fast',
            text: 'Your spending pace is faster than elapsed cycle time.',
            relatedInsights: ['cashflow'],
          }),
          para({
            // Unknown key/template, but evidence sourced from goals.*
            key: 'risk_legacy_custom',
            templateId: 'risk.custom',
            text: `Legacy evidence-only goal paragraph ${GOAL_MARKER}`,
            relatedInsights: ['savings'],
            evidence: [{ label: 'Goals', source: 'goals.metrics.activeGoals', value: 2 }],
          }),
        ],
      },
      {
        type: 'positiveObservations',
        title: 'Positive Observations',
        paragraphs: [
          para({
            key: 'positive_health_status',
            templateId: 'positive.health',
            text: `Financial health score remains in the Healthy range. ${HEALTH_MARKER}`,
            relatedInsights: ['health'],
          }),
          para({
            key: 'positive_goals_completed',
            templateId: 'positive.goalsCompleted',
            text: `You have completed 1 financial goals. ${GOAL_MARKER}`,
            relatedInsights: ['goal'],
          }),
          para({
            key: 'positive_income_stability',
            templateId: 'positive.incomeStability',
            text: 'Income records demonstrate consistent and stable earnings.',
            relatedInsights: ['income'],
          }),
        ],
      },
      {
        type: 'priorityActions',
        title: 'Priority Actions',
        paragraphs: [
          para({
            key: 'action_cashflow_fast_spending_pace',
            templateId: 'action.default',
            text: 'Fast Spending Pace. Spending pace is fast.',
            relatedInsights: ['cashflow'],
            relatedRecommendations: ['cashflow_fast_spending_pace'],
          }),
          para({
            // Disguised domain; linked to an excluded recommendation id.
            key: 'action_legacy_disguised_rec',
            templateId: 'action.default',
            text: `Disguised Goal Rec. ${GOAL_MARKER}`,
            relatedInsights: ['savings'],
            relatedRecommendations: ['legacy_disguised_rec'],
          }),
          para({
            key: 'action_goal_no_contributions',
            templateId: 'action.default',
            text: `Goals Without Contributions. ${GOAL_MARKER}`,
            relatedInsights: ['savings'],
            relatedRecommendations: [],
          }),
          para({
            key: 'action_income_missing_income',
            templateId: 'action.default',
            text: 'Missing Expected Income. Expected income missing.',
            relatedInsights: ['income'],
            relatedRecommendations: ['income_missing_income'],
          }),
        ],
      },
      {
        type: 'closing',
        title: 'Closing',
        paragraphs: [
          para({
            key: 'closing_summary',
            templateId: 'closing.attention',
            text: 'Overall, prompt attention to spending control will help restore financial stability.',
            relatedInsights: ['cashflow'],
          }),
        ],
      },
    ],
  }
}

function paragraphKeys(context) {
  return context.financialSummary.sections.flatMap((s) => s.paragraphs.map((p) => p.key))
}

describe('MVP AI context boundary — legacy Goal/Health filtering (Codex FIX 1)', () => {
  it('excludes a legacy health recommendation', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    const ids = ctx.recommendations.map((r) => r.id)
    expect(ids).not.toContain('health_low_status')
    expect(ctx.recommendations.some((r) => r.domain === 'health')).toBe(false)
  })

  it('excludes a legacy goal recommendation', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    expect(ctx.recommendations.map((r) => r.id)).not.toContain('goal_no_contributions')
    expect(ctx.recommendations.some((r) => r.domain === 'goal')).toBe(false)
  })

  it('excludes legacy position_health and other Phase 14+/16+ summary paragraphs', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    const keys = paragraphKeys(ctx)
    for (const legacy of [
      'position_health',
      'position_goals',
      'risk_goals_no_contributions',
      'positive_health_status',
      'positive_goals_completed',
      'risk_legacy_custom',
      'action_goal_no_contributions',
    ]) {
      expect(keys).not.toContain(legacy)
    }
  })

  it('excludes mixed-provenance executive paragraph tied to an excluded recommendation', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    const executive = ctx.financialSummary.sections.find((s) => s.type === 'executive')
    expect(executive).toBeDefined()
    expect(executive.paragraphs).toEqual([])
  })

  it('goal-linked source rule / evidence references cannot bypass filtering', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    const ids = ctx.recommendations.map((r) => r.id)
    expect(ids).not.toContain('legacy_disguised_rec')
    expect(ids).not.toContain('legacy_evidence_rec')
    expect(paragraphKeys(ctx)).not.toContain('action_legacy_disguised_rec')
  })

  it('preserves valid income/expense/savings/cashflow/cutoff recommendations in original order', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    expect(ctx.recommendations.map((r) => r.id)).toEqual([
      'cashflow_fast_spending_pace',
      'expense_rising_spending',
      'income_missing_income',
      'savings_low_rate',
      'cutoff_expenses_up',
    ])
    // Original ranks are preserved, not renumbered.
    expect(ctx.recommendations.map((r) => r.rank)).toEqual([1, 3, 7, 8, 9])
    // Ordinary wording ("goal", "healthy") does not trigger exclusion.
    expect(ctx.recommendations[0].explanation).toContain('savings goal')
    expect(ctx.recommendations[3].explanation).toContain('healthy range')
  })

  it('preserves valid FinancialSummary paragraphs and section order', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    expect(ctx.financialSummary.sections.map((s) => s.type)).toEqual([
      'executive',
      'currentPosition',
      'risks',
      'positiveObservations',
      'priorityActions',
      'closing',
    ])
    expect(paragraphKeys(ctx)).toEqual([
      'position_cash',
      'position_income',
      'position_expenses',
      'position_savings_rate',
      'risk_spending_pace_fast',
      'positive_income_stability',
      'action_cashflow_fast_spending_pace',
      'action_income_missing_income',
      'closing_summary',
    ])
    const para0 = ctx.financialSummary.sections[1].paragraphs[0]
    expect(Object.keys(para0).sort()).toEqual(
      ['horizon', 'key', 'relatedInsights', 'relatedRecommendations', 'text'].sort(),
    )
  })

  it('filters legacy summary paragraphs even without a matching recommendation bundle entry', () => {
    const ctx = selectPromptContext({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: { recommendations: [] },
    })
    const keys = paragraphKeys(ctx)
    expect(keys).not.toContain('position_health')
    expect(keys).not.toContain('action_goal_no_contributions')
    // executive paragraph references the legacy health_low_status id
    expect(keys).not.toContain('executive_summary')
  })

  it('fails safely for empty and malformed legacy inputs', () => {
    expect(() => selectPromptContext()).not.toThrow()
    const empty = selectPromptContext({})
    expect(empty.recommendations).toEqual([])
    expect(empty.financialSummary).toEqual({})

    const malformed = selectPromptContext({
      financialSummary: {
        sections: [
          null,
          { type: 'risks', paragraphs: [null, 'oops', { key: 'position_health' }] },
          { type: 'currentPosition', paragraphs: 'not-an-array' },
          {
            type: 'highlights',
            paragraphs: [{ key: 'ok', text: 'fine', relatedInsights: 'bad', evidence: 'bad' }],
          },
        ],
      },
      insightBundle: {},
      recommendationBundle: {
        recommendations: [
          null,
          'string',
          { id: 'x', domain: 'cashflow', sourceRuleIds: 'not-array', evidence: null },
          { id: 'y', domain: 'income', sourceRuleIds: ['goal_completion'] },
        ],
      },
    })
    expect(malformed.recommendations.map((r) => r.id)).toEqual(['x'])
    expect(malformed.financialSummary.sections[1].paragraphs).toEqual([])
    expect(malformed.financialSummary.sections[2].paragraphs).toEqual([])
    expect(malformed.financialSummary.sections[3].paragraphs.map((p) => p.key)).toEqual(['ok'])

    expect(
      selectPromptContext({ recommendationBundle: { recommendations: 'nope' } }).recommendations,
    ).toEqual([])
  })

  it('does not mutate source inputs', () => {
    const summary = deepFreeze(makeFinancialSummary())
    const insights = deepFreeze(makeInsightBundle())
    const recs = deepFreeze(makeRecommendationBundle())
    const snapshot = JSON.stringify({ summary, insights, recs })

    expect(() =>
      selectPromptContext({
        financialSummary: summary,
        insightBundle: insights,
        recommendationBundle: recs,
      }),
    ).not.toThrow()
    expect(JSON.stringify({ summary, insights, recs })).toBe(snapshot)
    expect(recs.recommendations).toHaveLength(9)
  })

  it('final composed Prompt Builder output contains no prohibited content and passes guardrails', () => {
    const pkg = buildPromptPackage({
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })

    const fullPrompt = `${pkg.systemPrompt}\n${pkg.userPrompt}`
    expect(fullPrompt).not.toContain(GOAL_MARKER)
    expect(fullPrompt).not.toContain(HEALTH_MARKER)
    expect(fullPrompt).not.toContain('goal_no_contributions')
    expect(fullPrompt).not.toContain('health_low_status')
    expect(fullPrompt).not.toContain('position_health')
    expect(fullPrompt).not.toContain('goals_without_contributions')

    // Authorized evidence still reaches the prompt.
    expect(fullPrompt).toContain('cashflow_fast_spending_pace')
    expect(fullPrompt).toContain('income_missing_income')
    expect(fullPrompt).toContain('position_cash')
    expect(fullPrompt).toContain('"remainingCash": 12000')

    expect(pkg.context.insights.health).toBeNull()
    expect(pkg.context.insights.goals).toBeNull()

    const decision = guardrailEngine.validatePrompt(pkg)
    expect(decision.decision).not.toBe('reject')
  })

  it('preserves user-authored conversation text (not filtered)', () => {
    const pkg = buildPromptPackage({
      conversationContext: {
        version: '1.0.0',
        topic: { current: 'general' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [{ role: 'user', content: 'I want to save for my goal of a new laptop.' }],
      },
      financialSummary: makeFinancialSummary(),
      insightBundle: makeInsightBundle(),
      recommendationBundle: makeRecommendationBundle(),
    })
    expect(pkg.userPrompt).toContain('I want to save for my goal of a new laptop.')
  })

  describe('Codex Finding 1 — Nested prohibited evidence filtering in AI context', () => {
    const NESTED_MARKER = 'LEGACY_GOAL_NESTED_90210'

    it('excludes recommendation with exact Codex nested reproduction (value.source)', () => {
      const recBundle = {
        generatedAt: '2026-10-15T00:00:00.000Z',
        scope: 'current_cutoff',
        recommendations: [
          {
            id: 'savings_leaking_nested',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Savings with nested goal evidence',
            explanation: 'Looks like a regular savings recommendation.',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [
              {
                value: {
                  source: 'goals.metrics.activeGoals',
                  text: NESTED_MARKER,
                },
              },
            ],
            sourceRuleIds: ['savings_rate'],
          },
          {
            id: 'savings_authorized_clean',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Authorized savings recommendation',
            explanation: 'Regular healthy savings recommendation with ordinary words.',
            severity: 'info',
            priority: 'low',
            rank: 2,
            evidence: [{ label: 'Savings Rate', value: 20, ruleId: 'savings_rate' }],
            sourceRuleIds: ['savings_rate'],
          },
        ],
      }

      const promptPackage = buildPromptPackage({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })

      // Exact Codex requirement
      expect(JSON.stringify(promptPackage)).not.toContain(NESTED_MARKER)
      expect(promptPackage.userPrompt).not.toContain(NESTED_MARKER)
      expect(promptPackage.systemPrompt).not.toContain(NESTED_MARKER)

      // Leaking recommendation excluded, clean authorized savings preserved
      const recIds = promptPackage.context.recommendations.map((r) => r.id)
      expect(recIds).not.toContain('savings_leaking_nested')
      expect(recIds).toContain('savings_authorized_clean')
    })

    it('excludes recommendation with direct prohibited evidence.source', () => {
      const recBundle = {
        recommendations: [
          {
            id: 'rec_direct_source',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Direct source',
            explanation: 'Test direct source',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [{ source: 'goals.metrics.activeGoals', value: 3 }],
          },
        ],
      }
      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('excludes recommendation with nested prohibited ruleId in object hierarchy', () => {
      const recBundle = {
        recommendations: [
          {
            id: 'rec_nested_rule',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Nested rule ID',
            explanation: 'Goal progress nested in meta',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [
              {
                meta: {
                  diagnostics: {
                    ruleId: 'goal_progress',
                  },
                },
              },
            ],
          },
        ],
      }
      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('excludes recommendation with nested arrays of evidence', () => {
      const recBundle = {
        recommendations: [
          {
            id: 'rec_nested_array',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Nested array',
            explanation: 'Array within array evidence',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [
              [
                {
                  items: [
                    {
                      source: 'health.metrics.score',
                      value: 50,
                    },
                  ],
                },
              ],
            ],
          },
        ],
      }
      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('excludes recommendation with mixed permitted and prohibited nested sources', () => {
      const recBundle = {
        recommendations: [
          {
            id: 'rec_mixed',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Mixed evidence',
            explanation: 'Contains both authorized and prohibited sources',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [
              { label: 'Authorized Cash', value: 1000, ruleId: 'remaining_cash' },
              {
                nested: {
                  source: 'goals.completedGoals',
                  value: 1,
                },
              },
            ],
          },
        ],
      }
      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('retains authorized savings evidence and ordinary user-authored words', () => {
      const recBundle = {
        recommendations: [
          {
            id: 'rec_authorized_words',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Healthy Savings Goal Progress',
            explanation: 'You are working toward a healthy savings goal balance.',
            severity: 'info',
            priority: 'medium',
            rank: 1,
            evidence: [
              {
                label: 'User note about savings goal',
                value: 'My goal is healthy emergency savings',
                ruleId: 'savings_rate',
              },
            ],
            sourceRuleIds: ['savings_rate'],
          },
        ],
      }
      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(1)
      expect(ctx.recommendations[0].id).toBe('rec_authorized_words')
      expect(ctx.recommendations[0].title).toBe('Healthy Savings Goal Progress')
      expect(ctx.recommendations[0].evidence[0].value).toBe(
        'My goal is healthy emergency savings',
      )
    })

    it('fails closed when evidence structure exceeds maximum depth without throwing', () => {
      // Build an excessively deep structure (depth > 10)
      let deep = { source: 'savings.rate', value: 20 }
      for (let i = 0; i < 15; i++) {
        deep = { wrapper: deep }
      }

      const recBundle = {
        recommendations: [
          {
            id: 'rec_deep',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Deeply nested',
            explanation: 'Too deep to inspect safely',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [deep],
          },
        ],
      }

      expect(() =>
        selectPromptContext({
          financialSummary: makeFinancialSummary(),
          insightBundle: makeInsightBundle(),
          recommendationBundle: recBundle,
        }),
      ).not.toThrow()

      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      // Fails closed by excluding the uninspectable recommendation
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('fails closed on cyclic references without infinite loop or throwing', () => {
      const cyclicNode = { label: 'Self referential' }
      cyclicNode.self = cyclicNode

      const recBundle = {
        recommendations: [
          {
            id: 'rec_cyclic',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Cyclic evidence',
            explanation: 'Contains cyclic structure',
            severity: 'info',
            priority: 'low',
            rank: 1,
            evidence: [cyclicNode],
          },
        ],
      }

      expect(() =>
        selectPromptContext({
          financialSummary: makeFinancialSummary(),
          insightBundle: makeInsightBundle(),
          recommendationBundle: recBundle,
        }),
      ).not.toThrow()

      const ctx = selectPromptContext({
        financialSummary: makeFinancialSummary(),
        insightBundle: makeInsightBundle(),
        recommendationBundle: recBundle,
      })
      expect(ctx.recommendations).toHaveLength(0)
    })

    it('does not mutate source objects during nested recursive inspection', () => {
      const nestedRec = deepFreeze({
        id: 'rec_frozen',
        domain: 'savings',
        actionKey: 'review_savings_allocation',
        title: 'Frozen',
        explanation: 'Frozen nested',
        severity: 'info',
        priority: 'low',
        rank: 1,
        evidence: [
          {
            value: {
              source: 'goals.metrics.activeGoals',
              text: 'NESTED_FROZEN',
            },
          },
        ],
      })
      const recBundle = deepFreeze({
        generatedAt: '2026-10-15T00:00:00.000Z',
        scope: 'current_cutoff',
        recommendations: [nestedRec],
      })

      const snapshot = JSON.stringify(recBundle)
      expect(() =>
        selectPromptContext({
          financialSummary: makeFinancialSummary(),
          insightBundle: makeInsightBundle(),
          recommendationBundle: recBundle,
        }),
      ).not.toThrow()
      expect(JSON.stringify(recBundle)).toBe(snapshot)
    })
  })
})

describe('MVP provenance normalization and bounded inspection', () => {
  function buildWith({ evidence, paragraphs = [], recommendations = [] }) {
    return buildPromptPackage({
      insightBundle: makeInsightBundle(),
      financialSummary: {
        ...makeFinancialSummary(),
        sections: [{ type: 'risks', title: 'Risks', paragraphs }],
      },
      recommendationBundle: {
        recommendations: [
          {
            id: 'authorized_income',
            domain: 'income',
            actionKey: 'review_income_records',
            title: 'Income',
            explanation: 'Review income records.',
            rank: 1,
            evidence: [{ source: 'income.metrics.totalIncome', value: 30000 }],
            sourceRuleIds: ['missing_income_detection'],
          },
          ...(evidence === undefined ? [] : [{
            id: 'candidate_savings',
            domain: 'savings',
            actionKey: 'review_savings_allocation',
            title: 'Savings',
            explanation: 'Review savings.',
            rank: 2,
            evidence,
            sourceRuleIds: ['savings_rate'],
          }]),
          ...recommendations,
        ],
      },
    })
  }

  it('excludes all Goal and Health source case variants from recommendations and summary paragraphs', () => {
    for (const [index, source] of [
      'goals.metrics.activeGoals',
      'Goals.metrics.activeGoals',
      'GOALS.metrics.activeGoals',
      'health.metrics.score',
      'Health.metrics.score',
      'HEALTH.metrics.score',
    ].entries()) {
      for (const placement of ['direct', 'nested']) {
        const marker = `PROHIBITED_CASE_MARKER_${index}_${placement}`
        const evidence = placement === 'direct'
          ? [{ source, text: marker }]
          : [{ value: { source, text: marker } }]
        const pkg = buildWith({
          evidence,
          paragraphs: [para({
            key: 'risk_custom_case',
            templateId: 'risk.custom',
            text: marker,
            evidence,
          })],
        })
        expect(pkg.context.recommendations.map((r) => r.id)).toEqual(['authorized_income'])
        expect(pkg.context.financialSummary.sections[0].paragraphs).toEqual([])
        expect(JSON.stringify(pkg.context)).not.toContain(marker)
        expect(pkg.userPrompt).not.toContain(marker)
        expect(pkg.systemPrompt).not.toContain(marker)
        expect(guardrailEngine.validatePrompt(pkg).decision).not.toBe('reject')
      }
    }
  })

  it('normalizes other structured provenance and excluded recommendation references', () => {
    const recs = [
      { id: 'GOAL_NO_CONTRIBUTIONS' },
      { domain: 'HEALTH' },
      { actionKey: 'REVIEW_FINANCIAL_HEALTH' },
      { sourceRuleIds: ['GOAL_PROGRESS'] },
      { evidence: [{ value: { ruleId: 'GOAL_COMPLETION' } }] },
    ].map((override, index) => ({
      id: `candidate_${index}`,
      domain: 'savings',
      actionKey: 'review_savings_allocation',
      title: 'Legacy',
      explanation: 'Legacy observation.',
      rank: index + 2,
      evidence: [],
      sourceRuleIds: ['savings_rate'],
      ...override,
    }))
    const pkg = buildWith({
      recommendations: recs,
      paragraphs: [
        para({ key: 'POSITION_HEALTH', text: 'KEY_MARKER' }),
        para({ key: 'custom', templateId: 'POSITION.GOALS', text: 'TEMPLATE_MARKER' }),
        para({ key: 'custom', templateId: 'POSITIVE.GOALSCOMPLETED', text: 'CAMEL_TEMPLATE_MARKER' }),
        para({ key: 'custom', relatedInsights: ['HeAlTh'], text: 'INSIGHT_MARKER' }),
        para({
          key: 'custom',
          relatedRecommendations: ['goal_no_contributions'],
          text: 'REFERENCE_MARKER',
        }),
      ],
    })
    expect(pkg.context.recommendations.map((r) => r.id)).toEqual(['authorized_income'])
    expect(pkg.context.financialSummary.sections[0].paragraphs).toEqual([])
    for (const marker of ['KEY_MARKER', 'TEMPLATE_MARKER', 'CAMEL_TEMPLATE_MARKER', 'INSIGHT_MARKER', 'REFERENCE_MARKER']) {
      expect(JSON.stringify(pkg)).not.toContain(marker)
    }
  })

  it('retains authorized evidence within limits and respects source identifier boundaries', () => {
    const evidence = deepFreeze([{
      value: { nested: [{ source: 'goalsExtra.metrics', ruleId: 'savings_rate', value: 20 }] },
    }])
    const pkg = buildWith({ evidence })
    expect(pkg.context.recommendations.map((r) => [r.id, r.rank])).toEqual([
      ['authorized_income', 1],
      ['candidate_savings', 2],
    ])
    expect(pkg.context.recommendations[1].evidence).toEqual(evidence)
    expect(Object.isFrozen(evidence)).toBe(true)
  })

  it('rejects throwing direct and nested getters without aborting PromptPackage construction', () => {
    const throwingSource = {}
    Object.defineProperty(throwingSource, 'source', {
      enumerable: true,
      get() { throw new Error('source getter failed') },
    })
    const throwingNested = {}
    Object.defineProperty(throwingNested, 'child', {
      enumerable: true,
      get() { throw new Error('nested getter failed') },
    })
    for (const evidence of [[throwingSource], [{ value: throwingNested }]]) {
      const pkg = buildWith({
        evidence,
        paragraphs: [para({
          key: 'risk_custom',
          text: 'UNREADABLE_SUMMARY_MARKER',
          evidence,
        })],
      })
      expect(pkg.context.recommendations.map((r) => r.id)).toEqual(['authorized_income'])
      expect(pkg.context.financialSummary.sections[0].paragraphs).toEqual([])
      expect(pkg.userPrompt).not.toContain('UNREADABLE_SUMMARY_MARKER')
    }
  })

  it('rejects oversized evidence arrays in recommendation and summary paths', () => {
    const evidence = Array.from({ length: 1025 }, () => null)
    const pkg = buildWith({
      evidence,
      paragraphs: [para({
        key: 'risk_custom',
        text: 'OVERSIZED_SUMMARY_MARKER',
        evidence,
      })],
    })
    expect(pkg.context.recommendations.map((r) => r.id)).toEqual(['authorized_income'])
    expect(pkg.context.financialSummary.sections[0].paragraphs).toEqual([])
    expect(pkg.userPrompt).not.toContain('OVERSIZED_SUMMARY_MARKER')
  })
})

