// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { BehaviorSubject } from 'rxjs'
import { it, expect, vi } from 'vitest'
import { SharedStockPage } from './SharedStockPage.jsx'
import { db } from './client.ts'
import { businessRepository } from '../repositories/businessRepository.js'
vi.mock('./client.ts', () => ({
  realmId: 'test',
  db: {
    catalogStock: {
      where: () => ({
        equals: () => ({
          toArray: async () => [
            { id: 'one', name: 'Reference scent', quantity: 9, priceCentavos: 9900 },
          ],
        }),
      }),
      put: vi.fn(),
    },
    cloud: { syncState: new BehaviorSubject({ phase: 'initial' }) },
  },
}))
vi.mock('./access.js', () => ({ useBusinessAccess: () => ({ profile: { role: 'staff' } }) }))
vi.mock('../components/BusinessShell.jsx', () => ({
  BusinessShell: ({ children }) => <div>{children}</div>,
}))
vi.mock('../repositories/businessRepository.js', () => ({
  businessRepository: { listProducts: vi.fn() },
}))
it('labels Staff snapshots as a reference preview and reports pending, failed and completed sync states', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  try {
    await act(async () => root.render(<SharedStockPage />))
    for (let n = 0; n < 30 && !container.textContent.includes('Reference scent'); n++)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
    expect(container.textContent).toContain('9 units')
    expect(container.textContent).toContain('Development reference snapshots')
    expect(container.textContent).toContain('inventory ledger')
    for (const [phase, text] of [
      ['not-in-sync', 'pending'],
      ['pushing', 'Sending'],
      ['pulling', 'Receiving'],
      ['offline', 'Offline'],
      ['error', 'failed'],
      ['in-sync', 'completed'],
    ]) {
      await act(async () => db.cloud.syncState.next({ phase }))
      expect(container.querySelector('[role=status]').textContent).toContain(text)
    }
    expect(container.querySelector('form')).toBeNull()
    expect(db.catalogStock.put).not.toHaveBeenCalled()
    expect(businessRepository.listProducts).not.toHaveBeenCalled()
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
