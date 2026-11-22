// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { BranchOperationsPage } from './BranchOperationsPage.jsx'
import { AccessContext } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { seed } from './branchTestFixture.js'
import { BUSINESS_REALM, createBranchRepository } from './branchRepository.js'
import { createBusinessService } from '../services/businessService.js'
import { fixturePhoto } from '../services/productPhotoFixture.js'
import { productFamilyId } from '../constants/productPresentation.js'
import { saveCatalogPhoto } from './catalogMedia.js'
import { PRODUCT_SCENTS } from '../constants/catalogMetadata.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
vi.mock('../cloud/client.ts', async () => {
  const { fixture } = await import('./branchTestFixture.js')
  const { BehaviorSubject } = await import('rxjs')
  const database = fixture('phase0-operational-parity')
  database.cloud.syncState = new BehaviorSubject({ phase: 'in-sync' })
  database.cloud.invites = new BehaviorSubject([])
  return { db: database }
})
vi.mock('../hooks/useAutomaticBusinessBackup.js', () => ({
  useAutomaticBusinessBackup() {},
}))
vi.mock('../components/MorningStockCheck.jsx', () => ({
  MorningStockCheck: () => null,
}))
let root, container, staff, admin
beforeEach(async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  await db.open()
  await seed(db)
  for (const scent of PRODUCT_SCENTS)
    for (const type of ['Solo', 'Set'])
      await db.branchCatalog.add({
        id: scent + '-' + type,
        realmId: BUSINESS_REALM,
        name: 'Hallelujah Rub · ' + scent + ' · ' + type,
        initialNameSnapshot: 'Hallelujah Rub · ' + scent + ' · ' + type,
        initialPriceCentavos: type === 'Set' ? 15000 : 19900,
        inventoryPoolId: scent + '-Solo',
        inventoryPoolName: scent,
        inventoryUnitsPerSale: 1,
        unitPriceCentavos: type === 'Set' ? 15000 : 19900,
        unitCostCentavos: 7000,
        stockQuantity: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        catalog: {
          category: 'Hallelujah Rub',
          family: 'Hallelujah Rub',
          scent,
          type,
        },
      })
  staff = createBusinessService(
    createBranchRepository(db, { userId: 'employee', branchId: 'A' }),
  )
  admin = createBranchRepository(db, { userId: 'owner', branchId: 'A' })
  const product = await db.branchCatalog.get('Lavender-Solo')
  await saveCatalogPhoto(
    db,
    'owner',
    productFamilyId(product),
    fixturePhoto(productFamilyId(product)),
  )
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
async function render(screen = 'home', role = 'staff') {
  await act(async () =>
    root.render(
      <MemoryRouter>
        <AccessContext.Provider
          value={{
            profile: {
              id: role === 'staff' ? 'employee' : 'owner',
              role,
              enabled: true,
            },
            logout: vi.fn(),
          }}
        >
          <BranchOperationsPage screen={screen} />
        </AccessContext.Provider>
      </MemoryRouter>,
    ),
  )
  await wait(() =>
    expect(container.textContent).not.toMatch(
      /Loading branch records|Loading local business data/,
    ),
  )
}
async function click(text, twice = false) {
  await act(async () => {
    const button = [...container.querySelectorAll('button')].find(
      (node) =>
        node.textContent === text || node.getAttribute('aria-label') === text,
    )
    if (!button) throw new Error('Missing button ' + text)
    button.click()
    if (twice) button.click()
  })
  await wait(() =>
    expect(container.textContent).not.toMatch(/Recording…|Saving…/),
  )
}
async function change(label, value, scope = container) {
  const field = [...scope.querySelectorAll('label')].find((node) =>
    node.textContent.includes(label),
  )
  const input =
    field?.querySelector('input,select') ??
    document.getElementById(field?.htmlFor)
  if (!input) throw new Error('Missing field ' + label)
  await act(async () => {
    const proto =
      input.tagName === 'SELECT'
        ? window.HTMLSelectElement.prototype
        : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value)
    input.dispatchEvent(
      new Event(input.tagName === 'SELECT' ? 'change' : 'input', {
        bubbles: true,
      }),
    )
  })
}
async function submit() {
  await act(async () =>
    container
      .querySelector('[role=dialog] form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
}
async function openRub() {
  await act(async () =>
    container
      .querySelector('[aria-label="Record sale: Hallelujah Rub"]')
      .click(),
  )
}
async function receive() {
  await staff.receiveStock(
    PRODUCT_SCENTS.map((scent) => ({
      productId: scent + '-Solo',
      quantity: 10,
    })),
    { reason: 'Synthetic delivery', requestKey: 'setup' },
  )
}
it('retains Staff cards/photos, multi-scent receipt shortcut, review-before-write and branch isolation', async () => {
  await render()
  await openRub()
  expect(container.querySelector('[role=dialog] img')).not.toBeNull()
  expect(container.textContent).toContain('Add stock first')
  await click('Select all scents')
  await change('Units received per scent', '10')
  await change('Receipt reason', 'Delivery checked')
  await submit()
  expect(await db.branchTransactions.count()).toBe(0)
  expect(
    container.querySelector('[aria-label="Review received stock"]'),
  ).not.toBeNull()
  await click('Confirm received stock', true)
  await wait(() => expect(container.querySelector('[role=dialog]')).toBeNull())
  expect(await db.branchTransactions.count()).toBe(1)
  expect(
    (await admin.source()).pools
      .filter((pool) => pool.id.endsWith('-Solo'))
      .map((pool) => pool.stockQuantity),
  ).toEqual([10, 10, 10, 10, 10])
  const other = createBranchRepository(db, { userId: 'owner', branchId: 'B' })
  expect(
    (await other.listProducts()).every(
      (product) => product.stockQuantity === 0,
    ),
  ).toBe(true)
  await openRub()
  expect(container.textContent).toContain('Optional tawad')
  await click('Increase quantity')
  await click('Decrease quantity')
  await change('Optional tawad', '180')
  await change('Agreed price reason', 'Customer tawad agreed')
  await click('GCash')
  await submit()
  expect(await admin.listSalesHistory()).toHaveLength(0)
  expect(
    container.querySelector('[aria-label="Review sale"]').textContent,
  ).toContain('Customer tawad agreed')
  await click('Confirm Completed Sale', true)
  await wait(() => expect(container.querySelector('[role=dialog]')).toBeNull())
  const history = await admin.listSalesHistory()
  expect(history).toHaveLength(1)
  expect(history[0]).toMatchObject({
    actorId: 'employee',
    branchId: 'A',
    paymentMethod: 'gcash',
    totalCentavos: 18000,
  })
  expect(history[0].items[0]).toMatchObject({
    catalogUnitPriceCentavos: 19900,
    unitPriceCentavos: 18000,
    unitCostCentavos: 7000,
    priceOverride: true,
    priceOverrideReason: 'Customer tawad agreed',
    saleFormat: 'solo',
  })
  expect(container.textContent).toContain('Sale recorded.')
  await act(async () => new Promise((resolve) => setTimeout(resolve, 3100)))
  expect(container.textContent).not.toContain('Sale recorded.')
})
it('preserves five-piece mixed Set, tawad, Coop Pay, one-write retry and historical cost/profit snapshots', async () => {
  await receive()
  await render()
  await openRub()
  await click('Set')
  await change('Lavender ·', '2')
  await change('Negative Ion ·', '0')
  await change('Optional tawad', '120')
  await change('Agreed price reason', 'Five-piece tawad')
  await click('Coop Pay')
  await submit()
  expect(await db.branchTransactions.count()).toBe(1)
  const add = db.branchTransactions.add.bind(db.branchTransactions)
  vi.spyOn(db.branchTransactions, 'add')
    .mockRejectedValueOnce(new Error('Synthetic disk failure'))
    .mockImplementation(add)
  await click('Confirm Completed Sale')
  expect(container.textContent).toContain('Synthetic disk failure')
  expect(await admin.listSalesHistory()).toHaveLength(0)
  await click('Retry Confirmed Sale', true)
  await wait(() => expect(container.querySelector('[role=dialog]')).toBeNull())
  const history = await admin.listSalesHistory()
  expect(history).toHaveLength(1)
  expect(history[0]).toMatchObject({
    paymentMethod: 'coop',
    totalCentavos: 60000,
  })
  expect(history[0].items.reduce((sum, line) => sum + line.quantity, 0)).toBe(5)
  expect(
    history[0].items.every(
      (line) =>
        line.saleFormat === 'set' &&
        line.priceBasisCentavos === 15000 &&
        line.catalogUnitPriceCentavos === 19900 &&
        line.unitPriceCentavos === 12000,
    ),
  ).toBe(true)
  const state = await admin.source()
  expect(
    state.products.find((product) => product.id === 'Lavender-Solo')
      .stockQuantity,
  ).toBe(8)
  expect(
    state.products.find((product) => product.id === 'Negative Ion-Solo')
      .stockQuantity,
  ).toBe(10)
  expect(buildDailyAudit(getManilaDate(), state).profit).toEqual({
    costOfGoods: 35000,
    grossProfit: 25000,
    uncostedUnits: 0,
  })
  await act(async () => {
    await admin.setPrice('Lavender-Solo', 25000)
    await admin.setUnitCost('Lavender-Solo', 9000)
  })
  expect((await admin.listSalesHistory())[0].items).toEqual(history[0].items)
  await render('analytics', 'admin')
  expect(container.textContent).toContain('Gross profit')
  expect(container.textContent).toContain('Set')
  expect(container.textContent).toContain('Export sales CSV')
  expect(container.textContent).not.toContain('Record Sales')
  expect(container.textContent).toContain('Coop Pay')
})
it('blocks unexplained overrides and stale set prices; permits Cash at the approved Set rate', async () => {
  await receive()
  await render()
  await openRub()
  await click('Set')
  await change('Optional tawad', '120')
  expect(container.textContent).toContain('Explain the agreed price')
  await change('Optional tawad', '')
  await submit()
  const setId = [...container.querySelectorAll('button')].find(
    (button) => button.textContent === 'Confirm Completed Sale',
  )
  expect(setId).toBeTruthy()
  // A catalog change between review and confirmation cannot silently change the accepted rate.
  const selectedSet = PRODUCT_SCENTS[0] + '-Set'
  await act(async () => {
    await admin.setPrice(selectedSet, 16000)
  })
  await click('Confirm Completed Sale')
  if ((await admin.listSalesHistory()).length)
    throw new Error('Stale selected Set price was accepted')
  expect(container.textContent).toContain('price changed')
  await click('Back to Edit')
  await click('Cash')
  await submit()
  await click('Confirm Completed Sale')
  await wait(() => expect(container.querySelector('[role=dialog]')).toBeNull())
  expect((await admin.listSalesHistory())[0].paymentMethod).toBe('cash')
})
it('uses the grouped Branch Inventory delivery review and the same atomic receipt ledger', async () => {
  await render('stock')
  await change('Product group', 'Hallelujah Rub')
  await change('Eucalyptus · 0 on hand', '10')
  await change('Lavender · 0 on hand', '5')
  await change('Receipt reason', 'Grouped delivery checked')
  const form = container.querySelector('details form')
  await act(async () =>
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
  expect(await db.branchTransactions.count()).toBe(0)
  await click('Confirm delivery', true)
  expect(await db.branchTransactions.count()).toBe(1)
  expect(
    (await admin.listProducts()).find(
      (product) => product.id === 'Lavender-Solo',
    ).stockQuantity,
  ).toBe(5)
  expect(
    (await admin.listProducts()).find(
      (product) => product.id === 'Eucalyptus-Solo',
    ).stockQuantity,
  ).toBe(10)
  expect(container.textContent).toContain('Stock received in your branch.')
})
it('exposes Admin photo and cost/price management without a POS interface', async () => {
  await render('products', 'admin')
  expect(container.textContent).toContain('Product photos')
  expect(container.querySelector('.photo-editor img')).not.toBeNull()
  expect(container.textContent).not.toContain('Record Sales')
  const editor = [
    ...container.querySelectorAll('[aria-label="Saved products"] li'),
  ].find((row) => row.textContent.includes('Hallelujah Rub · Lavender · Solo'))
  await change('Purchase cost per piece', '85', editor)
  const costForm = editor.querySelectorAll('form')[1]
  await act(async () =>
    costForm.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
  await wait(() =>
    expect(container.textContent).toContain('Purchase cost saved'),
  )
  expect((await db.branchCatalog.get('Lavender-Solo')).unitCostCentavos).toBe(
    8500,
  )
  await change('Selling price per piece', '205', editor)
  await act(async () =>
    editor
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  await wait(() =>
    expect(container.textContent).toContain('Catalog price saved'),
  )
  expect((await db.branchCatalog.get('Lavender-Solo')).unitPriceCentavos).toBe(
    20500,
  )
  expect(await db.branchTransactions.count()).toBe(0)
})
it('lets Admin add an explicit Set price option without creating or receiving physical Set stock', async () => {
  await db.branchCatalog.delete('Lavender-Set') // Synthetic fixture only.
  await render('products', 'admin')
  await change('Product Category', 'Hallelujah Rub')
  await change('Scent', 'Lavender')
  await change('Solo / Set', 'Set')
  await click('Save Product', true)
  await wait(() =>
    expect(container.textContent).toContain('Product saved on this device'),
  )
  const matches = (await db.branchCatalog.toArray()).filter(
    (row) => row.catalog?.type === 'Set' && row.catalog.scent === 'Lavender',
  )
  expect(matches).toHaveLength(1)
  expect(matches[0]).toMatchObject({
    unitPriceCentavos: 15000,
    inventoryPoolId: 'Lavender-Solo',
    stockQuantity: 0,
  })
  expect(await db.branchTransactions.count()).toBe(0)
})
