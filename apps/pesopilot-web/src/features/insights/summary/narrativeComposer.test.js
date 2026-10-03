import { describe, expect, it } from 'vitest'
import { composeNarrative } from './narrativeComposer.js'
import {
  CANONICAL_SECTION_ORDER,
  NARRATIVE_TONES,
  SUMMARY_SECTION_TYPES,
} from './summaryConstants.js'

describe('narrativeComposer', () => {
  it('enforces fixed canonical section order', () => {
    const candidates = [
      {
        horizon: 'current',
        key: 'position_cash',
        sectionType: 'currentPosition',
        subject: 'position.cash',
        templateId: 'position.cash.positive',
        variables: { remainingCash: '₱5,000' },
      },
      {
        domain: 'cashflow',
        horizon: 'current',
        key: 'risk_cashflow_negative',
        sectionType: 'risks',
        severity: 'critical',
        subject: 'cashflow_position',
        templateId: 'risk.cash.negative',
        variables: {},
      },
      {
        domain: 'cashflow',
        horizon: 'current',
        key: 'action_1',
        rank: 1,
        relatedRecommendations: ['rec_1'],
        sectionType: 'priorityActions',
        subject: 'action_1',
        templateId: 'action.default',
        variables: { explanation: 'Reduce spending.', title: 'Cut expenses' },
      },
      {
        domain: 'income',
        horizon: 'monthly',
        key: 'highlight_income',
        sectionType: 'highlights',
        subject: 'highlight_income',
        templateId: 'highlight.change.up',
        variables: {
          baselineLabel: 'last month',
          metricLabel: 'Income',
          percent: '10%',
        },
      },
    ]

    const { sections } = composeNarrative({ candidates })
    const sectionTypes = sections.map((s) => s.type)

    // Expected canonical order: executive, currentPosition, highlights, risks, priorityActions, closing
    expect(sectionTypes).toEqual([
      SUMMARY_SECTION_TYPES.executive,
      SUMMARY_SECTION_TYPES.currentPosition,
      SUMMARY_SECTION_TYPES.highlights,
      SUMMARY_SECTION_TYPES.risks,
      SUMMARY_SECTION_TYPES.priorityActions,
      SUMMARY_SECTION_TYPES.closing,
    ])

    // Verify each section in result follows canonical order indices
    let lastIdx = -1
    for (const t of sectionTypes) {
      const idx = CANONICAL_SECTION_ORDER.indexOf(t)
      expect(idx).toBeGreaterThan(lastIdx)
      lastIdx = idx
    }
  })

  it('ranks risks with explicit severity first, followed by unclassified risks, domain order, and key (Correction 2)', () => {
    const candidates = [
      {
        domain: 'cutoff',
        key: 'prev_cutoff_expenses',
        sectionType: 'risks',
        severity: null, // Unclassified comparison risk
        subject: 'comp_exp',
        templateId: 'risk.change.up',
        variables: {
          baselineLabel: 'previous cutoff',
          metricLabel: 'Expenses',
          percent: '20%',
        },
      },
      {
        domain: 'savings',
        key: 'risk_savings_low',
        sectionType: 'risks',
        severity: 'warning',
        subject: 'savings_rate',
        templateId: 'risk.savings.low',
        variables: { savingsRate: '5%' },
      },
      {
        domain: 'cashflow',
        key: 'risk_cashflow_negative',
        sectionType: 'risks',
        severity: 'critical',
        subject: 'cashflow_position',
        templateId: 'risk.cash.negative',
        variables: {},
      },
      {
        domain: 'cashflow',
        key: 'risk_spending_pace_fast',
        sectionType: 'risks',
        severity: 'warning',
        subject: 'spending_pace',
        templateId: 'risk.pace.fast',
        variables: {},
      },
    ]

    const { sections } = composeNarrative({ candidates })
    const riskSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.risks)
    expect(riskSection).toBeDefined()
    const keys = riskSection.paragraphs.map((p) => p.key)

    // 1. Critical (cashflow negative)
    // 2. Warning cashflow (spending pace fast)
    // 3. Warning savings (savings low)
    // 4. Unclassified cutoff comparison risk (expenses up)
    expect(keys).toEqual([
      'risk_cashflow_negative',
      'risk_spending_pace_fast',
      'risk_savings_low',
      'prev_cutoff_expenses',
    ])
  })

  it('preserves RecommendationBundle.rank for Priority Actions', () => {
    const candidates = [
      {
        domain: 'savings',
        key: 'action_c',
        rank: 3,
        relatedRecommendations: ['rec_c'],
        sectionType: 'priorityActions',
        subject: 'action_c',
        templateId: 'action.default',
        variables: { explanation: 'Contribute to emergency fund.', title: 'Save more' },
      },
      {
        domain: 'cashflow',
        key: 'action_a',
        rank: 1,
        relatedRecommendations: ['rec_a'],
        sectionType: 'priorityActions',
        subject: 'action_a',
        templateId: 'action.default',
        variables: { explanation: 'Slow discretionary spending.', title: 'Reduce pace' },
      },
      {
        domain: 'expense',
        key: 'action_b',
        rank: 2,
        relatedRecommendations: ['rec_b'],
        sectionType: 'priorityActions',
        subject: 'action_b',
        templateId: 'action.default',
        variables: { explanation: 'Check food expenses.', title: 'Audit dining' },
      },
    ]

    const { sections } = composeNarrative({ candidates })
    const actionSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.priorityActions)
    expect(actionSection).toBeDefined()
    expect(actionSection.paragraphs.map((p) => p.key)).toEqual([
      'action_a',
      'action_b',
      'action_c',
    ])
  })

  it('eliminates contradictions: risks take precedence over positive observations with the same subject', () => {
    const candidates = [
      {
        domain: 'cashflow',
        key: 'risk_cashflow_negative',
        sectionType: 'risks',
        severity: 'critical',
        subject: 'cashflow_position',
        templateId: 'risk.cash.negative',
        variables: {},
      },
      {
        domain: 'cashflow',
        key: 'positive_cashflow_position',
        sectionType: 'positiveObservations',
        subject: 'cashflow_position', // Same subject
        templateId: 'positive.cashflow',
        variables: {},
      },
    ]

    const { omitted, sections } = composeNarrative({ candidates })
    const positiveSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.positiveObservations)
    // Positive observations section should be omitted since its only item was contradicted
    expect(positiveSection).toBeUndefined()
    expect(omitted).toContainEqual({
      key: 'positive_cashflow_position',
      reason: 'contradicted',
    })
  })

  it('determines tone consistently across executive and closing sections', () => {
    const candidatesWithCritical = [
      {
        domain: 'cashflow',
        key: 'risk_cashflow_negative',
        sectionType: 'risks',
        severity: 'critical',
        subject: 'cashflow_position',
        templateId: 'risk.cash.negative',
        variables: {},
      },
    ]

    const { sections, tone } = composeNarrative({ candidates: candidatesWithCritical })
    expect(tone).toBe(NARRATIVE_TONES.attention)

    const exec = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.executive)
    const closing = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.closing)

    expect(exec.paragraphs[0].templateId).toContain('attention')
    expect(closing.paragraphs[0].templateId).toBe('closing.attention')
  })

  it('enforces section caps and records omitted candidates', () => {
    const manyRisks = Array.from({ length: 8 }, (_, i) => ({
      domain: 'cashflow',
      key: `risk_${i}`,
      sectionType: 'risks',
      severity: 'warning',
      subject: `subject_${i}`,
      templateId: 'risk.cash.negative',
      variables: {},
    }))

    const { omitted, sections } = composeNarrative({ candidates: manyRisks })
    const riskSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.risks)
    expect(riskSection.paragraphs).toHaveLength(5)
    expect(omitted.filter((o) => o.reason === 'cap')).toHaveLength(3)
  })

  it('omits candidate safely when required template variable is missing', () => {
    const candidates = [
      {
        domain: 'cutoff',
        key: 'highlight_broken',
        sectionType: 'highlights',
        subject: 'highlight_broken',
        templateId: 'highlight.change.up',
        variables: {
          // missing metricLabel and baselineLabel
          percent: '10%',
        },
      },
    ]

    const { omitted, sections } = composeNarrative({ candidates })
    const highlightSection = sections.find((s) => s.type === SUMMARY_SECTION_TYPES.highlights)
    expect(highlightSection).toBeUndefined()
    expect(omitted).toContainEqual({
      key: 'highlight_broken',
      reason: 'missing_data',
    })
  })
})
