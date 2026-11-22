// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, it, expect, vi } from 'vitest'
import { UsersPage } from './UsersPage.jsx'
import { changeStaff } from './client.ts'
vi.mock('./client.ts', () => ({
  db: {
    members: {
      where: () => ({
        equals: () => ({
          toArray: async () => [
            { id: 'staff', email: 'staff@example.test', roles: ['staff'], accepted: true },
            { id: 'admin', email: 'owner@example.test', roles: ['admin'], accepted: true },
          ],
        }),
      }),
    },
  },
  realmId: 'test',
  changeStaff: vi.fn(),
}))
vi.mock('../components/BusinessShell.jsx', () => ({
  BusinessShell: ({ children }) => <div>{children}</div>,
}))
let root, container
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<UsersPage />)
  })
  for (
    let attempt = 0;
    attempt < 50 && !container.textContent.includes('staff@example.test');
    attempt++
  ) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  }
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
async function email(value) {
  await act(async () => {
    const input = container.querySelector('[name=email]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function submit() {
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
}
it('clears email after synchronized invitation and explains registration is separate', async () => {
  changeStaff.mockResolvedValue(undefined)
  await email('new@example.test')
  await submit()
  expect(changeStaff).toHaveBeenCalledWith(expect.anything(), { email: 'new@example.test' })
  expect(container.querySelector('[name=email]').value).toBe('')
  expect(container.textContent).toContain('Complete owner-side account registration')
  expect(container.textContent).toContain('Owner verification required')
  expect(container.textContent).not.toContain('Active')
})
it('preserves email on a failed invitation', async () => {
  changeStaff.mockRejectedValue(new Error('sync failed'))
  await email('retry@example.test')
  await submit()
  expect(container.querySelector('[name=email]').value).toBe('retry@example.test')
  expect(container.querySelector('[role=alert]').textContent).toContain('sync failed')
})
it('requires confirmation to remove only Staff', async () => {
  const buttons = [...container.querySelectorAll('button')].filter(
    (b) => b.textContent === 'Remove Staff',
  )
  expect(buttons).toHaveLength(1)
  await act(async () => buttons[0].click())
  expect(changeStaff).not.toHaveBeenCalled()
  expect(container.querySelector('[role=dialog]').textContent).toContain('staff@example.test')
  await act(async () =>
    [...container.querySelectorAll('button')].find((b) => b.textContent === 'Cancel').click(),
  )
  expect(changeStaff).not.toHaveBeenCalled()
  await act(async () => buttons[0].click())
  changeStaff.mockResolvedValue(undefined)
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((b) => b.textContent === 'Confirm Remove Staff')
      .click(),
  )
  expect(changeStaff).toHaveBeenCalledWith(expect.anything(), { id: 'staff' })
})
