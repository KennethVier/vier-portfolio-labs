// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HeaderProvider } from '@/components/layout/HeaderContent.jsx'
import { clearDatabase } from '@/lib/db/devTools.js'
import { db } from '@/lib/db/dexie.js'
import { APPROVED_STORE_NAMES } from '@/lib/db/schema.js'
import { seedDatabase } from '@/lib/db/seed.js'

import { useSettingsStore } from '@/app/settingsStore.js'
import { useSettings } from '../hooks/useSettings.js'
import { normalizeSettings, settingsService } from '../services/settingsService.js'

import { SettingsPage } from './SettingsPage.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function setInputValue(element, value) {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value)
  } else {
    element.value = value
  }
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

const syncExceptions = [
  ['Error', new Error('sync failed')], ['null', null], ['undefined', undefined],
  ['string', 'sync failed'], ['object', { reason: 'sync failed' }], ['number', 42],
]

async function snapshotAllStores() {
  const stores = {}
  await act(async () => {
    for (const name of APPROVED_STORE_NAMES) {
      stores[name] = await db.table(name).toArray()
    }
  })
  return stores
}

describe('SettingsPage Finding 4 — Import Confirmation Summary', () => {
  let container
  let root

  beforeEach(async () => {
    await db.open()
    await clearDatabase()
    await seedDatabase()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root.unmount()
      })
    }
    container?.remove()
    await clearDatabase()
    db.close()
  })

  it('displays exactly 13 recognized stores in confirmation modal when backup contains 13 recognized stores and 1 unknown store', async () => {
    // 1. Render SettingsPage within providers
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 2. Prepare backup with 13 approved stores + 1 unknown store (total 14 stores)
    const stores = {}
    APPROVED_STORE_NAMES.forEach((storeName) => {
      stores[storeName] = []
    })
    stores.future_unknown_store = [{ id: 1, test: true }]

    expect(Object.keys(stores)).toHaveLength(14)

    const backupPayload = {
      app: 'PesoPilot',
      version: 1,
      exportedAt: '2026-06-25T12:00:00.000Z',
      stores,
    }

    const file = new File([JSON.stringify(backupPayload)], 'pesopilot-backup.json', {
      type: 'application/json',
    })

    // 3. Find file input and trigger change
    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // 4. Verify confirmation modal description: must say "across 13 stores", NOT 14
    const modalText = document.body.textContent
    expect(modalText).toContain('across 13 stores')
    expect(modalText).not.toContain('across 14 stores')
  })

  it.each(syncExceptions)('displays synchronization warning when Zustand throws %s after commit', async (_label, thrown) => {
    // 1. Seed database with initial expense
    await db.expenses.put({
      id: 1,
      amount: 250,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Pre-Import Expense',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    // 2. Render SettingsPage
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 3. Prepare complete backup with replacement expense
    const stores = await snapshotAllStores()
    stores.settings = stores.settings.map(normalizeSettings)
    stores.expenses = [
      {
        id: 501,
        amount: 888,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-02',
        merchant: 'Successfully Committed Replacement',
        paymentMethod: 'Cash',
        source: 'manual',
      },
    ]

    const backupPayload = {
      app: 'PesoPilot',
      version: 1,
      exportedAt: '2026-06-25T12:00:00.000Z',
      stores,
    }

    const file = new File([JSON.stringify(backupPayload)], 'pesopilot-backup.json', {
      type: 'application/json',
    })

    const fileInput = container.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Modal is open
    expect(document.body.textContent).toContain('Import PesoPilot Backup')

    // Inject post-commit failure into useSettingsStore.getState().setSettings
    const storeState = (await import('@/app/settingsStore.js')).useSettingsStore.getState()
    const setSettingsSpy = vi.spyOn(storeState, 'setSettings').mockImplementationOnce(() => {
      throw thrown
    })

    try {
      // Type 'IMPORT' into confirmation phrase input
      const phraseInput = document.querySelector('input[autoComplete="off"]')
      expect(phraseInput).not.toBeNull()

      await act(async () => {
        setInputValue(phraseInput, 'IMPORT')
      })

      // Click Confirm IMPORT
      const confirmButton = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Confirm IMPORT'),
      )
      expect(confirmButton).not.toBeNull()
      expect(confirmButton.disabled).toBe(false)

      await act(async () => {
        confirmButton.click()
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    } finally {
      setSettingsSpy.mockRestore()
    }

    // Modal must be closed
    expect(document.body.querySelector('input[autoComplete="off"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Import PesoPilot Backup')

    // Assert IndexedDB replacement committed successfully
    const expenses = await db.expenses.toArray()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBe(501)
    expect(expenses[0].merchant).toBe('Successfully Committed Replacement')
    expect(expenses[0].amount).toBe(888)

    // Assert UI notification: warning badge is visible, NOT a critical failure error state
    expect(document.body.textContent).toContain(
      'Backup imported successfully, but some preferences could not be applied.',
    )
    expect(document.body.textContent).not.toContain('Settings action failed')
    expect(await snapshotAllStores()).toEqual(stores)
  })

  it('displays a warning and closes modal when selective post-commit settings read fails', async () => {
    // 1. Seed database with initial expense
    await db.expenses.put({
      id: 1,
      amount: 250,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Pre-Import Expense',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    // 2. Render SettingsPage
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 3. Prepare complete backup with replacement expense
    const stores = await snapshotAllStores()
    stores.settings = stores.settings.map(normalizeSettings)
    stores.expenses = [
      {
        id: 501,
        amount: 888,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-02',
        merchant: 'Successfully Committed Replacement',
        paymentMethod: 'Cash',
        source: 'manual',
      },
    ]

    const backupPayload = {
      app: 'PesoPilot',
      version: 1,
      exportedAt: '2026-06-25T12:00:00.000Z',
      stores,
    }

    const file = new File([JSON.stringify(backupPayload)], 'pesopilot-backup.json', {
      type: 'application/json',
    })

    const fileInput = container.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Modal is open
    expect(document.body.textContent).toContain('Import PesoPilot Backup')

    // The page requests full imports; route the real service to selective scope
    // to exercise its read-failure result through the actual hook and UI.
    const before = await snapshotAllStores()
    const realImport = settingsService.importBackupData
    const importSpy = vi.spyOn(settingsService, 'importBackupData').mockImplementation((backup) =>
      realImport(backup, { mode: 'selective', selectedStores: ['expenses'] }),
    )
    const readSpy = vi.spyOn(db.settings, 'get').mockImplementationOnce(async () => {
      expect(await db.expenses.toArray()).toEqual(stores.expenses)
      throw new Error('Post-commit settings read failed')
    })

    try {
      // Type 'IMPORT' into confirmation phrase input
      const phraseInput = document.querySelector('input[autoComplete="off"]')
      expect(phraseInput).not.toBeNull()

      await act(async () => {
        setInputValue(phraseInput, 'IMPORT')
      })

      // Click Confirm IMPORT
      const confirmButton = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Confirm IMPORT'),
      )
      expect(confirmButton).not.toBeNull()
      expect(confirmButton.disabled).toBe(false)

      await act(async () => {
        confirmButton.click()
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    } finally {
      importSpy.mockRestore()
      readSpy.mockRestore()
    }

    // Modal must be closed
    expect(document.body.querySelector('input[autoComplete="off"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Import PesoPilot Backup')

    // Assert IndexedDB replacement committed successfully
    const expenses = await db.expenses.toArray()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBe(501)
    expect(expenses[0].merchant).toBe('Successfully Committed Replacement')
    expect(expenses[0].amount).toBe(888)

    // Assert UI notification: warning badge is visible, NOT a critical failure error state
    expect(document.body.textContent).toContain(
      'Backup imported successfully, but some preferences could not be applied.',
    )
    expect(document.body.textContent).not.toContain('Settings action failed')
    expect(await snapshotAllStores()).toEqual({ ...before, expenses: stores.expenses })
  })

  it.each(syncExceptions)('displays synchronization warning when applyPreferences throws %s after commit', async (_label, thrown) => {
    // 1. Seed database with initial expense
    await db.expenses.put({
      id: 1,
      amount: 400,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Initial Pre-Import Expense',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    // 2. Render SettingsPage
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 3. Prepare complete backup with replacement expense
    const stores = await snapshotAllStores()
    stores.settings = stores.settings.map(normalizeSettings)
    stores.expenses = [
      {
        id: 601,
        amount: 750,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-03',
        merchant: 'Preference Failure Replacement',
        paymentMethod: 'Cash',
        source: 'manual',
      },
    ]

    const file = new File(
      [
        JSON.stringify({
          app: 'PesoPilot',
          version: 1,
          stores,
        }),
      ],
      'pref-fail-backup.json',
      { type: 'application/json' },
    )

    const fileInput = container.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const prefSpy = vi
      .spyOn((await import('../services/settingsService.js')).settingsService, 'applyThemePreference')
      .mockImplementationOnce(() => {
        throw thrown
      })

    try {
      const phraseInput = document.querySelector('input[autoComplete="off"]')
      await act(async () => {
        setInputValue(phraseInput, 'IMPORT')
      })

      const confirmButton = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Confirm IMPORT'),
      )

      await act(async () => {
        confirmButton.click()
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
    } finally {
      prefSpy.mockRestore()
    }

    // Modal must be closed
    expect(document.body.querySelector('input[autoComplete="off"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Import PesoPilot Backup')

    // Database replacement committed successfully
    const expenses = await db.expenses.toArray()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].id).toBe(601)
    expect(expenses[0].merchant).toBe('Preference Failure Replacement')
    expect(expenses[0].amount).toBe(750)

    // Warning badge visible, no critical error
    expect(document.body.textContent).toContain(
      'Backup imported successfully, but some preferences could not be applied.',
    )
    expect(document.body.textContent).not.toContain('Settings action failed')
    expect(await snapshotAllStores()).toEqual(stores)
  })

  it('displays critical error banner and preserves database when pre-commit validation fails', async () => {
    // 1. Seed database with initial expense
    await db.expenses.put({
      id: 1,
      amount: 300,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Guarded Original Expense',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    // 2. Render SettingsPage
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 3. Prepare invalid backup (wrong application identity)
    const invalidBackup = {
      app: 'InvalidApp',
      version: 1,
      stores: {},
    }

    const file = new File([JSON.stringify(invalidBackup)], 'invalid-backup.json', {
      type: 'application/json',
    })

    const fileInput = container.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    // Modal should NOT open
    expect(document.body.querySelector('input[autoComplete="off"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Import PesoPilot Backup')

    // UI displays critical error state
    expect(document.body.textContent).toContain('Settings action failed')
    expect(document.body.textContent).toContain(
      'Application must be "PesoPilot"',
    )

    // Database remains 100% untouched
    const expenses = await db.expenses.toArray()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Guarded Original Expense')
  })

  it('displays success badge and replaces data cleanly on complete successful import', async () => {
    // 1. Seed initial data
    await db.expenses.put({
      id: 1,
      amount: 150,
      categoryId: 'food',
      cutoffId: 1,
      date: '2026-06-01',
      merchant: 'Old Expense To Clear',
      paymentMethod: 'Cash',
      source: 'manual',
    })

    // 2. Render SettingsPage
    await act(async () => {
      root.render(
        <MemoryRouter>
          <HeaderProvider>
            <SettingsPage />
          </HeaderProvider>
        </MemoryRouter>,
      )
    })

    // 3. Prepare valid full backup
    const stores = {}
    APPROVED_STORE_NAMES.forEach((storeName) => {
      stores[storeName] = []
    })
    stores.expenses = [
      {
        id: 701,
        amount: 550,
        categoryId: 'food',
        cutoffId: 1,
        date: '2026-06-05',
        merchant: 'Cleanly Replaced Expense',
        paymentMethod: 'Cash',
        source: 'manual',
      },
    ]

    const file = new File(
      [
        JSON.stringify({
          app: 'PesoPilot',
          version: 1,
          stores,
        }),
      ],
      'valid-backup.json',
      { type: 'application/json' },
    )

    const fileInput = container.querySelector('input[type="file"]')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true,
    })

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const phraseInput = document.querySelector('input[autoComplete="off"]')
    await act(async () => {
      setInputValue(phraseInput, 'IMPORT')
    })

    const confirmButton = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent.includes('Confirm IMPORT'),
    )
    await act(async () => {
      confirmButton.click()
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    // Modal closed
    expect(document.body.querySelector('input[autoComplete="off"]')).toBeNull()
    expect(document.body.textContent).not.toContain('Import PesoPilot Backup')

    // Assert UI notification: success message
    expect(document.body.textContent).toContain(
      'Backup imported. Local data has been replaced.',
    )
    expect(document.body.textContent).not.toContain('Settings action failed')

    // Assert database updated
    const expenses = await db.expenses.toArray()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].merchant).toBe('Cleanly Replaced Expense')
  })

  it('returns committed success and warning from real hook when settings cannot be read', async () => {
    let hook
    function Harness() {
      hook = useSettings()
      return <span>{hook.actionState.tone}:{hook.actionState.message}</span>
    }
    await act(async () => { root.render(<Harness />) })
    const previousSettings = hook.settings
    const before = await snapshotAllStores()
    const replacement = { id: 999, amount: 200, merchant: 'Hook committed' }
    const spy = vi.spyOn(db.settings, 'get').mockImplementationOnce(() => { throw null })
    const storeSpy = vi.spyOn(useSettingsStore.getState(), 'setSettings')
    try {
      let result
      await act(async () => {
        result = await hook.importData({ app: 'PesoPilot', version: 1, stores: { expenses: [replacement] } }, {
          mode: 'selective', selectedStores: ['expenses'],
        })
      })
      expect(result).toMatchObject({ committed: true, importedStores: ['expenses'], settings: null })
      expect(result.syncWarning).toBeTruthy()
      expect(hook.error).toBe('')
      expect(hook.isSaving).toBe(false)
      expect(hook.settings).toEqual(previousSettings)
      expect(hook.actionState.tone).toBe('warning')
      expect(container.textContent).toContain('Backup imported successfully')
      expect(storeSpy).not.toHaveBeenCalled()
      expect(await snapshotAllStores()).toEqual({ ...before, expenses: [replacement] })
    } finally {
      spy.mockRestore()
      storeSpy.mockRestore()
    }
  })

})
