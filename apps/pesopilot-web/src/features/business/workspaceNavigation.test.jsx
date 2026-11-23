// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/dexie.js'
import { businessDb } from './repositories/businessDb.js'
import {
  getActiveWorkspace,
  setActiveWorkspace,
} from './services/workspacePreference.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { router } from '@/app/router.jsx'

// Keep the real router, layouts, onboarding and Business page. Personal feature
// calculations have their own regression suite; a small page makes navigation observable.
vi.mock('@/features/dashboard/pages/DashboardPage.jsx', () => ({
  DashboardPage: () => <p>Personal dashboard test content</p>,
}))

// Exercise the same navigation scenarios with a restored Admin session.
vi.mock('./cloud/client.ts', () => ({
  db: { cloud: {} },
  watchAccount: (_db, update) => {
    update({
      profile: { id: 'navigation-admin', role: 'admin', enabled: true },
    })
    return () => {}
  },
}))

vi.mock('./operations/useBranchWorkspace.js', () => ({
  useBranchWorkspace: () => ({
    profile: { id: 'navigation-admin', role: 'admin' },
    branches: [],
    catalog: [],
    members: [],
    products: [],
    sales: [],
    events: [],
    overviews: [],
    conflicts: [],
    invites: [],
    sync: { phase: 'in-sync' },
    branchId: '',
    setBranchId: vi.fn(),
    service: {},
    repo: {},
    refresh: vi.fn(),
  }),
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root
let container

async function settle(check) {
  let failure
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    try {
      check()
      return
    } catch (error) {
      failure = error
    }
  }
  throw failure
}

async function navigate(path) {
  await act(async () => {
    await router.navigate(path)
  })
}

async function click(text) {
  await act(async () => {
    const element = [...container.querySelectorAll('button, a')].find((item) =>
      item.textContent.includes(text),
    )
    if (!element) throw new Error(`Missing navigation: ${text}`)
    element.click()
  })
}

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  await Promise.all(
    [...db.tables, ...businessDb.tables].map((table) => table.clear()),
  )
  vi.spyOn(cutoffService, 'syncCutoffLifecycle').mockResolvedValue({
    currentCutoff: { id: 1 },
  })
  await router.navigate('/dashboard')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  await Promise.all(
    [...db.tables, ...businessDb.tables].map((table) => table.clear()),
  )
})

async function render() {
  await act(async () => root.render(<RouterProvider router={router} />))
}

describe('actual workspace routes and first-use selection', () => {
  it('navigates owner Overview, stock, audits, sales and backup without POS or Personal flows', async () => {
    await navigate('/business')
    await render()
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    for (const [label, path, content] of [
      ['Inventory Overview', '/business/stock', 'Inventory Overview'],
      ['Daily Audits', '/business/audit', 'Audit date'],
      ['All Sales', '/business/sales', 'All Sales'],
      ['Settings / Backup', '/business/settings', 'Download Business Backup'],
      ['Overview', '/business', 'Business Overview'],
    ]) {
      await click(label)
      await settle(() => expect(container.textContent).toContain(content))
      expect(router.state.location.pathname).toBe(path)
      expect(
        container.querySelector('nav [aria-current="page"]').textContent,
      ).toBe(label)
    }
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
  })
  it.each([
    ['/expenses', 'Official expense records'],
    ['/income', 'Income Management'],
    ['/savings', 'Savings Strategy'],
  ])(
    'loads the lazy Personal %s route from Business after the Router 7 migration',
    async (path, pageText) => {
      setActiveWorkspace('business')
      // Existing Personal records must continue bypassing first-use selection.
      await db.expenses.add({
        amount: 100,
        merchant: 'Existing personal expense',
      })
      await navigate('/business')
      await render()
      await settle(() =>
        expect(container.textContent).toContain('Business Overview'),
      )
      await navigate(`${path}?from=business#ledger`)
      await settle(() => expect(container.textContent).toContain(pageText))
      expect(router.state.location).toMatchObject({
        pathname: path,
        search: '?from=business',
        hash: '#ledger',
      })
      expect(getActiveWorkspace()).toBe('personal')
      expect(container.textContent).not.toContain('How will you use PesoPilot?')
      expect((await db.expenses.toArray())[0].merchant).toBe(
        'Existing personal expense',
      )
    },
  )

  it('retains audit deep-link query/hash and workspace isolation through back and forward navigation', async () => {
    setActiveWorkspace('business')
    await navigate('/business')
    await render()
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    await navigate('/business/audit?from=history#totals')
    await settle(() => expect(container.textContent).toContain('Daily Audits'))
    await navigate(-1)
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    await navigate(1)
    await settle(() => expect(container.textContent).toContain('Daily Audits'))
    expect(router.state.location).toMatchObject({
      pathname: '/business/audit',
      search: '?from=history',
      hash: '#totals',
    })
    expect(getActiveWorkspace()).toBe('business')
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
  })

  it('opens the dedicated audit route without mounting Personal cutoff flows', async () => {
    await navigate('/business/audit')
    await render()
    await settle(() => expect(container.textContent).toContain('Daily Audits'))
    expect(getActiveWorkspace()).toBe('business')
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
    await click('Overview')
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    await click('Daily Audits')
    await settle(() =>
      expect(router.state.location.pathname).toBe('/business/audit'),
    )
  })
  it('offers first-use choice, enters Business without cutoff guidance, and keeps the Personal route available', async () => {
    await render()
    await settle(() =>
      expect(container.textContent).toContain('How will you use PesoPilot?'),
    )
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
    await click('Business Owner')
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    expect(router.state.location.pathname).toBe('/business')
    expect(getActiveWorkspace()).toBe('business')
    expect(container.textContent).not.toContain('No Current Cutoff')
    await navigate('/dashboard')
    await settle(() =>
      expect(container.textContent).toContain(
        'Personal dashboard test content',
      ),
    )
    expect(getActiveWorkspace()).toBe('personal')
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
    await click('Business Workspace')
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    expect(getActiveWorkspace()).toBe('business')
  })

  it('offers Personal setup and remembers that choice', async () => {
    await render()
    await settle(() =>
      expect(container.textContent).toContain('How will you use PesoPilot?'),
    )
    await click('Personal Finance')
    await settle(() =>
      expect(router.state.location.pathname).toBe('/salary-cutoff'),
    )
    expect(getActiveWorkspace()).toBe('personal')
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
  })

  it('bypasses onboarding for existing personal records even with no preference flags', async () => {
    await db.expenses.add({
      amount: 100,
      merchant: 'Existing personal expense',
    })
    await render()
    await settle(() =>
      expect(container.textContent).toContain(
        'Personal dashboard test content',
      ),
    )
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
    expect((await db.expenses.toArray())[0].merchant).toBe(
      'Existing personal expense',
    )
  })

  it('honors root preference without starting Personal, then syncs direct URLs and browser history', async () => {
    setActiveWorkspace('business')
    await router.navigate('/')
    await render()
    await settle(() =>
      expect(container.textContent).toContain('Business Overview'),
    )
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
    await navigate('/dashboard')
    await settle(() =>
      expect(container.textContent).toContain(
        'Personal dashboard test content',
      ),
    )
    expect(getActiveWorkspace()).toBe('personal')
    await navigate('/business')
    await settle(() => expect(getActiveWorkspace()).toBe('business'))
    await navigate(-1)
    await settle(() => expect(getActiveWorkspace()).toBe('personal'))
    await navigate(1)
    await settle(() => expect(getActiveWorkspace()).toBe('business'))
    await navigate('/')
    await settle(() => expect(router.state.location.pathname).toBe('/business'))
  })
})
