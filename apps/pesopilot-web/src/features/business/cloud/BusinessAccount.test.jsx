// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { it, expect, vi } from 'vitest'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { AccessContext } from './access.js'
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({ useAutomaticBusinessBackup() {} }))
vi.mock('../components/MorningStockCheck.jsx', () => ({ MorningStockCheck: () => null }))
it('renders a labeled account and sign-out button with explicit contrasting styles', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container),
    logout = vi.fn()
  try {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <AccessContext.Provider
            value={{ profile: { id: 'owner', email: 'business@example.test', role: 'admin' }, logout }}
          >
            <BusinessShell>
              <p>Content</p>
            </BusinessShell>
          </AccessContext.Provider>
        </MemoryRouter>,
      ),
    )
    const account = container.querySelector('.business-account')
    expect(account.textContent).toContain('business@example.test')
    const button = account.querySelector('.business-signout')
    expect(button.textContent).toBe('Sign out')
    await act(async () => button.click())
    expect(logout).toHaveBeenCalledOnce()
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
