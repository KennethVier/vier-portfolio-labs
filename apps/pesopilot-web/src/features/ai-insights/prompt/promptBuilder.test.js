import { describe, expect, it } from 'vitest'
import {
  buildPromptPackage,
  promptBuilder,
} from './promptBuilder.js'
import {
  createPromptPackage,
  PROMPT_PACKAGE_VERSION,
} from './promptPackage.js'
import {
  CONTEXT_VERSION,
  selectPromptContext,
} from './contextSelector.js'
import {
  getPromptTemplate,
  PROMPT_TEMPLATE_IDS,
  PROMPT_TEMPLATES,
} from './templateRegistry.js'
import {
  getSafetyInstructions,
  injectSafetyInstructions,
  SAFETY_POLICY_VERSION,
  SAFETY_RULES,
} from './safetyInjector.js'
import {
  BASE_SYSTEM_ROLE,
  composePrompts,
} from './promptComposer.js'
import { validatePromptPackage } from './promptValidator.js'

describe('Prompt Builder Feature (Phase 11B.1)', () => {
  const sampleInsightBundle = {
    cashflow: {
      breakdown: [{ id: 'cf_breakdown' }],
      diagnostics: { executedRules: ['cf_rule'] },
      metrics: {
        incomeCoverage: { status: 'Covered' },
        netCashflow: 30000,
        position: 'Positive',
        remainingCash: 20000,
        savingsCoverage: { status: 'Covered' },
        spendingPace: { status: 'On Pace' },
        stability: { status: 'Stable' },
      },
    },
    cutoff: {
      breakdown: [{ id: 'co_breakdown' }],
      diagnostics: { executedRules: ['co_rule'] },
      metrics: {
        averageComparison: { difference: 100 },
        bestCutoff: '2026-09-30',
        currentCutoff: '2026-10-15',
        previousCutoffComparison: { difference: 0 },
        trend: { direction: 'Stable' },
        worstCutoff: '2026-08-15',
      },
    },
    expenses: {
      breakdown: [{ id: 'exp_breakdown' }],
      diagnostics: { executedRules: ['exp_rule'] },
      metrics: {
        anomalies: [{ id: 'anom_1' }],
        categoryDistribution: { Food: 50 },
        currentPeriodDays: 15,
        dailySpendingRate: 1333.33,
        decrease: 500,
        expenseCount: 15,
        increase: 0,
        largestExpense: { amount: 5000, merchant: 'Electronics' },
        largestMerchant: { amount: 8000, name: 'Supermarket' },
        topSpendingCategory: 'Food',
        totalExpenses: 20000,
        trend: { direction: 'Decreasing' },
      },
    },
    generatedAt: '2026-10-04T12:00:00.000Z',
    goals: {
      breakdown: [{ id: 'goal_breakdown' }],
      diagnostics: { executedRules: ['goal_rule'] },
      goals: [{ id: 'g1', title: 'Secret Goal Detail' }],
      metrics: {
        activeGoals: 2,
        completedGoals: 1,
        goalsWithoutContributions: [],
        highestFundedGoal: { id: 'g1' },
        overallCompletionRate: 40,
        totalGoals: 3,
        totalSavedAmount: 40000,
        totalTargetAmount: 100000,
      },
    },
    health: {
      breakdown: [{ id: 'health_breakdown' }],
      diagnostics: { executedRules: ['health_rule'] },
      score: 85,
      status: 'Healthy',
    },
    income: {
      breakdown: [{ id: 'inc_breakdown' }],
      diagnostics: { executedRules: ['inc_rule'] },
      evidence: [{ ruleId: 'inc_rule', value: 50000 }],
      metrics: {
        averageIncome: 25000,
        incomeCount: 2,
        missingIncome: { missing: false },
        previousCutoffComparison: { difference: 0 },
        primarySource: { source: 'Tech Corp' },
        sourceBreakdown: [{ amount: 50000, source: 'Tech Corp' }],
        stability: { status: 'Stable' },
        totalIncome: 50000,
        trend: { direction: 'Stable' },
      },
    },
    recommendations: [
      {
        id: 'stale_insight_rec',
        title: 'Should be ignored from insightBundle',
      },
    ],
    savings: {
      breakdown: [{ id: 'sav_breakdown' }],
      diagnostics: { executedRules: ['sav_rule'] },
      metrics: {
        averageContribution: 5000,
        consistency: 'High',
        contributionFrequency: 'biweekly',
        largestSavingsContribution: { amount: 6000 },
        previousCutoffComparison: { difference: 2000 },
        savingsCount: 2,
        savingsRate: { rate: 20 },
        totalSavings: 10000,
        trend: { direction: 'Increasing' },
      },
    },
    scope: 'current_cutoff',
    summary: {
      title: 'Should be ignored from insightBundle',
    },
  }

  const sampleRecommendationBundle = {
    generatedAt: '2026-10-04T12:01:00.000Z',
    groups: {
      expense: ['rec_2'],
      savings: ['rec_1'],
    },
    recommendations: [
      {
        actionKey: 'maintain_savings',
        domain: 'savings',
        evidence: [{ source: 'savings.rate', value: 20 }],
        explanation: 'Great emergency fund pace.',
        id: 'rec_1',
        priority: 'medium',
        rank: 1,
        severity: 'info',
        sourceRuleIds: ['savings_rate_rule'],
        title: 'Maintain savings pace',
      },
      {
        actionKey: 'monitor_discretionary',
        domain: 'expense',
        evidence: [{ source: 'expense.food', value: 5000 }],
        explanation: 'Food spending is trending.',
        id: 'rec_2',
        priority: 'high',
        rank: 2,
        severity: 'warning',
        sourceRuleIds: ['food_threshold_rule'],
        title: 'Monitor food expenses',
      },
    ],
    scope: 'current_cutoff',
    suppressed: [
      {
        id: 'rec_suppressed',
        reason: 'lower_rank',
        title: 'Omitted low priority rec',
      },
    ],
  }

  const sampleFinancialSummary = {
    diagnostics: {
      counts: { actions: 1, highlights: 1 },
      state: 'ready',
    },
    generatedAt: '2026-10-04T12:02:00.000Z',
    metadata: {
      engineVersion: '1.0.0',
      language: 'en',
      narrativeVersion: '1.0.0',
      summaryId: 'summary:current_cutoff:2026-10-04T12:02:00.000Z',
      summaryType: 'standard',
      templateVersion: '1.0.0',
    },
    scope: 'current_cutoff',
    sections: [
      {
        paragraphs: [
          {
            evidence: [{ source: 'cashflow.remainingCash', value: 20000 }],
            horizon: 'current',
            key: 'exec_p1',
            relatedInsights: ['health', 'cashflow'],
            relatedRecommendations: ['rec_1'],
            templateId: 'exec.template',
            text: 'Financial position is stable with positive cashflow.',
            variables: { cash: '20000' },
          },
        ],
        title: 'Executive Summary',
        type: 'executive',
      },
      {
        paragraphs: [
          {
            evidence: [],
            horizon: 'immediate',
            key: 'actions_p1',
            relatedInsights: ['expenses'],
            relatedRecommendations: ['rec_2'],
            templateId: 'actions.template',
            text: 'Monitor food expenses to preserve remaining cash.',
            variables: {},
          },
        ],
        title: 'Priority Actions',
        type: 'priority_actions',
      },
    ],
    version: '1.0.0',
  }

  describe('PromptPackage DTO', () => {
    it('creates canonical PromptPackage shape with matching versions and no generated timestamp', () => {
      const pkg = createPromptPackage({
        context: { scope: 'test' },
        systemPrompt: 'sys',
        task: 'task-1',
        template: { id: 'tpl-1', version: '1.0.0' },
        userPrompt: 'usr',
      })

      expect(pkg.version).toBe(PROMPT_PACKAGE_VERSION)
      expect(pkg.version).toBe('1.0.0')
      expect(pkg.template).toEqual({ id: 'tpl-1', version: '1.0.0' })
      expect(pkg.task).toBe('task-1')
      expect(pkg.systemPrompt).toBe('sys')
      expect(pkg.userPrompt).toBe('usr')
      expect(pkg.context).toEqual({ scope: 'test' })
      expect(pkg.metadata).toEqual({
        contextVersion: '1.0.0',
        language: 'en',
        safetyVersion: '1.0.0',
      })

      // Prohibited fields check
      expect(pkg.timestamp).toBeUndefined()
      expect(pkg.createdAt).toBeUndefined()
      expect(pkg.generatedAt).toBeUndefined()
      expect(pkg.provider).toBeUndefined()
      expect(pkg.model).toBeUndefined()
      expect(pkg.temperature).toBeUndefined()
      expect(pkg.maxTokens).toBeUndefined()
      expect(pkg.stream).toBeUndefined()
      expect(pkg.apiKey).toBeUndefined()
      expect(pkg.endpoint).toBeUndefined()
    })
  })

  describe('Context Selector', () => {
    it('returns a new object and does not mutate source inputs', () => {
      const insightClone = JSON.parse(JSON.stringify(sampleInsightBundle))
      const recClone = JSON.parse(JSON.stringify(sampleRecommendationBundle))
      const summaryClone = JSON.parse(JSON.stringify(sampleFinancialSummary))

      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      expect(sampleInsightBundle).toEqual(insightClone)
      expect(sampleRecommendationBundle).toEqual(recClone)
      expect(sampleFinancialSummary).toEqual(summaryClone)

      expect(context.version).toBe(CONTEXT_VERSION)
      expect(context.scope).toBe('current_cutoff')
      expect(context.sourceTimestamps).toEqual({
        insights: '2026-10-04T12:00:00.000Z',
        recommendations: '2026-10-04T12:01:00.000Z',
        summary: '2026-10-04T12:02:00.000Z',
      })
      expect(context.conversationContext).toBeNull()
      expect(context.memoryContext).toBeNull()
    })

    it('ignores insightBundle.recommendations and insightBundle.summary as duplicate sources', () => {
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const recIds = context.recommendations.map((r) => r.id)
      expect(recIds).toEqual(['rec_1', 'rec_2'])
      expect(recIds).not.toContain('stale_insight_rec')

      expect(context.financialSummary.sections[0].title).toBe('Executive Summary')
      expect(JSON.stringify(context)).not.toContain('Should be ignored')
    })

    it('preserves exact RecommendationBundle order and excludes suppressed recs & groups', () => {
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      expect(context.recommendations).toHaveLength(2)
      expect(context.recommendations[0]).toEqual({
        actionKey: 'maintain_savings',
        domain: 'savings',
        evidence: [{ source: 'savings.rate', value: 20 }],
        explanation: 'Great emergency fund pace.',
        id: 'rec_1',
        priority: 'medium',
        rank: 1,
        severity: 'info',
        sourceRuleIds: ['savings_rate_rule'],
        title: 'Maintain savings pace',
      })
      expect(context.recommendations[1].id).toBe('rec_2')
      expect(context.recommendations.find((r) => r.id === 'rec_suppressed')).toBeUndefined()
      expect(context.groups).toBeUndefined()
      expect(context.suppressed).toBeUndefined()
    })

    it('performs strict insight context minimization, omitting raw and private data', () => {
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      // Health
      expect(context.insights.health).toEqual({
        score: 85,
        status: 'Healthy',
      })
      expect(context.insights.health.breakdown).toBeUndefined()
      expect(context.insights.health.diagnostics).toBeUndefined()

      // Income
      expect(context.insights.income).toEqual({
        averageIncome: 25000,
        incomeCount: 2,
        missingIncome: { missing: false },
        previousCutoffComparison: { difference: 0 },
        stability: { status: 'Stable' },
        totalIncome: 50000,
        trend: { direction: 'Stable' },
      })
      expect(context.insights.income.sourceBreakdown).toBeUndefined()
      expect(context.insights.income.primarySource).toBeUndefined()
      expect(context.insights.income.breakdown).toBeUndefined()
      expect(context.insights.income.diagnostics).toBeUndefined()
      expect(context.insights.income.evidence).toBeUndefined()

      // Expenses
      expect(context.insights.expenses).toEqual({
        currentPeriodDays: 15,
        dailySpendingRate: 1333.33,
        decrease: 500,
        expenseCount: 15,
        increase: 0,
        topSpendingCategory: 'Food',
        totalExpenses: 20000,
        trend: { direction: 'Decreasing' },
      })
      expect(context.insights.expenses.largestExpense).toBeUndefined()
      expect(context.insights.expenses.largestMerchant).toBeUndefined()
      expect(context.insights.expenses.anomalies).toBeUndefined()
      expect(context.insights.expenses.categoryDistribution).toBeUndefined()

      // Savings
      expect(context.insights.savings).toEqual({
        averageContribution: 5000,
        consistency: 'High',
        contributionFrequency: 'biweekly',
        previousCutoffComparison: { difference: 2000 },
        savingsCount: 2,
        savingsRate: { rate: 20 },
        totalSavings: 10000,
        trend: { direction: 'Increasing' },
      })
      expect(context.insights.savings.largestSavingsContribution).toBeUndefined()

      // Goals
      expect(context.insights.goals).toEqual({
        activeGoals: 2,
        completedGoals: 1,
        overallCompletionRate: 40,
        totalGoals: 3,
        totalSavedAmount: 40000,
        totalTargetAmount: 100000,
      })
      expect(context.insights.goals.highestFundedGoal).toBeUndefined()
      expect(context.insights.goals.goalsWithoutContributions).toBeUndefined()
      expect(context.insights.goals.goals).toBeUndefined()

      // Cashflow
      expect(context.insights.cashflow).toEqual({
        incomeCoverage: { status: 'Covered' },
        netCashflow: 30000,
        position: 'Positive',
        remainingCash: 20000,
        savingsCoverage: { status: 'Covered' },
        spendingPace: { status: 'On Pace' },
        stability: { status: 'Stable' },
      })

      // Cutoff
      expect(context.insights.cutoff).toEqual({
        averageComparison: { difference: 100 },
        currentCutoff: '2026-10-15',
        previousCutoffComparison: { difference: 0 },
        trend: { direction: 'Stable' },
      })
      expect(context.insights.cutoff.bestCutoff).toBeUndefined()
      expect(context.insights.cutoff.worstCutoff).toBeUndefined()
    })

    it('minimizes FinancialSummary while preserving section order, paragraph order, and relations', () => {
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const summary = context.financialSummary
      expect(summary.version).toBe('1.0.0')
      expect(summary.scope).toBe('current_cutoff')
      expect(summary.state).toBe('ready')
      expect(summary.metadata.summaryId).toBe(
        'summary:current_cutoff:2026-10-04T12:02:00.000Z',
      )

      expect(summary.sections).toHaveLength(2)
      expect(summary.sections[0].type).toBe('executive')
      expect(summary.sections[0].title).toBe('Executive Summary')
      expect(summary.sections[1].type).toBe('priority_actions')
      expect(summary.sections[1].title).toBe('Priority Actions')

      const p1 = summary.sections[0].paragraphs[0]
      expect(p1.key).toBe('exec_p1')
      expect(p1.text).toBe(
        'Financial position is stable with positive cashflow.',
      )
      expect(p1.horizon).toBe('current')
      expect(p1.relatedInsights).toEqual(['health', 'cashflow'])
      expect(p1.relatedRecommendations).toEqual(['rec_1'])

      // Excluded properties
      expect(p1.variables).toBeUndefined()
      expect(p1.templateId).toBeUndefined()
      expect(p1.evidence).toBeUndefined()
      expect(summary.diagnostics).toBeUndefined()
    })

    it('leaves missing domain as null and preserves explicit zero values', () => {
      const partialBundle = {
        cutoff: null,
        expenses: {
          metrics: {
            currentPeriodDays: 1,
            dailySpendingRate: 0,
            decrease: 0,
            expenseCount: 0,
            increase: 0,
            topSpendingCategory: null,
            totalExpenses: 0,
            trend: { direction: 'Stable' },
          },
        },
        generatedAt: '2026-10-04T12:00:00.000Z',
        health: null,
        income: null,
        savings: null,
        scope: 'current_cutoff',
      }

      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: partialBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      expect(context.insights.health).toBeNull()
      expect(context.insights.income).toBeNull()
      expect(context.insights.savings).toBeNull()
      expect(context.insights.cutoff).toBeNull()

      // Explicit zero values remain zero, not synthesized null or undefined
      expect(context.insights.expenses.totalExpenses).toBe(0)
      expect(context.insights.expenses.expenseCount).toBe(0)
      expect(context.insights.expenses.dailySpendingRate).toBe(0)
    })
  })

  describe('Template Registry', () => {
    it('resolves financialSummaryExplanation template', () => {
      const tpl = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      expect(tpl).toBeDefined()
      expect(tpl.id).toBe('financial-summary-explanation')
      expect(tpl.version).toBe('1.0.0')
      expect(tpl.task).toBe('financial-summary-explanation')
      expect(tpl.instruction).toContain('Explain the supplied deterministic financial summary')
      expect(tpl.instruction).toContain('Do not perform new financial calculations')
      expect(tpl.instruction).not.toContain('OpenAI')
      expect(tpl.instruction).not.toContain('Gemini')
      expect(tpl.instruction).not.toContain('Claude')
      expect(tpl.instruction).not.toContain('Ollama')
    })

    it('fails explicitly for unknown template IDs', () => {
      expect(() => getPromptTemplate('unknown-template')).toThrow(
        'Unknown prompt template ID: "unknown-template"',
      )
      expect(() => getPromptTemplate(null)).toThrow(
        'Invalid templateId: "null". Expected a non-empty string.',
      )
      expect(() => getPromptTemplate('')).toThrow(
        'Invalid templateId: "". Expected a non-empty string.',
      )
    })

    it('ensures registry and template IDs are frozen and immutable', () => {
      expect(Object.isFrozen(PROMPT_TEMPLATES)).toBe(true)
      expect(Object.isFrozen(PROMPT_TEMPLATE_IDS)).toBe(true)

      const tpl = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      expect(Object.isFrozen(tpl)).toBe(true)

      expect(() => {
        PROMPT_TEMPLATE_IDS.newKey = 'bad'
      }).toThrow()
    })
  })

  describe('Safety Injector', () => {
    it('contains all eight mandatory safety rules', () => {
      expect(SAFETY_POLICY_VERSION).toBe('1.0.0')
      expect(SAFETY_RULES).toHaveLength(8)
      expect(Object.isFrozen(SAFETY_RULES)).toBe(true)

      const instructions = getSafetyInstructions()
      expect(instructions).toContain(
        'Treat supplied PesoPilot deterministic context as the financial source of truth.',
      )
      expect(instructions).toContain(
        'Do not recalculate totals, percentages, forecasts, health scores, risk levels, spending pace, cashflow, or recommendation rankings.',
      )
      expect(instructions).toContain(
        'Do not invent financial facts, transactions, balances, goals, categories, income, expenses, savings, or recommendations.',
      )
      expect(instructions).toContain(
        'Do not override, reorder, replace, or contradict deterministic recommendations.',
      )
      expect(instructions).toContain(
        'If required information is unavailable, state that the available context is insufficient.',
      )
      expect(instructions).toContain(
        'Do not claim to spend money, approve expenses, modify records, delete records, mark payments complete, or perform financial actions.',
      )
      expect(instructions).toContain(
        'Do not provide investment advice, tax advice, legal advice, or loan recommendations.',
      )
      expect(instructions).toContain(
        'Explain and contextualize. Do not become the financial decision engine.',
      )
    })

    it('injects safety instructions into base system role cleanly', () => {
      const systemPrompt = injectSafetyInstructions('Base role here.')
      expect(systemPrompt).toContain('Base role here.')
      expect(systemPrompt).toContain('MANDATORY SAFETY RULES:')
      expect(systemPrompt).toContain('1. Treat supplied PesoPilot deterministic context')

      const injectedWithoutBase = injectSafetyInstructions('')
      expect(injectedWithoutBase.startsWith('MANDATORY SAFETY RULES:')).toBe(true)
    })
  })

  describe('Prompt Composer', () => {
    it('composes deterministic system and user prompts with serialized context unchanged', () => {
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const { systemPrompt, userPrompt } = composePrompts({
        baseSystemRole: BASE_SYSTEM_ROLE,
        context,
        template,
      })

      expect(systemPrompt).toContain(BASE_SYSTEM_ROLE)
      expect(systemPrompt).toContain('Treat supplied PesoPilot deterministic context as the financial source of truth.')
      expect(userPrompt).toContain(template.instruction)
      expect(userPrompt).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:\n')
      const fin = { ...context }
      delete fin.conversationContext
      delete fin.memoryContext
      expect(userPrompt).toContain(JSON.stringify(fin, null, 2))
      expect(userPrompt).not.toContain('UNTRUSTED_CONVERSATION_CONTEXT_JSON:')

      // No provider leaks
      expect(systemPrompt).not.toMatch(/openai|gemini|claude|ollama/i)
      expect(userPrompt).not.toMatch(/openai|gemini|claude|ollama/i)

      // Identical inputs produce identical prompt composition
      const again = composePrompts({
        baseSystemRole: BASE_SYSTEM_ROLE,
        context,
        template,
      })
      expect(again.systemPrompt).toBe(systemPrompt)
      expect(again.userPrompt).toBe(userPrompt)
    })

    it('composes prompts with UNTRUSTED_CONVERSATION_CONTEXT_JSON when conversationContext is present', () => {
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const sampleConvContext = {
        version: '1.0.0',
        topic: { current: 'expenses' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [
          { role: 'user', content: 'Why did my expenses increase?' },
        ],
      }
      const context = selectPromptContext({
        conversationContext: sampleConvContext,
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const { userPrompt } = composePrompts({
        baseSystemRole: BASE_SYSTEM_ROLE,
        context,
        template,
      })

      expect(userPrompt).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:\n')
      expect(userPrompt).toContain('UNTRUSTED_CONVERSATION_CONTEXT_JSON:\n')
      expect(userPrompt).toContain(JSON.stringify(sampleConvContext, null, 2))
      expect(userPrompt).not.toContain('"memoryContext"')
    })
  })

  describe('Prompt Validator', () => {
    it('passes for a valid PromptPackage', () => {
      const context = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const { systemPrompt, userPrompt } = composePrompts({
        context,
        template,
      })
      const pkg = createPromptPackage({
        context,
        systemPrompt,
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt,
      })

      const result = validatePromptPackage(pkg)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('fails when required fields or prompts are missing', () => {
      expect(validatePromptPackage(null).valid).toBe(false)
      expect(validatePromptPackage({}).valid).toBe(false)

      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const validContext = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const missingPromptsPkg = createPromptPackage({
        context: validContext,
        systemPrompt: '   ',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: '',
      })

      const res = validatePromptPackage(missingPromptsPkg)
      expect(res.valid).toBe(false)
      expect(
        res.errors.some((e) => e.includes('systemPrompt')),
      ).toBe(true)
      expect(res.errors.some((e) => e.includes('userPrompt'))).toBe(
        true,
      )
    })

    it('fails when template ID is not in the registry', () => {
      const validContext = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })
      const badTplPkg = createPromptPackage({
        context: validContext,
        systemPrompt: 'sys',
        task: 'unknown',
        template: { id: 'unregistered-tpl', version: '1.0.0' },
        userPrompt: 'usr',
      })

      const res = validatePromptPackage(badTplPkg)
      expect(res.valid).toBe(false)
      expect(
        res.errors.some((e) => e.includes('not registered')),
      ).toBe(true)
    })

    it('fails when metadata versions or language are invalid', () => {
      const validContext = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const badMetaPkg = createPromptPackage({
        context: validContext,
        metadata: {
          contextVersion: '2.0.0',
          language: 'fr',
          safetyVersion: '0.9.0',
        },
        systemPrompt: 'sys',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: 'usr',
      })

      const res = validatePromptPackage(badMetaPkg)
      expect(res.valid).toBe(false)
      expect(res.errors).toContain('Metadata language must be "en".')
      expect(res.errors).toContain(
        'Metadata contextVersion must be "1.0.0".',
      )
      expect(res.errors).toContain(
        'Metadata safetyVersion must be "1.0.0".',
      )
    })

    it('accepts valid conversationContext and fails when conversationContext is malformed or memoryContext is non-null', () => {
      const validContext = selectPromptContext({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )

      // Valid conversationContext passes
      const validConvContext = {
        version: '1.0.0',
        topic: { current: 'expenses' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [
          { role: 'user', content: 'Why did my expenses increase?' },
        ],
      }
      const validPkg = createPromptPackage({
        context: {
          ...validContext,
          conversationContext: validConvContext,
        },
        systemPrompt: 'sys',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: 'usr',
      })
      const validRes = validatePromptPackage(validPkg)
      expect(validRes.valid).toBe(true)

      // Malformed conversationContext fails
      const malformedConversationContext = {
        ...validContext,
        conversationContext: { sessionId: '123' },
      }
      const pkg1 = createPromptPackage({
        context: malformedConversationContext,
        systemPrompt: 'sys',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: 'usr',
      })
      const res1 = validatePromptPackage(pkg1)
      expect(res1.valid).toBe(false)
      expect(
        res1.errors.some((e) =>
          e.includes('Context conversationContext validation failed'),
        ),
      ).toBe(true)

      // Malformed memoryContext fails
      const malformedMemoryContext = {
        ...validContext,
        memoryContext: { userPreferences: {} },
      }
      const pkg2 = createPromptPackage({
        context: malformedMemoryContext,
        systemPrompt: 'sys',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: 'usr',
      })
      const res2 = validatePromptPackage(pkg2)
      expect(res2.valid).toBe(false)
      expect(
        res2.errors.some((e) =>
          e.includes('Context memoryContext validation failed'),
        ),
      ).toBe(true)
    })

    it('fails when context is missing required insight domain keys', () => {
      const template = getPromptTemplate(
        PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
      )
      const incompleteContext = {
        conversationContext: null,
        financialSummary: {},
        insights: {
          cashflow: null,
          expenses: null,
          health: null,
          // missing income, savings, goals, cutoff
        },
        memoryContext: null,
        recommendations: [],
        scope: 'current_cutoff',
        sourceTimestamps: {},
        version: '1.0.0',
      }

      const pkg = createPromptPackage({
        context: incompleteContext,
        systemPrompt: 'sys',
        task: template.task,
        template: { id: template.id, version: template.version },
        userPrompt: 'usr',
      })

      const res = validatePromptPackage(pkg)
      expect(res.valid).toBe(false)
      expect(
        res.errors.some((e) => e.includes('missing required domain key: "income"')),
      ).toBe(true)
      expect(
        res.errors.some((e) => e.includes('missing required domain key: "goals"')),
      ).toBe(true)
    })
  })

  describe('Prompt Builder End-to-End', () => {
    it('builds a valid PromptPackage end-to-end and is strictly deterministic', () => {
      const pkg1 = promptBuilder.build({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const pkg2 = buildPromptPackage({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      expect(pkg1).toEqual(pkg2)
      expect(JSON.stringify(pkg1)).toBe(JSON.stringify(pkg2))
      expect(pkg1.version).toBe('1.0.0')
      expect(pkg1.template.id).toBe('financial-summary-explanation')
      expect(pkg1.task).toBe('financial-summary-explanation')
      expect(pkg1.systemPrompt).toContain("You are PesoPilot's financial explanation assistant.")
      expect(pkg1.systemPrompt).toContain('Do not recalculate totals, percentages, forecasts')
      expect(pkg1.userPrompt).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:')
      expect(pkg1.userPrompt).not.toContain('UNTRUSTED_CONVERSATION_CONTEXT_JSON:')
      expect(pkg1.context.recommendations[0].id).toBe('rec_1')
      expect(pkg1.context.recommendations[1].id).toBe('rec_2')
    })

    it('builds a valid PromptPackage with conversationContext end-to-end with trust separation', () => {
      const validConvContext = {
        version: '1.0.0',
        topic: { current: 'expenses' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [
          { role: 'user', content: 'Why did my expenses increase?' },
          { role: 'assistant', content: 'Food expenses increased by 20%.' },
        ],
      }

      const pkg = promptBuilder.build({
        conversationContext: validConvContext,
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      expect(pkg.version).toBe('1.0.0')
      expect(pkg.context.conversationContext).toEqual(validConvContext)
      expect(pkg.context.memoryContext).toBeNull()

      // Trust separation in prompt composer
      expect(pkg.userPrompt).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:\n')
      expect(pkg.userPrompt).toContain('UNTRUSTED_CONVERSATION_CONTEXT_JSON:\n')
      expect(pkg.userPrompt).toContain('Food expenses increased by 20%.')

      // Ensure conversation context is NOT in deterministic financial context block
      const financialBlock = pkg.userPrompt
        .split('UNTRUSTED_CONVERSATION_CONTEXT_JSON:')[0]
      expect(financialBlock).not.toContain('Food expenses increased by 20%.')
      expect(financialBlock).not.toContain('"conversationContext"')
      expect(financialBlock).not.toContain('"memoryContext"')
    })

    it('throws validation error when conversationContext is malformed in buildPromptPackage', () => {
      expect(() => {
        promptBuilder.build({
          conversationContext: { version: 'invalid-version' },
          financialSummary: sampleFinancialSummary,
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
        })
      }).toThrow(/PromptPackage validation failed/)
    })

    it('throws clear error when required source arguments are missing', () => {
      expect(() => {
        buildPromptPackage({
          financialSummary: sampleFinancialSummary,
          insightBundle: null,
          recommendationBundle: sampleRecommendationBundle,
        })
      }).toThrow('buildPromptPackage requires a valid insightBundle object.')

      expect(() => {
        buildPromptPackage({
          financialSummary: sampleFinancialSummary,
          insightBundle: sampleInsightBundle,
          recommendationBundle: null,
        })
      }).toThrow('buildPromptPackage requires a valid recommendationBundle object.')

      expect(() => {
        buildPromptPackage({
          financialSummary: null,
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
        })
      }).toThrow('buildPromptPackage requires a valid financialSummary object.')
    })

    it('verifies manual inspection constraints: no raw records, no diagnostics, no provider config', () => {
      const pkg = promptBuilder.build({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })

      const serialized = JSON.stringify(pkg)

      // Verified: no raw records / internal diagnostics
      expect(serialized).not.toContain('exp_breakdown')
      expect(serialized).not.toContain('inc_breakdown')
      expect(serialized).not.toContain('Supermarket')
      expect(serialized).not.toContain('Electronics')
      expect(serialized).not.toContain('Tech Corp')
      expect(serialized).not.toContain('Secret Goal Detail')
      expect(serialized).not.toContain('anom_1')
      expect(serialized).not.toContain('stale_insight_rec')
      expect(serialized).not.toContain('rec_suppressed')
      expect(serialized).not.toContain('Omitted low priority rec')

      // Verified: no provider config
      expect(serialized).not.toMatch(/api[_-]?key/i)
      expect(serialized).not.toMatch(/temperature/i)
      expect(serialized).not.toMatch(/max[_-]?tokens/i)
      expect(serialized).not.toMatch(/endpoint/i)
      expect(serialized).not.toMatch(/openai|gemini|claude|ollama/i)

      // Verified: no generated timestamps in PromptPackage
      expect(pkg.timestamp).toBeUndefined()
      expect(pkg.createdAt).toBeUndefined()
    })
  })

  describe('Prompt Builder Memory Context Integration (Phase 11B.5)', () => {
    const validMemoryContext = {
      version: '1.0.0',
      items: [
        {
          type: 'communication_preference',
          content: 'User prefers concise summaries.',
        },
      ],
    }

    it('accepts memoryContext: null and omits UNTRUSTED_MEMORY_CONTEXT_JSON', () => {
      const pkg = buildPromptPackage({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        memoryContext: null,
      })

      expect(pkg.context.memoryContext).toBeNull()
      expect(pkg.userPrompt).not.toContain('UNTRUSTED_MEMORY_CONTEXT_JSON:')
      expect(pkg.userPrompt).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:')
    })

    it('accepts valid MemoryContext and serializes UNTRUSTED_MEMORY_CONTEXT_JSON', () => {
      const pkg = buildPromptPackage({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        memoryContext: validMemoryContext,
      })

      expect(pkg.context.memoryContext).toBeDefined()
      expect(pkg.context.memoryContext.version).toBe('1.0.0')
      expect(pkg.context.memoryContext.items).toHaveLength(1)
      expect(pkg.userPrompt).toContain('UNTRUSTED_MEMORY_CONTEXT_JSON:')
      expect(pkg.userPrompt).toContain('User prefers concise summaries.')
    })

    it('ensures memory is NOT serialized inside DETERMINISTIC_FINANCIAL_CONTEXT_JSON', () => {
      const pkg = buildPromptPackage({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        memoryContext: validMemoryContext,
      })

      // Extract DETERMINISTIC_FINANCIAL_CONTEXT_JSON section
      const financialSection = pkg.userPrompt.split('UNTRUSTED_')[0]
      expect(financialSection).toContain('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:')
      expect(financialSection).not.toContain('User prefers concise summaries.')
      expect(financialSection).not.toContain('communication_preference')
    })

    it('maintains stable ordering: financial -> conversation -> memory', () => {
      const convContext = {
        version: '1.0.0',
        topic: { current: 'expenses' },
        clarification: { required: false, reason: null, missingFields: [] },
        recentMessages: [{ role: 'user', content: 'What about expenses?' }],
      }

      const pkg = buildPromptPackage({
        financialSummary: sampleFinancialSummary,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
        conversationContext: convContext,
        memoryContext: validMemoryContext,
      })

      const finIdx = pkg.userPrompt.indexOf('DETERMINISTIC_FINANCIAL_CONTEXT_JSON:')
      const convIdx = pkg.userPrompt.indexOf('UNTRUSTED_CONVERSATION_CONTEXT_JSON:')
      const memIdx = pkg.userPrompt.indexOf('UNTRUSTED_MEMORY_CONTEXT_JSON:')

      expect(finIdx).toBeGreaterThan(-1)
      expect(convIdx).toBeGreaterThan(finIdx)
      expect(memIdx).toBeGreaterThan(convIdx)
    })

    it('rejects invalid MemoryContext before minimization', () => {
      const invalidMem = {
        version: '1.0.0',
        items: [
          {
            type: 'unsupported_memory_type',
            content: 'Bad type content',
          },
        ],
      }

      expect(() => {
        buildPromptPackage({
          financialSummary: sampleFinancialSummary,
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          memoryContext: invalidMem,
        })
      }).toThrow(/buildPromptPackage requires a valid memoryContext/)
    })

    it('rejects MemoryContext containing internal fields', () => {
      const dirtyMem = {
        version: '1.0.0',
        items: [
          {
            type: 'communication_preference',
            content: 'Valid content',
            memoryId: 'illegal_id',
          },
        ],
      }

      expect(() => {
        buildPromptPackage({
          financialSummary: sampleFinancialSummary,
          insightBundle: sampleInsightBundle,
          recommendationBundle: sampleRecommendationBundle,
          memoryContext: dirtyMem,
        })
      }).toThrow(/disallowed field "memoryId"/)
    })
  })
})
