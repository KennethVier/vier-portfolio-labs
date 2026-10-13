import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { HeaderProvider } from '@/components/layout/HeaderContent.jsx'
import { savingsSchema } from './schemas/savingsSchema.js'
import { insightService } from '@/features/insights/services/insightService.js'
import { recommendationRuleRegistry } from '@/features/insights/rules/recommendation/recommendationRuleRegistry.js'
import { selectPromptContext } from '@/features/ai-insights/prompt/contextSelector.js'
import { buildCandidateSections } from '@/features/insights/summary/summarySectionBuilder.js'
import { SavingsPage } from './pages/SavingsPage.jsx'

describe('Savings Scope Remediation (MVP Goals Deactivation)', () => {
  it('Savings creation does not require Goal (goalId is optional)', () => {
    const payloadWithoutGoal = {
      amount: 1500,
      source: 'Emergency Fund',
      date: '2026-06-15',
    }
    const parsed = savingsSchema.safeParse(payloadWithoutGoal)
    expect(parsed.success).toBe(true)
    expect(parsed.data.goalId).toBeNull()
  })

  it('historical goalId does not alter Savings totals', () => {
    const savingsWithGoal = [
      { id: 1, amount: 2000, source: 'Emergency', date: '2026-06-05', cutoffId: 1, goalId: 999 },
      { id: 2, amount: 3000, source: 'Retirement', date: '2026-06-10', cutoffId: 1, goalId: null },
    ]
    const savingsWithoutGoal = [
      { id: 1, amount: 2000, source: 'Emergency', date: '2026-06-05', cutoffId: 1, goalId: null },
      { id: 2, amount: 3000, source: 'Retirement', date: '2026-06-10', cutoffId: 1, goalId: null },
    ]

    const sumWithGoal = savingsWithGoal.reduce((sum, s) => sum + s.amount, 0)
    const sumWithoutGoal = savingsWithoutGoal.reduce((sum, s) => sum + s.amount, 0)
    expect(sumWithGoal).toBe(5000)
    expect(sumWithoutGoal).toBe(5000)
    expect(sumWithGoal).toEqual(sumWithoutGoal)
  })

  it('Goal engine does not participate in current MVP InsightBundle', async () => {
    const bundle = await insightService.loadInsights()
    expect(bundle.goals.metrics.totalGoals).toBe(0)
    expect(bundle.goals.metrics.activeGoals).toBe(0)
    expect(bundle.goals.explanation).toBe('')
  })

  it('Goal recommendation rules do not execute in MVP pipeline', () => {
    const goalRuleIds = ['goal_no_contributions', 'goal_behind', 'allocate_surplus_to_goal']
    const activeRuleIds = recommendationRuleRegistry.map((r) => r.id)
    for (const id of goalRuleIds) {
      expect(activeRuleIds).not.toContain(id)
    }
  })

  it('Goal data is absent from current MVP summary candidates and AI context', () => {
    const bundle = {
      goals: {
        breakdown: [{ id: 'goal_behind', severity: 'warning' }],
        metrics: { activeGoals: 2, totalGoals: 2 },
      },
    }
    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })
    const goalCandidate = candidates.find((c) => c.key && c.key.includes('goal'))
    expect(goalCandidate).toBeUndefined()

    const aiContext = selectPromptContext({
      financialSummary: { version: '1.0.0', sections: [] },
      insightBundle: { goals: { activeGoals: 3 } },
      recommendationBundle: { recommendations: [] },
    })
    expect(aiContext.insights.goals).toBeNull()
  })

  it('Savings MVP UI exposes no Goal creation/edit/archive/delete controls', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HeaderProvider>
          <SavingsPage />
        </HeaderProvider>
      </MemoryRouter>
    )
    expect(markup).not.toContain('SavingsGoalForm')
    expect(markup).not.toContain('SavingsGoalCard')
    expect(markup).not.toContain('SavingsGoalsSection')
    expect(markup).not.toContain('Add Goal')
    expect(markup).not.toContain('Create Goal')
    expect(markup).not.toContain('Goal Progress')
    expect(markup).not.toContain('Archive Goal')
  })
})
