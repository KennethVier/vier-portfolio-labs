// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db/dexie.js'
import { businessDb } from './repositories/businessDb.js'
import { getActiveWorkspace, setActiveWorkspace } from './services/workspacePreference.js'
import { cutoffService } from '@/features/salary-cutoff/services/cutoffService.js'
import { router } from '@/app/router.jsx'

// Keep the real router, layouts, onboarding and Business page. Personal feature
// calculations have their own regression suite; a small page makes navigation observable.
vi.mock('@/features/dashboard/pages/DashboardPage.jsx', () => ({
  DashboardPage: () => <p>Personal dashboard test content</p>,
}))

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root
let container

async function settle(check) {
  let failure
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)) })
    try { check(); return } catch (error) { failure = error }
  }
  throw failure
}

async function navigate(path) {
  await act(async () => { await router.navigate(path) })
}

async function click(text) {
  await act(async () => {
    const element = [...container.querySelectorAll('button, a')].find((item) => item.textContent.includes(text))
    if (!element) throw new Error(`Missing navigation: ${text}`)
    element.click()
  })
}

beforeEach(async () => {
  localStorage.clear()
  sessionStorage.clear()
  await Promise.all([...db.tables, ...businessDb.tables].map((table) => table.clear()))
  vi.spyOn(cutoffService, 'syncCutoffLifecycle').mockResolvedValue({ currentCutoff: { id: 1 } })
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
  await Promise.all([...db.tables, ...businessDb.tables].map((table) => table.clear()))
})

async function render() {
  await act(async () => root.render(<RouterProvider router={router} />))
}

describe('actual workspace routes and first-use selection', () => {
  it('offers first-use choice, enters Business without cutoff guidance, and switches both ways', async () => {
    await render()
    await settle(() => expect(container.textContent).toContain('How will you use PesoPilot?'))
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
    await click('Business Owner')
    await settle(() => expect(container.textContent).toContain('Manual stock adjustment'))
    expect(router.state.location.pathname).toBe('/business')
    expect(getActiveWorkspace()).toBe('business')
    expect(container.textContent).not.toContain('No Current Cutoff')
    await click('Switch to Personal')
    await settle(() => expect(container.textContent).toContain('Personal dashboard test content'))
    expect(getActiveWorkspace()).toBe('personal')
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
    await click('Business Workspace')
    await settle(() => expect(container.textContent).toContain('Manual stock adjustment'))
    expect(getActiveWorkspace()).toBe('business')
  })

  it('offers Personal setup and remembers that choice', async () => {
    await render()
    await settle(() => expect(container.textContent).toContain('How will you use PesoPilot?'))
    await click('Personal Finance')
    await settle(() => expect(router.state.location.pathname).toBe('/salary-cutoff'))
    expect(getActiveWorkspace()).toBe('personal')
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
  })

  it('bypasses onboarding for existing personal records even with no preference flags', async () => {
    await db.expenses.add({ amount: 100, merchant: 'Existing personal expense' })
    await render()
    await settle(() => expect(container.textContent).toContain('Personal dashboard test content'))
    expect(container.textContent).not.toContain('How will you use PesoPilot?')
    expect((await db.expenses.toArray())[0].merchant).toBe('Existing personal expense')
  })

  it('honors root preference without starting Personal, then syncs direct URLs and browser history', async () => {
    setActiveWorkspace('business')
    await router.navigate('/')
    await render()
    await settle(() => expect(container.textContent).toContain('Manual stock adjustment'))
    expect(cutoffService.syncCutoffLifecycle).not.toHaveBeenCalled()
    await navigate('/dashboard')
    await settle(() => expect(container.textContent).toContain('Personal dashboard test content'))
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
