import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { HeaderProvider } from '@/components/layout/HeaderContent.jsx'
import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { salaryCutoffRepository } from '@/lib/db/repositories/salaryCutoffRepository.js'
import { savingsGoalRepository } from '@/lib/db/repositories/savingsGoalRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { savingsService } from './services/savingsService.js'
import { savingsSchema } from './schemas/savingsSchema.js'
import { insightService } from '@/features/insights/services/insightService.js'
import { recommendationRuleRegistry } from '@/features/insights/rules/recommendation/recommendationRuleRegistry.js'
import { selectPromptContext } from '@/features/ai-insights/prompt/contextSelector.js'
import { buildCandidateSections } from '@/features/insights/summary/summarySectionBuilder.js'
import { SavingsForm } from './components/SavingsForm.jsx'
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

  it('preserves historical goalId across CRUD, loading, filtering, totals, and Cashflow without Goal repository reads', async () => {
    // 0. Database isolation with fake-indexeddb
    await db.open()
    await clearDatabase()

    try {
      const today = new Date()
      const formatIso = (d) => d.toISOString().slice(0, 10)
      const startDate = formatIso(new Date(Date.now() - 3 * 86400000))
      const endDate = formatIso(new Date(Date.now() + 10 * 86400000))
      const recordDate = formatIso(today)

      // 1. Seed a salary cutoff spanning today
      const cutoffId = await salaryCutoffRepository.create({
        name: 'Current Salary Cycle',
        type: 'semi_monthly',
        startDate,
        endDate,
        expectedIncome: 50000,
        status: 'active',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      })

      // Seed an income record for Cashflow verification (Remaining Cash = Income - Expenses - Savings)
      await incomeRepository.create({
        amount: 50000,
        source: 'Primary Salary',
        date: recordDate,
        cutoffId,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      })

      // Seed an independent savings record to verify no other records are altered
      const otherSavingsId = await savingsRepository.create({
        amount: 2500,
        source: 'Retirement',
        date: recordDate,
        cutoffId,
        goalId: null,
        note: 'Untouched other record',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      })

      // Ensure Goal repository would fail loudly if called anywhere in loadSavings
      const goalFindAllSpy = vi.spyOn(savingsGoalRepository, 'findAll').mockImplementation(() => {
        throw new Error('UNAUTHORIZED_GOAL_REPOSITORY_READ: Goals repository must not be accessed during MVP savings loading')
      })

      // 2. Create a savings record with a historical non-null goalId (e.g. from Phase 14 legacy data)
      const historicalGoalId = 90210
      const initialRecord = await savingsService.createSavings({
        amount: 5000,
        source: 'Emergency Fund',
        date: recordDate,
        cutoffId,
        goalId: historicalGoalId,
        note: 'Pre-existing goal contribution buffer',
      })

      expect(initialRecord.id).toBeDefined()
      expect(initialRecord.goalId).toBe(historicalGoalId)

      // 3. Verify the record appears in normal Savings loading
      const loadedList = await savingsService.loadSavings()
      const foundInitial = loadedList.find((r) => r.id === initialRecord.id)
      expect(foundInitial).toBeDefined()

      // 4. Verify amount, source, note, cutoff and historical goalId
      expect(foundInitial.amount).toBe(5000)
      expect(foundInitial.source).toBe('Emergency Fund')
      expect(foundInitial.note).toBe('Pre-existing goal contribution buffer')
      expect(foundInitial.cutoffId).toBe(cutoffId)
      expect(foundInitial.cutoffName).toBe('Current Salary Cycle')
      expect(foundInitial.goalId).toBe(historicalGoalId)
      // Goal name decoration is not present in MVP
      expect(foundInitial).not.toHaveProperty('goalName')

      // 5. Edit that record through the revised Savings form workflow (map to form values, edit, submit to updateSavings)
      // Simulating what SavingsForm does on edit: takes existing savings, populates form, user changes amount and note
      const formEditPayload = {
        amount: 8500, // changed amount
        source: foundInitial.source,
        date: foundInitial.date,
        cutoffId: foundInitial.cutoffId,
        goalId: foundInitial.goalId, // hidden input preserves historical goalId
        note: 'Updated emergency buffer amount', // changed note
      }

      // 6 & 7. Save changes and verify edited values persist
      const updatedResult = await savingsService.updateSavings(foundInitial.id, formEditPayload)
      expect(updatedResult.amount).toBe(8500)
      expect(updatedResult.note).toBe('Updated emergency buffer amount')

      // 8. Verify the historical goalId remains intact after persistence
      expect(updatedResult.goalId).toBe(historicalGoalId)

      const reloadedInDb = await savingsRepository.findById(foundInitial.id)
      expect(reloadedInDb.amount).toBe(8500)
      expect(reloadedInDb.note).toBe('Updated emergency buffer amount')
      expect(reloadedInDb.goalId).toBe(historicalGoalId)

      // 9. Search/filter the record using normal Savings functionality
      const searchMatch = await savingsService.loadSavings({ search: 'emergency buffer' })
      expect(searchMatch.some((r) => r.id === foundInitial.id)).toBe(true)

      const filterByCutoff = await savingsService.loadSavings({ cutoffId })
      expect(filterByCutoff.map((r) => r.id)).toContain(foundInitial.id)

      const filterBySource = await savingsService.loadSavings({ source: 'Emergency Fund' })
      expect(filterBySource).toHaveLength(1)
      expect(filterBySource[0].id).toBe(foundInitial.id)

      // 10. Verify Savings totals and Cashflow reflect the edited amount exactly
      // Total savings for current cutoff = 8500 (edited record) + 2500 (other record) = 11000
      const kpis = await savingsService.loadSavingsKpis()
      expect(kpis.totalSavings).toBe(11000)
      expect(kpis.savingsRecords).toBe(2)

      const cashflowResult = await cashflowService.calculateCashflowForCutoff(cutoffId)
      expect(cashflowResult.hasCurrentCutoff).toBe(true)
      expect(cashflowResult.cashflow.totalSavings).toBe(11000)
      // Remaining Cash = 50000 (actualIncome) - 0 (expenses) - 11000 (totalSavings) = 39000
      expect(cashflowResult.cashflow.remainingCash).toBe(39000)

      // 11. Verify no Goal repository read was required during savings loading
      expect(goalFindAllSpy).not.toHaveBeenCalled()
      goalFindAllSpy.mockRestore()

      // 12. Verify no other savings records were altered
      const otherSavingsReloaded = await savingsRepository.findById(otherSavingsId)
      expect(otherSavingsReloaded.amount).toBe(2500)
      expect(otherSavingsReloaded.source).toBe('Retirement')
      expect(otherSavingsReloaded.note).toBe('Untouched other record')
      expect(otherSavingsReloaded.goalId).toBeNull()
    } finally {
      await clearDatabase()
    }
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

  it('renders SavingsForm in edit mode preserving historical goalId in hidden input without goal controls', () => {
    const historicalSavings = {
      id: 42,
      amount: 5000,
      source: 'Emergency Fund',
      date: '2026-06-15',
      cutoffId: 1,
      goalId: 90210,
      note: 'Pre-existing goal contribution buffer',
    }

    const markup = renderToStaticMarkup(
      <SavingsForm
        editingSavings={historicalSavings}
        salaryCutoffs={[{ id: 1, name: 'Current Salary Cycle' }]}
        onCancel={() => {}}
        onSubmit={() => {}}
      />
    )

    // 1. Existing record loads for editing
    expect(markup).toContain('Edit Savings')
    expect(markup).toContain('Save Changes')

    // 2. Form initializes historical goalId in hidden input
    expect(markup).toMatch(/<input[^>]*type="hidden"[^>]*name="goalId"[^>]*value="90210"/)

    // 3. Amount and note fields initialized with historical record
    expect(markup).toContain('5000')
    expect(markup).toContain('Pre-existing goal contribution buffer')

    // 4. No Goal management controls become visible
    expect(markup).not.toContain('Savings Goal')
    expect(markup).not.toContain('Add Goal')
    expect(markup).not.toContain('Create Goal')
    expect(markup).not.toContain('Goal Progress')
  })
})
