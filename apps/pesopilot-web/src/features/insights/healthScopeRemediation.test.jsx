import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { HeaderProvider } from '@/components/layout/HeaderContent.jsx'
import { Header } from '@/components/layout/Header.jsx'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage.jsx'
import { InsightsPage } from '@/features/insights/pages/InsightsPage.jsx'
import { insightService } from '@/features/insights/services/insightService.js'
import { recommendationRuleRegistry } from '@/features/insights/rules/recommendation/recommendationRuleRegistry.js'
import { selectPromptContext } from '@/features/ai-insights/prompt/contextSelector.js'
import { buildCandidateSections } from '@/features/insights/summary/summarySectionBuilder.js'

describe('Health Scope Remediation (MVP Financial Health Score Deactivation)', () => {
  it('MVP canonical insight pipeline does not generate Financial Health Score (health is null)', async () => {
    const bundle = await insightService.loadInsights()
    expect(bundle.health).toBeNull()
  })

  it('Header does not render Health Score', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HeaderProvider>
          <Header />
        </HeaderProvider>
      </MemoryRouter>
    )
    expect(markup).not.toContain('Health Score')
    expect(markup).not.toContain('healthScore')
  })

  it('Dashboard does not render Health Score', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HeaderProvider>
          <DashboardPage />
        </HeaderProvider>
      </MemoryRouter>
    )
    expect(markup).not.toContain('Health Score')
    expect(markup).not.toContain('healthScore')
    expect(markup).not.toContain('Financial Health')
  })

  it('Insights page does not render Health Score or placeholder', () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <HeaderProvider>
          <InsightsPage />
        </HeaderProvider>
      </MemoryRouter>
    )
    expect(markup).not.toContain('Health Score')
    expect(markup).not.toContain('Financial Health')
  })

  it('Health-dependent recommendations do not execute', () => {
    const activeRuleIds = recommendationRuleRegistry.map((r) => r.id)
    expect(activeRuleIds).not.toContain('health_low_status')
  })

  it('FinancialSummary does not contain Health Score evidence or candidates', () => {
    const bundle = {
      cashflow: { metrics: { remainingCash: 2500, position: 'Positive' } },
      health: {
        score: 45,
        status: 'Needs Attention',
        breakdown: [{ id: 'expense_ratio', severity: 'warning' }],
      },
    }
    const { candidates } = buildCandidateSections({
      insightBundle: bundle,
      recommendationBundle: { recommendations: [] },
    })
    const healthCandidate = candidates.find((c) => c.key && c.key.includes('health'))
    expect(healthCandidate).toBeUndefined()
  })

  it('AI minimized context does not contain Health Score', () => {
    const aiContext = selectPromptContext({
      financialSummary: { version: '1.0.0', sections: [] },
      insightBundle: {
        health: { score: 90, status: 'Healthy' },
        expenses: { metrics: { totalExpenses: 5000 } },
      },
      recommendationBundle: { recommendations: [] },
    })
    expect(aiContext.insights.health).toBeNull()
  })

  it('Authorized domain insights continue working without composite health score', async () => {
    const bundle = await insightService.loadInsights()
    expect(bundle.cashflow).toBeDefined()
    expect(bundle.expenses).toBeDefined()
    expect(bundle.income).toBeDefined()
    expect(bundle.savings).toBeDefined()
    expect(bundle.cutoff).toBeDefined()
    expect(bundle.recommendations).toBeDefined()
    expect(bundle.summary).toBeDefined()
  })
})
