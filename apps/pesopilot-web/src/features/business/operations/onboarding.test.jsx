// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AdminProducts } from './AdminProducts.jsx'
import { BusinessSetup } from './BusinessSetup.jsx'
import { businessSetup } from './businessSetup.js'
import { BusinessSyncStatus } from './BusinessSyncStatus.jsx'
import { StaffInventory } from './StaffInventory.jsx'
import { db } from '../cloud/client.ts'
import { businessRepository } from '../repositories/businessRepository.js'
import { seed } from './branchTestFixture.js'
import { BUSINESS_REALM } from './branchRepository.js'
import { previewCatalogImport } from './catalogImport.js'
import { publishCatalog } from './branchAdministration.js'
vi.mock('../cloud/client.ts', async () => {
  const { fixture } = await import('./branchTestFixture.js')
  return { db: fixture('onboarding-preview') }
})
vi.mock('../repositories/businessRepository.js', () => ({
  businessRepository: { listProducts: vi.fn() },
}))
let root, container, source
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  await db.open()
  await seed(db)
  source = {
    ...(await db.branchCatalog.get('lavender')),
    stockQuantity: 999,
    photo: 'not-a-definition',
    sales: ['never-copy'],
  }
  await db.branchCatalog.clear()
  db.cloud.sync.mockReset().mockResolvedValue(undefined)
  businessRepository.listProducts.mockReset().mockResolvedValue([source])
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  await db.delete()
})
const empty = () => ({
  profile: { id: 'owner' },
  catalog: [],
  branches: [],
  members: [],
  overviews: [],
  service: { addProduct: vi.fn() },
  products: [],
  isLoading: false,
})
async function render(element) {
  await act(async () => root.render(<MemoryRouter>{element}</MemoryRouter>))
}
async function click(text) {
  await act(async () =>
    [...container.querySelectorAll('button')]
      .find((button) => button.textContent === text)
      .click(),
  )
  let failure
  for (let n = 0; n < 150; n++) {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
    try {
      expect(container.textContent).not.toMatch(/Reviewing…|Importing…/)
      return
    } catch (error) {
      failure = error
    }
  }
  throw failure
}

it('guides a fresh owner using actual saved steps, with no progress during loading', async () => {
  const work = empty()
  await render(<BusinessSetup work={work} />)
  expect(container.querySelector('details').open).toBe(true)
  expect(container.textContent).toContain('0 of 4 steps ready')
  expect(container.querySelector('[aria-current=step]').textContent).toContain(
    'Add products',
  )
  expect(container.querySelector('a').getAttribute('href')).toBe(
    '/business/products',
  )
  work.isLoading = true
  await render(<BusinessSetup work={work} />)
  expect(container.textContent).toContain('Checking saved progress')
  expect(container.textContent).not.toContain('0 of 4')
})
it('does not count invitations or stock snapshots as setup completion; collapses after saved receipts', async () => {
  const work = empty()
  work.catalog = [source]
  work.branches = [{ id: 'A' }]
  work.members = [
    {
      realmId: BUSINESS_REALM,
      userId: 'staff',
      roles: ['staff'],
      accepted: true,
    },
    { realmId: 'A', userId: 'staff', roles: ['staff'] },
  ]
  work.overviews = [
    { branch: { id: 'A' }, products: [{ stockQuantity: 9 }], movements: [] },
  ]
  expect(businessSetup(work).map((step) => step.done)).toEqual([
    true,
    true,
    false,
    false,
  ])
  work.members[1].accepted = true
  work.overviews[0].movements.push({ type: 'stock_adjustment', delta: 10 })
  await render(<BusinessSetup work={work} />)
  expect(container.querySelector('details').open).toBe(false)
  expect(container.textContent).toContain('Setup saved')
  work.branches.push({ id: 'B' })
  expect(
    businessSetup(work)
      .slice(2)
      .every((step) => step.done),
  ).toBe(false)
})
it('previews only on request, requires confirmation, imports no quantity and safely repeats', async () => {
  const work = empty()
  await render(<AdminProducts work={work} online busy={false} run={vi.fn()} />)
  expect(businessRepository.listProducts).not.toHaveBeenCalled()
  expect(container.textContent).not.toContain('Publish this device')
  await click('Import existing products from this device')
  expect(container.querySelector('#import-products').open).toBe(true)
  await click('Preview existing products')
  expect(container.textContent).toContain('1 to add')
  expect(await db.branchCatalog.count()).toBe(0)
  const commit = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Import 1 product',
  )
  expect(commit.disabled).toBe(true)
  await act(async () =>
    container.querySelector('#import-products input[type=checkbox]').click(),
  )
  await click('Import 1 product')
  expect(container.textContent).toContain('Products imported and shared')
  const saved = await db.branchCatalog.get('lavender')
  expect(saved.stockQuantity).toBe(0)
  expect(saved).not.toHaveProperty('photo')
  expect(saved).not.toHaveProperty('sales')
  expect(await db.branchTransactions.count()).toBe(0)
  expect(source.stockQuantity).toBe(999)
  await click('Preview existing products')
  expect(container.textContent).toContain('0 to add · 1 already')
  expect(await db.branchCatalog.count()).toBe(1)
})
it('allows offline preview while preventing import', async () => {
  await render(
    <AdminProducts work={empty()} online={false} busy={false} run={vi.fn()} />,
  )
  await click('Preview existing products')
  await act(async () =>
    container.querySelector('#import-products input[type=checkbox]').click(),
  )
  const commit = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Import 1 product',
  )
  expect(commit.disabled).toBe(true)
  expect(container.textContent).toContain('Reconnect before importing')
  expect(await db.branchCatalog.count()).toBe(0)
})
it('rejects stale source or shared definitions after preview and preserves saved prices', async () => {
  const before = await previewCatalogImport(db, 'owner', [source])
  await expect(
    publishCatalog(
      db,
      'owner',
      [{ ...source, name: 'Changed' }],
      before.snapshot,
    ),
  ).rejects.toThrow(/changed since/)
  expect(await db.branchCatalog.count()).toBe(0)
  await publishCatalog(db, 'owner', [source], before.snapshot)
  await db.branchCatalog.update('lavender', { unitPriceCentavos: 12345 })
  const next = await previewCatalogImport(db, 'owner', [source])
  expect(next).toMatchObject({ added: 0, existing: 1, conflicts: 0 })
  await publishCatalog(db, 'owner', [source], next.snapshot)
  expect((await db.branchCatalog.get('lavender')).unitPriceCentavos).toBe(12345)
  await expect(previewCatalogImport(db, 'employee', [source])).rejects.toThrow(
    /Admin/,
  )
})
it('reports conflicting variants and rolls back the entire catalog import', async () => {
  const duplicate = { ...source, id: 'different-id' }
  const preview = await previewCatalogImport(db, 'owner', [source, duplicate])
  expect(preview.conflicts).toBe(1)
  await expect(
    publishCatalog(db, 'owner', [source, duplicate], preview.snapshot),
  ).rejects.toThrow(/need review/)
  expect(await db.branchCatalog.count()).toBe(0)
})
it('keeps import failure actionable without a false completed message', async () => {
  db.cloud.sync.mockRejectedValueOnce(new Error('network failed'))
  await render(
    <AdminProducts work={empty()} online busy={false} run={vi.fn()} />,
  )
  await click('Preview existing products')
  await act(async () =>
    container.querySelector('#import-products input[type=checkbox]').click(),
  )
  await click('Import 1 product')
  expect(container.querySelector('[role=alert]').textContent).toContain(
    'Import could not finish',
  )
  expect(container.textContent).not.toContain('Products imported and shared')
  expect((await db.branchCatalog.get('lavender')).stockQuantity).toBe(0)
  await click('Preview existing products')
  expect(container.textContent).toContain('1 already in the product list')
})
it('shows a helpful empty branch without a blank product selector', async () => {
  await render(<StaffInventory work={empty()} />)
  expect(container.textContent).toContain(
    'Ask the owner to add products in Products',
  )
  expect(container.querySelector('form')).toBeNull()
  expect(container.querySelector('[name=productId]')).toBeNull()
})
it('uses business connection states and shows retry only when needed in normal flows', async () => {
  const retry = vi.fn()
  await render(<BusinessSyncStatus phase="in-sync" online retry={retry} />)
  expect(container.querySelector('details').open).toBe(false)
  expect(container.textContent).not.toContain('Dexie')
  expect(
    [...container.querySelectorAll('button')].some(
      (button) => button.textContent === 'Try again',
    ),
  ).toBe(false)
  await render(
    <BusinessSyncStatus phase="offline" online={false} retry={retry} />,
  )
  expect(container.textContent).toContain('keep recording stock and sales')
  await render(<BusinessSyncStatus phase="error" online retry={retry} />)
  await click('Try again')
  expect(retry).toHaveBeenCalledOnce()
  expect(container.textContent).not.toContain(
    'All changes in this device are shared',
  )
})

it('searches specific scents, shows current branch quantity and preserves review when going back', async () => {
  const work = empty()
  work.products = [
    { ...source, stockQuantity: 10 },
    {
      ...source,
      id: 'turmeric',
      name: 'Hallelujah Inhaler',
      catalog: { scent: 'Turmeric', type: 'Solo' },
      stockQuantity: 5,
    },
  ]
  work.service.adjustStock = vi.fn()
  await render(<StaffInventory work={work} />)
  async function change(selector, value) {
    await act(async () => {
      const element = container.querySelector(selector)
      const prototype =
        element.tagName === 'SELECT'
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(
        element,
        value,
      )
      element.dispatchEvent(
        new Event(element.tagName === 'SELECT' ? 'change' : 'input', {
          bubbles: true,
        }),
      )
    })
  }
  await change('[type=search]', 'turmeric')
  expect(container.querySelector('option[value=lavender]')).toBeNull()
  expect(
    container.querySelector('option[value=turmeric]').textContent,
  ).toContain('Turmeric · Solo · 5 in branch')
  await change('[name=productId]', 'turmeric')
  expect(container.textContent).toContain('Current branch stock: 5 units')
  await change('[name=direction]', 'remove')
  await change('[name=quantity]', '2')
  await change('[name=reason]', 'Damaged packaging')
  await act(async () =>
    container
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(
    container.querySelector('[aria-label="Review stock change"]').textContent,
  ).toContain('Remove 2 units')
  expect(work.service.adjustStock).not.toHaveBeenCalled()
  await click('Back to edit')
  expect(container.querySelector('[name=quantity]').value).toBe('2')
  expect(container.querySelector('[name=reason]').value).toBe(
    'Damaged packaging',
  )
  await change('[type=search]', 'not a product')
  expect(container.textContent).toContain('No matching products')
  await click('Clear search')
  expect(container.querySelector('option[value=lavender]')).not.toBeNull()
})

it('keeps catalog loading distinct from an empty product list', async () => {
  await render(
    <AdminProducts
      work={{ ...empty(), isLoading: true }}
      online
      busy={false}
      run={vi.fn()}
    />,
  )
  expect(container.textContent).toContain('Loading your products')
  expect(container.querySelector('#import-products')).toBeNull()
  expect(businessRepository.listProducts).not.toHaveBeenCalled()
})
