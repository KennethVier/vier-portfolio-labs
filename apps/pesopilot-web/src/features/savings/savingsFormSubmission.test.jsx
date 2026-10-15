// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { expenseRepository } from '@/lib/db/repositories/expenseRepository.js'
import { incomeRepository } from '@/lib/db/repositories/incomeRepository.js'
import { savingsGoalRepository } from '@/lib/db/repositories/savingsGoalRepository.js'
import { savingsRepository } from '@/lib/db/repositories/savingsRepository.js'
import { cashflowService } from '@/features/cashflow/services/cashflowService.js'
import { savingsService } from './services/savingsService.js'
import { SavingsForm } from './components/SavingsForm.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function setInputValue(element, value) {
  const prototype =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value')
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value)
  } else {
    element.value = value
  }
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('SavingsForm Real Component Submission & goalId Preservation', () => {
  let container
  let root

  beforeEach(async () => {
    await db.open()
    await clearDatabase()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount()
      })
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
    await clearDatabase()
    vi.restoreAllMocks()
  })

  it('renders real SavingsForm, edits amount/note, executes actual submit handler, and preserves historical goalId without Goals repository access', async () => {
    // Ensure Goals repository would throw if called
    const goalFindAllSpy = vi.spyOn(savingsGoalRepository, 'findAll').mockImplementation(() => {
      throw new Error('UNAUTHORIZED_GOAL_READ')
    })

    const today = new Date()
    const formatIso = (d) => d.toISOString().slice(0, 10)
    const startDate = formatIso(new Date(Date.now() - 3 * 86400000))
    const endDate = formatIso(new Date(Date.now() + 10 * 86400000))
    const recordDate = formatIso(today)

    // Seed active salary cutoff spanning today
    const { salaryCutoffRepository } = await import('@/lib/db/repositories/salaryCutoffRepository.js')
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
    await incomeRepository.create({
      amount: 50000,
      source: 'Primary Salary',
      date: recordDate,
      cutoffId,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    })
    await expenseRepository.create({
      amount: 2000,
      merchant: 'Groceries',
      categoryId: 'food',
      paymentMethod: 'Cash',
      date: recordDate,
      cutoffId,
      emotionTag: null,
      note: null,
      source: 'manual',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    })

    // 1. Seed a historical record in DB with non-null goalId (e.g. 90210)
    const historicalGoalId = 90210
    const seeded = await savingsRepository.create({
      amount: 5000,
      source: 'Emergency Fund',
      date: recordDate,
      cutoffId,
      goalId: historicalGoalId,
      note: 'Pre-existing goal contribution buffer',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    })

    // Load the historical record from service
    const loadedList = await savingsService.loadSavings()
    const editingRecord = loadedList.find((r) => r.id === seeded)
    expect(editingRecord).toBeDefined()
    expect(editingRecord.goalId).toBe(historicalGoalId)

    // Track submitted values through the actual onSubmit prop
    let submittedValues = null
    const handleSubmit = vi.fn(async (values) => {
      submittedValues = values
      await savingsService.updateSavings(editingRecord.id, values)
    })

    // 2. Render actual SavingsForm component in edit mode
    await act(async () => {
      root.render(
        <SavingsForm
          editingSavings={editingRecord}
          salaryCutoffs={[]}
          onCancel={() => {}}
          onSubmit={handleSubmit}
        />,
      )
    })

    // Verify 1: The existing record loads for editing
    const heading = container.querySelector('h2')
    expect(heading?.textContent).toBe('Edit Savings')

    // Verify 2: The form initializes the historical goalId correctly in hidden input
    const goalIdInput = container.querySelector('input[name="goalId"]')
    expect(goalIdInput).not.toBeNull()
    expect(goalIdInput?.type).toBe('hidden')
    expect(goalIdInput?.value).toBe(String(historicalGoalId))

    // Verify 10: No Goal management controls become visible
    const textContent = container.textContent || ''
    expect(textContent).not.toContain('Savings Goal')
    expect(textContent).not.toContain('Add Goal')
    expect(textContent).not.toContain('Create Goal')
    expect(textContent).not.toContain('Goal Progress')

    // 3. User edits amount and note via real DOM input events
    const amountInput = container.querySelector('#savings-amount')
    const noteTextarea = container.querySelector('textarea[name="note"]')
    expect(amountInput).not.toBeNull()
    expect(noteTextarea).not.toBeNull()

    await act(async () => {
      setInputValue(amountInput, '8500')
      setInputValue(noteTextarea, 'Updated emergency buffer amount')
    })

    // 4. Actual form submit handler executes
    const form = container.querySelector('form')
    expect(form).not.toBeNull()

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await vi.waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1))
      await handleSubmit.mock.results[0].value
    })

    // 5. Verify the actual submit handler executed
    expect(handleSubmit).toHaveBeenCalledTimes(1)
    expect(submittedValues).not.toBeNull()

    // Verify: submitted values preserve the historical goalId as number
    expect(submittedValues.goalId).toBe(historicalGoalId)
    expect(submittedValues.amount).toBe(8500)
    expect(submittedValues.note).toBe('Updated emergency buffer amount')

    // 6 & 7. The service persists updated amount and note, while goalId remains unchanged
    const reloaded = await savingsRepository.findById(editingRecord.id)
    expect(reloaded.amount).toBe(8500)
    expect(reloaded.note).toBe('Updated emergency buffer amount')
    expect(reloaded.goalId).toBe(historicalGoalId)

    // 8. Normal Savings totals reflect updated amount
    const kpis = await savingsService.loadSavingsKpis()
    expect(kpis.totalSavings).toBe(8500)
    expect(kpis.savingsRecords).toBe(1)

    const cashflowResult = await cashflowService.calculateCashflowForCutoff(cutoffId)
    expect(cashflowResult.hasCurrentCutoff).toBe(true)
    expect(cashflowResult.cashflow).toMatchObject({
      actualIncome: 50000,
      totalExpenses: 2000,
      totalSavings: 8500,
      remainingCash: 39500,
    })
    expect(cashflowResult.cashflow.remainingCash).toBe(
      cashflowResult.cashflow.actualIncome -
      cashflowResult.cashflow.totalExpenses -
      cashflowResult.cashflow.totalSavings,
    )

    // 9. No Goals repository access occurred
    expect(goalFindAllSpy).not.toHaveBeenCalled()
  })
})
