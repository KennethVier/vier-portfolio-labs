import { useBranchWorkspace } from './useBranchWorkspace.js'
// @vitest-environment happy-dom
import Dexie from 'dexie'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AccessContext } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { BranchOperationsPage } from './BranchOperationsPage.jsx'
import { createBranchRepository } from './branchRepository.js'
import { createBusinessService } from '../services/businessService.js'
import { seed } from './branchTestFixture.js'
import {
  readBranchWorkspace,
  workspaceReadReport,
  WorkspaceReadError,
} from './workspaceRead.js'
vi.mock('../cloud/client.ts', async () => {
  const { fixture } = await import('./branchTestFixture.js')
  const { BehaviorSubject } = await import('rxjs')
  const database = fixture('workspace-read-regression')
  database.cloud.syncState = new BehaviorSubject({ phase: 'in-sync' })
  database.cloud.invites = new BehaviorSubject([])
  return { db: database }
})
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({
  useAutomaticBusinessBackup() {},
}))
let root, container
const context = { userId: 'owner', role: 'admin', branchId: '' }
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  await db.open()
  await seed(db)
  db.cloud.sync.mockReset().mockResolvedValue(undefined)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  await db.delete()
})
async function render() {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <AccessContext.Provider
          value={{ profile: { id: 'owner', role: 'admin' }, logout: vi.fn() }}
        >
          <BranchOperationsPage screen="branches" />
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
function createButton() {
  return [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Create branch',
  )
}
async function retry() {
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === 'Try again')
      .click(),
  )
}
async function receipt() {
  const service = createBusinessService(
    createBranchRepository(db, { userId: 'employee', branchId: 'A' }),
  )
  await service.adjustStock({
    productId: 'lavender',
    quantity: 10,
    direction: 'add',
    reason: 'Synthetic receipt',
    requestKey: 'read-regression',
  })
  return (await db.branchTransactions.toArray())[0]
}
it('loads valid empty branches without treating zero transactions as a read failure', async () => {
  await render()
  await wait(() => expect(createButton().disabled).toBe(false))
  expect(container.textContent).not.toContain(
    'Business records could not be loaded',
  )
  expect(await db.branchTransactions.count()).toBe(0)
})
it('loads creator-owned records and leaves their stored ownership/quantities intact', async () => {
  const entry = await receipt()
  await db.branchTransactions.update(entry.id, { owner: 'employee' })
  const before = JSON.stringify(await db.branchTransactions.toArray())
  const state = await readBranchWorkspace(db, context)
  expect(
    state.overviews.find((view) => view.branch.id === 'A').pools[0]
      .stockQuantity,
  ).toBe(10)
  expect(state.error).toBeNull()
  expect(JSON.stringify(await db.branchTransactions.toArray())).toBe(before)
})
it('identifies the authorization subquery that actually throws', async () => {
  vi.spyOn(db.realms, 'get').mockRejectedValueOnce(
    new Dexie.NotFoundError('synthetic missing store'),
  )
  await expect(readBranchWorkspace(db, context)).rejects.toMatchObject({
    stage: 'authorization.admin.realm',
    cause: { name: 'NotFoundError' },
  })
})
it('identifies catalog/index failure and preserves the exception name/code in a safe report', async () => {
  vi.spyOn(db.branchCatalog, 'where').mockImplementationOnce(() => {
    throw new Dexie.SchemaError(
      'KeyPath realmId on object store branchCatalog is not indexed',
    )
  })
  let error
  try {
    await readBranchWorkspace(db, context)
  } catch (failure) {
    error = failure
  }
  expect(error.stage).toBe('catalog')
  const report = workspaceReadReport(db, error, 'in-sync')
  expect(report.error).toMatchObject({
    name: 'SchemaError',
    message: 'KeyPath realmId on object store branchCatalog is not indexed',
  })
  expect(
    report.tables.find((table) => table.name === 'branchCatalog').indexes,
  ).toContain('realmId')
})
it('fails closed on scope corruption with one consistent failure and no fake pull-success notice', async () => {
  const entry = await receipt()
  await db.branchTransactions.update(entry.id, {
    branchId: 'wrong-synthetic-branch',
  })
  await render()
  await wait(() =>
    expect(container.textContent).toContain(
      'Business records could not be loaded',
    ),
  )
  expect(createButton().disabled).toBe(true)
  expect(container.querySelectorAll('[role=alert]')).toHaveLength(1)
  expect(container.textContent).toContain('BRANCH_EVENT_ID_SCOPE')
  await retry()
  await wait(() =>
    expect(container.textContent).toContain(
      'Business records could not be loaded',
    ),
  )
  expect(db.cloud.sync).toHaveBeenCalledWith({ purpose: 'pull', wait: true })
  expect(createButton().disabled).toBe(true)
  expect(container.textContent).not.toContain('Business records reloaded.')
  expect(container.textContent).not.toContain('Latest updates received')
  expect(container.textContent).not.toContain(
    'All changes in this device are shared',
  )
})
it('waits for delayed local recovery after cloud pull before allowing branch creation or success', async () => {
  const broken = vi.spyOn(db.branchCatalog, 'where').mockImplementation(() => {
    throw new Dexie.SchemaError('synthetic index failure')
  })
  await render()
  await wait(() =>
    expect(container.textContent).toContain(
      'Business records could not be loaded',
    ),
  )
  broken.mockRestore()
  const catalog = await db.branchCatalog.toArray()
  let finish
  const delayed = new Promise((resolve) => {
    finish = resolve
  })
  const read = vi
    .spyOn(db.branchCatalog, 'where')
    .mockImplementationOnce(() => ({
      equals: () => ({ toArray: () => delayed }),
    }))
  await retry()
  await wait(() => expect(read).toHaveBeenCalled())
  expect(container.textContent).toContain('Loading business records')
  expect(container.textContent).not.toContain('Business records reloaded.')
  expect(createButton().disabled).toBe(true)
  container.querySelector('[name=name]').value = 'Muntinlupa'
  await act(async () => finish(catalog))
  await wait(() => expect(createButton().disabled).toBe(false))
  expect(container.textContent).toContain('Business records reloaded.')
  expect(container.querySelector('[name=name]').value).toBe('Muntinlupa')
  expect(container.textContent).not.toContain(
    'Business records could not be loaded',
  )
})
it('retains failure context for transactions and nested repository reads', async () => {
  const original = db.branchTransactions.where.bind(db.branchTransactions)
  let calls = 0
  vi.spyOn(db.branchTransactions, 'where').mockImplementation((index) => {
    calls++
    if (calls === 3)
      return {
        equals: () => ({
          toArray: () =>
            Promise.reject(new Dexie.DataError('synthetic read rejection')),
        }),
      }
    return original(index)
  })
  await expect(
    readBranchWorkspace(db, { ...context, branchId: 'A' }),
  ).rejects.toMatchObject({
    stage: 'repository.source',
    cause: { name: 'DataError' },
  })
})
it('does not serialize credentials, emails, record IDs or raw exception text', () => {
  const error = new WorkspaceReadError(
    'projection',
    Object.assign(
      new Error(
        'private.owner@example.test Bearer secret-token record-private-id {"quantity":10}',
      ),
      { name: 'Error', code: 42 },
    ),
    1,
  )
  const report = workspaceReadReport(db, error, 'in-sync')
  expect(report).toMatchObject({
    stage: 'projection',
    branchPosition: 1,
    error: { name: 'Error', code: 42, messageRedacted: true },
  })
  const output = JSON.stringify(report)
  for (const secret of [
    'private.owner',
    'secret-token',
    'record-private-id',
    'quantity',
  ])
    expect(output).not.toContain(secret)
})

it('preserves verified cached business reads when only the cloud pull fails', async () => {
  await receipt()
  let workspace
  function Probe() {
    workspace = useBranchWorkspace(db)
    return <p>{workspace.readStatus}</p>
  }
  await act(async () =>
    root.render(
      <AccessContext.Provider
        value={{ profile: { id: 'owner', role: 'admin' } }}
      >
        <Probe />
      </AccessContext.Provider>,
    ),
  )
  await wait(() => expect(workspace.readStatus).toBe('ready'))
  db.cloud.sync.mockRejectedValueOnce(new Error('synthetic network failure'))
  await act(async () => {
    await expect(workspace.refresh()).rejects.toMatchObject({
      stage: 'synchronization',
    })
  })
  await wait(() => expect(workspace.readStatus).toBe('ready'))
  expect(workspace.error).toBeNull()
  expect(
    workspace.overviews.find((view) => view.branch.id === 'A').pools[0]
      .stockQuantity,
  ).toBe(10)
  expect(await db.branchTransactions.count()).toBe(1)
})
it('loads a legacy array-key receipt in the Admin page, retains branches and hides technical migration controls', async () => {
  const entry = await receipt()
  // Representative persisted receive shape, transport itself exercised in ledgerIdentity.test.
  const legacyId = entry.id.slice('evt:'.length)
  await db.branchTransactions.delete(entry.id)
  await db.branchTransactions.add({ ...entry, id: JSON.parse(legacyId) })
  const before = JSON.stringify(await db.branchTransactions.toArray())
  await render()
  await wait(() => expect(createButton().disabled).toBe(false))
  expect(container.textContent).not.toContain(
    'Business records could not be loaded',
  )
  for (const technical of [
    'Legacy default-branch migration',
    'Validate migration dry run',
    'Advanced setup',
    'Confirm migration',
  ])
    expect(container.textContent).not.toContain(technical)
  expect(container.textContent).toContain('Download backup')
  expect(await db.businessBranches.count()).toBe(2)
  expect(JSON.stringify(await db.branchTransactions.toArray())).toBe(before)
})
