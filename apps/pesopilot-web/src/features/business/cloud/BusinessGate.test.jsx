// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { BusinessGate } from './BusinessGate.jsx'
import { useBusinessAccess } from './access.js'
import { db, watchAccount } from './client.ts'
vi.mock('./client.ts', () => ({
  db: { cloud: { login: vi.fn(), logout: vi.fn(), sync: vi.fn().mockResolvedValue(undefined) } },
  watchAccount: vi.fn(),
}))
let root, container, notify
function Protected() {
  const access = useBusinessAccess()
  return <button onClick={access.logout}>Signed in as {access.profile.role}</button>
}
async function render(path = '/business') {
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/business" element={<BusinessGate />}>
            <Route index element={<Protected />} />
            <Route path="users" element={<p>Manage users</p>} />
            <Route path="password" element={null} />
          </Route>
        </Routes>
      </MemoryRouter>,
    ),
  )
}
async function emit(state) {
  await act(async () => notify(state))
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.resetAllMocks()
  watchAccount.mockImplementation((_db, cb) => {
    notify = cb
    return () => {}
  })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
it('requires login for a direct Admin URL and restores only an enabled profile', async () => {
  await render('/business/users')
  await emit({})
  expect(container.textContent).toContain('Sign in')
  expect(container.textContent).not.toContain('Manage users')
  container.querySelector('[name=email]').value = 'admin@example.test'
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(db.cloud.login).toHaveBeenCalledWith({
    email: 'admin@example.test',
    grant_type: 'otp',
    intent: 'login',
  })
  await emit({ profile: { id: 'one', role: 'admin', enabled: true } })
  expect(container.textContent).toContain('Manage users')
})
it('redirects restored Staff away from Admin screens and removes POS after logout', async () => {
  await render('/business/users')
  await emit({ profile: { id: 'one', role: 'staff', enabled: true } })
  expect(container.textContent).toContain('Signed in as staff')
  await act(async () => container.querySelector('button').click())
  expect(db.cloud.logout).toHaveBeenCalledOnce()
  await emit({})
  expect(container.textContent).toContain('Sign in')
})
it('locks the page when profile verification fails', async () => {
  await render()
  await emit({ error: 'Active profile required' })
  expect(container.querySelector('[role=alert]').textContent).toContain('Active profile required')
  expect(container.textContent).not.toContain('Signed in as')
})

it('keeps an unregistered OTP identity outside Business without attempting registration', async () => {
  await render('/business/users')
  await emit({})
  db.cloud.login.mockRejectedValueOnce(
    Object.assign(new Error('This user is not registered.'), { code: 'USER_NOT_REGISTERED' }),
  )
  container.querySelector('[name=email]').value = ' Unknown@example.test '.trim()
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(db.cloud.login.mock.calls).toEqual([
    [{ email: 'unknown@example.test', grant_type: 'otp', intent: 'login' }],
  ])
  expect(container.querySelector('[role=alert]').textContent).toContain('application user')
  expect(container.textContent).not.toContain('Manage users')
})

it('shows first-pull loading and sync failures without displaying an access denial', async () => {
  await render()
  await emit({ loading: true, synchronizing: true })
  expect(container.textContent).toContain('Synchronizing Business access')
  expect(container.textContent).not.toContain('Ask the Admin')
  await emit({ error: 'Business access synchronization failed.' })
  expect(container.querySelector('[role=alert]').textContent).toContain('synchronization failed')
  expect(container.textContent).not.toContain('Ask the Admin')
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((b) => b.textContent === 'Retry access check')
      .click(),
  )
  expect(watchAccount).toHaveBeenCalledTimes(2)
})
