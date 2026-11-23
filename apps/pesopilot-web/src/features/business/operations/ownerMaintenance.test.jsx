// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { OwnerMaintenancePage } from './OwnerMaintenancePage.jsx'
import { ownerMaintenanceAllowed } from './ownerMaintenance.js'
import { useBranchWorkspace } from './useBranchWorkspace.js'
import { prepareLegacyImport, importLegacy } from './legacyMigration.js'
vi.mock('./useBranchWorkspace.js', () => ({ useBranchWorkspace: vi.fn() }))
vi.mock('./legacyMigration.js', () => ({
  prepareLegacyImport: vi.fn(),
  importLegacy: vi.fn(),
}))
vi.mock('../cloud/client.ts', () => ({ db: {} }))
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({
  useAutomaticBusinessBackup() {},
}))
let root, container
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  container?.remove()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})
it('allows maintenance only with explicit development opt-in and Admin role', () => {
  const admin = { role: 'admin' }
  expect(
    ownerMaintenanceAllowed(admin, { development: false, enabled: true }),
  ).toBe(false)
  expect(
    ownerMaintenanceAllowed(admin, { development: true, enabled: false }),
  ).toBe(false)
  expect(
    ownerMaintenanceAllowed(
      { role: 'staff' },
      { development: true, enabled: true },
    ),
  ).toBe(false)
  expect(
    ownerMaintenanceAllowed(admin, { development: true, enabled: true }),
  ).toBe(true)
})
it('previews a selected backup without any import, then requires a separate explicit write confirmation', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  vi.stubEnv('VITE_BUSINESS_OWNER_MAINTENANCE', 'true')
  useBranchWorkspace.mockReturnValue({
    profile: { id: 'owner', role: 'admin' },
    branches: [{ id: 'rlm-pesopilot-branch-test', name: 'Synthetic branch' }],
    isLoading: false,
    error: null,
  })
  prepareLegacyImport.mockReturnValue({
    counts: { products: 1, sales: 2, movements: 3 },
  })
  importLegacy.mockResolvedValue({ duplicate: false })
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter>
        <OwnerMaintenancePage />
      </MemoryRouter>,
    ),
  )
  const select = container.querySelector('select')
  select.value = 'rlm-pesopilot-branch-test'
  const file = container.querySelector('[type=file]')
  Object.defineProperty(file, 'files', {
    value: [new File(['{}'], 'synthetic.json', { type: 'application/json' })],
  })
  // Happy DOM's FormData file extraction does not use the files property.
  const get = vi
    .spyOn(FormData.prototype, 'get')
    .mockImplementation((name) =>
      name === 'branch' ? select.value : { text: async () => '{}' },
    )
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  get.mockRestore()
  expect(prepareLegacyImport).toHaveBeenCalledWith({}, select.value)
  expect(importLegacy).not.toHaveBeenCalled()
  const confirm = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Confirm migration (writes records)',
  )
  expect(confirm.disabled).toBe(true)
  await act(async () => container.querySelector('[type=checkbox]').click())
  expect(importLegacy).not.toHaveBeenCalled()
  await act(async () => confirm.click())
  expect(importLegacy).toHaveBeenCalledTimes(1)
})
