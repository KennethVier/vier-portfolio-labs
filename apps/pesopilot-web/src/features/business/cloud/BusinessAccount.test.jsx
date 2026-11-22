// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { AccessContext } from './access.js'
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({ useAutomaticBusinessBackup() {} }))
vi.mock('../components/MorningStockCheck.jsx', () => ({ MorningStockCheck: () => null }))
let container, root, logout
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  logout = vi.fn()
  await act(async () =>
    root.render(
      <MemoryRouter>
        <AccessContext.Provider
          value={{
            profile: { id: 'owner', email: 'business@example.test', role: 'admin' },
            logout,
          }}
        >
          <BusinessShell>
            <p>Content</p>
          </BusinessShell>
        </AccessContext.Provider>
      </MemoryRouter>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
it('keeps identity and sign-out inside a compact upper-right disclosure', async () => {
  const trigger = container.querySelector('.business-account-trigger')
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(container.querySelector('.business-signout')).toBeNull()
  expect(container.querySelector('.business-account').className).not.toContain('w-full')
  await act(async () => trigger.click())
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  const panel = container.querySelector('#' + CSS.escape(trigger.getAttribute('aria-controls')))
  expect(panel.textContent).toContain('business@example.test')
  expect(panel.textContent).toContain('admin')
  await act(async () => panel.querySelector('.business-signout').click())
  expect(logout).toHaveBeenCalledOnce()
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})
it('closes on Escape and restores focus to its trigger', async () => {
  const trigger = container.querySelector('.business-account-trigger')
  await act(async () => trigger.click())
  container.querySelector('.business-signout').focus()
  await act(async () =>
    container
      .querySelector('.business-account')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
  )
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger)
})
it('dismisses on outside pointer or focus while preserving menu interactions', async () => {
  const trigger = container.querySelector('.business-account-trigger')
  await act(async () => trigger.click())
  await act(async () =>
    container
      .querySelector('.business-account-panel')
      .dispatchEvent(new Event('pointerdown', { bubbles: true })),
  )
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  await act(async () => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })))
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  await act(async () => trigger.click())
  await act(async () => container.querySelector('nav a').focus())
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})
