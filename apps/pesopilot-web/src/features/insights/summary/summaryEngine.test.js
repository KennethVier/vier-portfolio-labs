import { describe, expect, it } from 'vitest'
import { generateFinancialSummary } from './summaryEngine.js'
import {
  EMPTY_SUMMARY_TEXT,
  SUMMARY_SECTION_TYPES,
} from './summaryConstants.js'
import { validateFinancialSummary } from './summaryValidator.js'

describe('summaryEngine', () => {
  const sampleInsightBundle = {
    cashflow: {
      metrics: {
        position: 'Positive',
        remainingCash: 4500,
        spendingPace: { status: 'On Pace' },
      },
    },
    expenses: {
      metrics: {
        expenseCount: 5,
        topSpendingCategory: {
          amount: 2500,
          categoryId: 'cat_food',
          categoryName: 'Food',
          count: 3,
          percentage: 50,
        },
        totalExpenses: 5000,
      },
    },
    goals: {
      metrics: {
        activeGoals: 1,
        completedGoals: 0,
        overallCompletionRate: 50,
        totalGoals: 1,
      },
    },
    health: {
      score: 85,
      status: 'Healthy',
    },
    income: {
      metrics: {
        incomeCount: 1,
        totalIncome: 30000,
      },
    },
    savings: {
      metrics: {
        savingsCount: 2,
        savingsRate: {
          rate: 22,
          status: 'Strong',
        },
        totalSavings: 6600,
      },
    },
    scope: 'current_cutoff',
  }

  const sampleRecommendationBundle = {
    generatedAt: '2026-06-28T00:05:00.000Z',
    recommendations: [
      {
        actionKey: 'maintain_savings',
        domain: 'savings',
        evidence: [
          {
            label: 'Savings Rate',
            ruleId: 'savings_rate',
            value: 22,
          },
        ],
        explanation: 'Keep up consistent emergency fund deposits.',
        id: 'rec_savings_strong',
        priority: 'medium',
        rank: 1,
        severity: 'info',
        sourceRuleIds: ['savings_rate'],
        title: 'Maintain current savings pace',
      },
    ],
    scope: 'current_cutoff',
  }

  it('generates a valid FinancialSummary on the happy path with tracker examples', () => {
    const summary = generateFinancialSummary({
      insightBundle: sampleInsightBundle,
      recommendationBundle: sampleRecommendationBundle,
    })

    expect(summary).toBeDefined()
    expect(summary.version).toBe('1.0.0')
    expect(summary.scope).toBe('current_cutoff')
    expect(summary.diagnostics.state).toBe('ready')

    // Validate using summaryValidator directly
    const validation = validateFinancialSummary({
      financialSummary: summary,
      insightBundle: sampleInsightBundle,
      recommendationBundle: sampleRecommendationBundle,
    })
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])

    // Check position section narratives matching Phase 11A.9 tracker examples:
    const positionSection = summary.sections.find(
      (s) => s.type === SUMMARY_SECTION_TYPES.currentPosition,
    )
    expect(positionSection).toBeDefined()
    const paragraphTexts = positionSection.paragraphs.map((p) => p.text)

    expect(paragraphTexts).toContain(
      'You currently have ₱4,500 remaining before your next payday.',
    )
    expect(paragraphTexts).toContain(
      'You saved 22% of your income this cutoff.',
    )
    expect(paragraphTexts).toContain(
      'Food remains your largest spending category.',
    )

    // Check Priority Actions section uses recommendations
    const actionSection = summary.sections.find(
      (s) => s.type === SUMMARY_SECTION_TYPES.priorityActions,
    )
    expect(actionSection).toBeDefined()
    expect(actionSection.paragraphs[0].text).toBe(
      'Maintain current savings pace. Keep up consistent emergency fund deposits.',
    )
    expect(actionSection.paragraphs[0].evidence).toEqual([])
    expect(actionSection.paragraphs[0].relatedRecommendations).toEqual([
      'rec_savings_strong',
    ])
  })

  it('returns valid empty summary when input bundle has insufficient data (Correction 5 & 6)', () => {
    const emptyBundle = {
      cashflow: { metrics: { netCashflow: 0, position: 'No Data', remainingCash: 0 } },
      expenses: { metrics: { expenseCount: 0, totalExpenses: 0 } },
      goals: { metrics: { activeGoals: 0, totalGoals: 0 } },
      health: { score: 0, status: 'Critical' }, // Health alone is not sufficient data
      income: { metrics: { incomeCount: 0, totalIncome: 0 } },
      savings: { metrics: { savingsCount: 0, totalSavings: 0 } },
      scope: 'current_cutoff',
    }

    const summary = generateFinancialSummary({
      insightBundle: emptyBundle,
      recommendationBundle: { recommendations: [] },
    })

    expect(summary.diagnostics.state).toBe('empty')
    expect(summary.sections).toHaveLength(1)
    expect(summary.sections[0].type).toBe(SUMMARY_SECTION_TYPES.executive)
    expect(summary.sections[0].paragraphs[0].text).toBe(EMPTY_SUMMARY_TEXT)
    expect(summary.sections[0].paragraphs[0].evidence).toEqual([])

    const validation = validateFinancialSummary({
      financialSummary: summary,
      insightBundle: emptyBundle,
      recommendationBundle: { recommendations: [] },
    })
    expect(validation.valid).toBe(true)
  })

  it('safely handles null or malformed inputs without throwing', () => {
    const summary1 = generateFinancialSummary({
      insightBundle: null,
      recommendationBundle: null,
    })
    expect(summary1.diagnostics.state).toBe('empty')

    const summary2 = generateFinancialSummary({})
    expect(summary2.diagnostics.state).toBe('empty')
  })

  it('preserves raw evidence values matching source while variables are formatted (Correction 3)', () => {
    const summary = generateFinancialSummary({
      insightBundle: sampleInsightBundle,
      recommendationBundle: sampleRecommendationBundle,
    })

    const positionSection = summary.sections.find(
      (s) => s.type === SUMMARY_SECTION_TYPES.currentPosition,
    )
    const cashParagraph = positionSection.paragraphs.find(
      (p) => p.key === 'position_cash',
    )

    // Raw evidence value is number 4500
    expect(cashParagraph.evidence[0].value).toBe(4500)
    expect(cashParagraph.evidence[0].source).toBe('cashflow.metrics.remainingCash')

    // Display variable is formatted string "₱4,500"
    expect(cashParagraph.variables.remainingCash).toBe('₱4,500')
  })

  it('validator rejects tampered summaries', () => {
    const summary = generateFinancialSummary({
      insightBundle: sampleInsightBundle,
      recommendationBundle: sampleRecommendationBundle,
    })

    // Tamper with paragraph text
    const tampered = JSON.parse(JSON.stringify(summary))
    tampered.sections[0].paragraphs[0].text = 'Fabricated financial statement'

    const check1 = validateFinancialSummary({
      financialSummary: tampered,
      insightBundle: sampleInsightBundle,
      recommendationBundle: sampleRecommendationBundle,
    })
    expect(check1.valid).toBe(false)
    expect(check1.errors.length).toBeGreaterThan(0)

    // Tamper with recommendation id
    const tamperedRec = JSON.parse(JSON.stringify(summary))
    const actSec = tamperedRec.sections.find(
      (s) => s.type === SUMMARY_SECTION_TYPES.priorityActions,
    )
    if (actSec) {
      actSec.paragraphs[0].relatedRecommendations = ['non_existent_rec_id']
      const check2 = validateFinancialSummary({
        financialSummary: tamperedRec,
        insightBundle: sampleInsightBundle,
        recommendationBundle: sampleRecommendationBundle,
      })
      expect(check2.valid).toBe(false)
    }
  })

  it('is completely deterministic: identical inputs yield identical summaries', () => {
    const fixedTime = '2026-06-28T12:00:00.000Z'
    const bundle = { ...sampleInsightBundle, generatedAt: fixedTime }
    const recs = { ...sampleRecommendationBundle, generatedAt: fixedTime }

    const run1 = generateFinancialSummary({ insightBundle: bundle, recommendationBundle: recs })
    const run2 = generateFinancialSummary({ insightBundle: bundle, recommendationBundle: recs })

    expect(run1).toEqual(run2)
  })

  it('never mutates input bundles', () => {
    const frozenInsight = Object.freeze(JSON.parse(JSON.stringify(sampleInsightBundle)))
    const frozenRec = Object.freeze(JSON.parse(JSON.stringify(sampleRecommendationBundle)))

    expect(() => {
      generateFinancialSummary({
        insightBundle: frozenInsight,
        recommendationBundle: frozenRec,
      })
    }).not.toThrow()
  })
})
