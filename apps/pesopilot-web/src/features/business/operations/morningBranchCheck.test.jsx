// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { MorningStockCheck } from '../components/MorningStockCheck.jsx'
import { businessDb } from '../repositories/businessDb.js'
let root, container
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  container?.remove()
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.clear()
})
it('reads only the assigned branch for the Phase 0 morning reminder and opens Branch Inventory', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-22T08:00:00+08:00'))
  const legacy = vi.spyOn(businessDb, 'transaction')
  const repo = {
    source: vi.fn().mockResolvedValue({
      pools: [{ id: 'pool', name: 'Synthetic Lavender', stockQuantity: 2 }],
      movements: [{ inventoryPoolId: 'pool', delta: 10, afterQuantity: 10 }],
    }),
  }
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MorningStockCheck
                workspace={{
                  branchId: 'A',
                  profile: { id: 'employee' },
                  repo,
                  isLoading: false,
                }}
              />
            }
          />
          <Route
            path="/business/stock"
            element={<p>Assigned branch inventory</p>}
          />
        </Routes>
      </MemoryRouter>,
    ),
  )
  expect(repo.source).toHaveBeenCalled()
  expect(legacy).not.toHaveBeenCalled()
  expect(container.textContent).toContain('Synthetic Lavender · 2 left')
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Receive stock')
      .click(),
  )
  expect(container.textContent).toContain('Assigned branch inventory')
  expect(
    localStorage.getItem('pesopilot.business.morningStockCheck:A:employee'),
  ).toBeTruthy()
  expect(
    localStorage.getItem('pesopilot.business.morningStockCheck'),
  ).toBeNull()
})
