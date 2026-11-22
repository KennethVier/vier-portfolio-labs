// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { fixture, seed } from './branchTestFixture.js'
import { useCatalogInitialization } from './useCatalogInitialization.js'
import { initializeStandardCatalog } from './catalogInitialization.js'
import { initialPull } from '../cloud/initialPull.ts'
vi.mock('../cloud/initialPull.ts', () => ({ initialPull: vi.fn() }))
let db, root, container
function Probe({ profile = { id: 'owner', role: 'admin' } }) {
  const status = useCatalogInitialization(db, profile, true)
  return <button onClick={status.retry}>{status.phase}</button>
}
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  db = fixture('catalog-setup-hook-' + crypto.randomUUID())
  db.cloud.options = { databaseUrl: 'https://z5jxogiwe.dexie.cloud' }
  await seed(db)
  initialPull.mockReset().mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  await db.delete()
})
async function wait(phase) {
  for (let n = 0; n < 100; n++) {
    await act(async () => new Promise((r) => setTimeout(r, 10)))
    if (container.textContent === phase) return
  }
  expect(container.textContent).toBe(phase)
}
it('waits for a successful initial pull and does not seed again on another login', async () => {
  let release
  initialPull.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve
      }),
  )
  await act(async () => root.render(<Probe />))
  await wait('checking')
  expect(await db.branchCatalog.count()).toBe(1)
  await act(async () => release())
  await wait('ready')
  expect(await db.branchCatalog.count()).toBe(52)
  initialPull.mockClear()
  await act(async () => root.render(<Probe key="new-login" />))
  await wait('ready')
  expect(initialPull).not.toHaveBeenCalled()
})
it('does not seed offline or as Staff, and preserves existing records on a failed pull', async () => {
  vi.stubGlobal('navigator', { onLine: false })
  await act(async () => root.render(<Probe />))
  await wait('offline')
  expect(await db.branchCatalog.count()).toBe(1)
  vi.stubGlobal('navigator', { onLine: true })
  initialPull.mockRejectedValueOnce(new Error('No connection'))
  await act(async () => container.querySelector('button').click())
  await wait('connection')
  expect(await db.branchCatalog.count()).toBe(1)
  initialPull.mockClear()
  await act(async () =>
    root.render(
      <Probe key="staff" profile={{ id: 'employee', role: 'staff' }} />,
    ),
  )
  expect(initialPull).not.toHaveBeenCalled()
  expect(await db.branchCatalog.count()).toBe(1)
})
it('a new cache receiving a partial marker pulls missing definitions without reseeding', async () => {
  await initializeStandardCatalog(db, 'owner')
  const rows = await db.branchCatalog.toArray()
  const marker = rows.find((row) => row.standardCatalogSetup)
  await db.branchCatalog.clear()
  await db.branchCatalog.add(marker) // Isolated synthetic cache only.
  const add = vi.spyOn(db.branchCatalog, 'add')
  initialPull.mockImplementationOnce(() => db.branchCatalog.bulkPut(rows))
  await act(async () => root.render(<Probe />))
  await wait('ready')
  expect(add).not.toHaveBeenCalled()
  expect(await db.branchCatalog.count()).toBe(52)
})
