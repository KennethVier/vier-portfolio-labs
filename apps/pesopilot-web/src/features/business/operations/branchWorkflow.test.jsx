// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { BranchOperationsPage } from './BranchOperationsPage.jsx'
import { AccessContext } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { seed } from './branchTestFixture.js'
import { createBranchRepository } from './branchRepository.js'
vi.mock('../cloud/client.ts', async () => {
  const { fixture } = await import('./branchTestFixture.js')
  const { BehaviorSubject } = await import('rxjs')
  const database = fixture('branch-react-vertical')
  database.cloud.syncState = new BehaviorSubject({ phase: 'in-sync' })
  database.cloud.invites = new BehaviorSubject([])
  return { db: database }
})
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({
  useAutomaticBusinessBackup() {},
}))

it('uses the real operational hook and repository for Staff receive → POS sale → audit → Admin visibility', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  await seed(db)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  async function render(role, screen) {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <AccessContext.Provider
            value={{
              profile: { id: role === 'staff' ? 'employee' : 'owner', role },
              logout: vi.fn(),
            }}
          >
            <BranchOperationsPage screen={screen} />
          </AccessContext.Provider>
        </MemoryRouter>,
      ),
    )
  }
  async function wait(check) {
    let failure
    for (let n = 0; n < 150; n++) {
      await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
      try {
        check()
        return
      } catch (error) {
        failure = error
      }
    }
    throw failure
  }
  async function button(label) {
    await act(async () =>
      [...container.querySelectorAll('button')]
        .find((element) => element.textContent === label)
        .click(),
    )
  }
  try {
    await render('staff', 'stock')
    await wait(() =>
      expect(
        container.querySelector('[name=productId] option[value=lavender]'),
      ).not.toBeNull(),
    )
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
    await change('[name=productId]', 'lavender')
    await change('[name=quantity]', '10')
    await change('[name=reason]', 'Synthetic supplier receipt')
    await act(async () =>
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      ),
    )
    await button('Confirm stock change')
    await wait(() => expect(container.textContent).toContain('10 in branch'))
    await render('staff', 'home')
    await wait(() =>
      expect(container.querySelector('[data-product-card]')).not.toBeNull(),
    )
    await act(async () =>
      container.querySelector('[data-product-card]').click(),
    )
    await wait(() =>
      expect(
        container.querySelector('[aria-label="Sale quantity"]'),
      ).not.toBeNull(),
    )
    await act(async () => {
      const input = container.querySelector('[aria-label="Sale quantity"]')
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set.call(input, '2')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await button('Record Sale')
    await button('Confirm Completed Sale')
    await wait(() => expect(container.textContent).toContain('Sale recorded.'))
    expect(
      (
        await createBranchRepository(db, {
          userId: 'employee',
          branchId: 'A',
        }).listProducts()
      )[0].stockQuantity,
    ).toBe(8)
    await render('staff', 'audit')
    await wait(() =>
      expect(container.textContent).toContain('Remaining inventory'),
    )
    expect(container.textContent).toContain('198.00')
    await render('admin', 'home')
    await wait(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    await wait(() => expect(container.textContent).toContain('198.00'))
    expect(
      [...container.querySelectorAll('nav a')].map((a) => a.textContent),
    ).not.toContain('POS')
    expect(await db.branchTransactions.count()).toBe(2)
  } finally {
    await act(async () => root.unmount())
    container.remove()
    await db.delete()
  }
})
