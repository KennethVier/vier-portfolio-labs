// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BranchOperationsPage } from './BranchOperationsPage.jsx'
import { useBranchWorkspace } from './useBranchWorkspace.js'
import { AccessContext } from '../cloud/access.js'
vi.mock('./useBranchWorkspace.js', () => ({ useBranchWorkspace: vi.fn() }))
vi.mock('../hooks/useWorkspaceRoute.js', () => ({ useWorkspaceRoute() {} }))
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({
  useAutomaticBusinessBackup() {},
}))
vi.mock('../cloud/client.ts', () => ({ db: null }))
vi.mock('../pages/BusinessDashboardPage.jsx', () => ({
  BusinessPosPage: ({ workspace }) => (
    <p>Branch POS: {workspace.products[0]?.stockQuantity} available</p>
  ),
}))
let container, root, work
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  work = {
    profile: { id: 'owner', role: 'admin' },
    branchId: '',
    branches: [],
    overviews: [],
    members: [],
    invites: [],
    products: [],
    catalog: [],
    conflicts: [],
    sync: { phase: 'in-sync' },
    service: {},
    repo: {},
    refresh: vi.fn(),
  }
  useBranchWorkspace.mockImplementation(() => work)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
async function render(screen = 'home') {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <AccessContext.Provider
          value={{ profile: work.profile, logout: vi.fn() }}
        >
          <BranchOperationsPage screen={screen} />
        </AccessContext.Provider>
      </MemoryRouter>,
    ),
  )
}
it('lands Admin on honest Overview with no POS and provides owner navigation', async () => {
  await render()
  expect(container.textContent).toContain('Business Overview')
  expect(container.textContent).toContain('No branches yet')
  expect(container.textContent).not.toContain('Branch POS')
  const links = [...container.querySelectorAll('nav a')].map(
    (a) => a.textContent,
  )
  expect(links).toContain('Branches and Users')
  expect(links).not.toContain('POS')
  expect(links).toContain('All Sales')
})
it('gates Staff before branch acceptance and opens branch POS with operational stock afterward', async () => {
  work.profile = { id: 'staff', role: 'staff' }
  await render()
  expect(container.textContent).toContain('assign you to one branch')
  expect(container.textContent).not.toContain('Branch POS:')
  work.branchId = 'A'
  work.branches = [{ id: 'A', name: 'Branch A' }]
  work.products = [{ id: 'p', stockQuantity: 10 }]
  await render()
  expect(container.textContent).toContain('Branch POS: 10 available')
})
it('requires a stock reason, clears success and preserves failed receipt inputs', async () => {
  work.profile = { id: 'staff', role: 'staff' }
  work.branchId = 'A'
  work.branches = [{ id: 'A' }]
  work.products = [
    {
      id: 'lavender',
      name: 'Lavender',
      stockQuantity: 0,
      unitPriceCentavos: 9900,
    },
  ]
  work.service.adjustStock = vi
    .fn()
    .mockRejectedValueOnce(new Error('disk full'))
    .mockResolvedValueOnce({ duplicate: false })
  await render('stock')
  const form = container.querySelector('form')
  async function change(selector, value) {
    await act(async () => {
      const element = form.querySelector(selector)
      const prototype =
        element.tagName === 'SELECT'
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(
        element,
        value,
      )
      element.dispatchEvent(
        new Event(element.tagName === 'SELECT' ? 'change' : 'input', {
          bubbles: true,
        }),
      )
    })
  }
  async function click(label) {
    await act(async () =>
      [...container.querySelectorAll('button')]
        .find((button) => button.textContent === label)
        .click(),
    )
  }
  await change('[name=productId]', 'lavender')
  await change('[name=quantity]', '10')
  await change('[name=reason]', 'Checked receipt')
  expect(form.querySelector('[name=reason]').required).toBe(true)
  await act(async () =>
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
  expect(work.service.adjustStock).not.toHaveBeenCalled()
  await click('Confirm stock change')
  expect(form.querySelector('[name=quantity]').value).toBe('10')
  expect(container.textContent).toContain('disk full')
  await click('Confirm stock change')
  expect(work.service.adjustStock.mock.calls[0][0].requestKey).toBe(
    work.service.adjustStock.mock.calls[1][0].requestKey,
  )
  expect(form.querySelector('[name=quantity]').value).toBe('')
  expect(container.textContent).toContain('Saved on this device')
})
