// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BusinessAuditPage } from './BusinessAuditPage.jsx'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from '../services/businessService.js'
import { dailyAuditService } from '../services/dailyAuditService.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let container
let root
beforeEach(async () => {
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  localStorage.clear()
})
async function settle(check) {
  let failure
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)) })
    try { check(); return } catch (error) { failure = error }
  }
  throw failure
}
const render = () => act(async () => root.render(<MemoryRouter><BusinessAuditPage /></MemoryRouter>))

it('renders grouped read-only financial columns and a distinct GCash total from IndexedDB', async () => {
  const product = await businessService.addProduct({ name: 'Solo', inventoryPoolName: 'Roll-On', pricePesos: '199', openingStock: 10 })
  const variant = await businessService.addProduct({ name: 'Set', pricePesos: '150', inventoryPoolId: product.inventoryPoolId })
  await businessService.completeSale({ requestKey: 'ui-audit', ownerConfirmed: true, paymentMethod: 'gcash', items: [{ productId: variant.id, quantity: 2 }] })
  await render()
  await settle(() => expect(container.querySelector('table')).not.toBeNull())
  expect(container.querySelectorAll('thead th')).toHaveLength(11)
  expect(container.querySelectorAll('tbody')).toHaveLength(1)
  expect(container.querySelector('tfoot').textContent).toContain('300.00')
  expect(container.querySelector('table input')).toBeNull()
  expect(container.textContent).toContain('Roll-On (stock group)')
  expect(container.textContent).toContain('GCash sales')
  expect(container.textContent).toContain('Asia/Manila')
  expect(container.textContent).not.toMatch(/Cash reconciliation is unresolved|7,718|7,741|sample/i)
  expect(container.querySelector('[role="region"]').tabIndex).toBe(0)
})

it('shows empty and error states, supports retry, and hides totals when the read fails', async () => {
  vi.spyOn(dailyAuditService, 'getReport').mockRejectedValueOnce(new Error('Private diagnostic'))
  await render()
  await settle(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
  expect(container.textContent).not.toContain('Private diagnostic')
  expect(container.textContent).not.toContain('Overall sales')
  await act(async () => [...container.querySelectorAll('button')].find((button) => button.textContent === 'Retry audit').click())
  await settle(() => expect(container.textContent).toContain('No inventory or sales recorded for this date'))
  expect(container.querySelector('[role="alert"]')).toBeNull()
})

it('ignores an older asynchronous report when the selected date changes', async () => {
  const empty = await dailyAuditService.getReport('2026-11-06')
  let resolveOld
  vi.spyOn(dailyAuditService, 'getReport')
    .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
    .mockResolvedValueOnce({ ...empty, date: '2026-11-07' })
  await render()
  expect(container.textContent).toContain('Generating daily audit')
  await act(async () => {
    const input = container.querySelector('input[type="date"]')
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, '2026-11-07')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle(() => expect(container.textContent).toContain('No inventory or sales recorded'))
  await act(async () => resolveOld({ ...empty, summary: { ...empty.summary, totalCentavos: 99999900 } }))
  expect(container.querySelector('input[type="date"]').value).toBe('2026-11-07')
  expect(container.textContent).not.toContain('999,999')
})
