// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessAdminPage } from '../pages/BusinessAdminPage.jsx'
import { BusinessDashboardPage } from '../pages/BusinessDashboardPage.jsx'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from '../services/businessService.js'
import { posCatalogService } from '../services/posCatalogService.js'
import { dailyAuditService, getManilaDate } from '../services/dailyAuditService.js'
import { productFamilyId } from '../constants/productPresentation.js'
import { fixturePhoto } from '../services/productPhotoFixture.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let container
let root

function field(label) {
  const element = [...container.querySelectorAll('label')].find((item) => item.textContent.includes(label))
  if (!element) throw new Error(`Missing field: ${label}`)
  return element.querySelector('input, select') ?? document.getElementById(element.htmlFor)
}

async function change(label, value) {
  await act(async () => {
    const element = field(label)
    const prototype = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
}

async function click(text, twice = false) {
  await act(async () => {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent === text)
    if (!button) throw new Error(`Missing button: ${text}`)
    button.click()
    if (twice) button.click()
  })
  await waitFor(() => expect(container.textContent).not.toMatch(/Loading local business data|Saving…|Recording…/))
}

async function waitFor(check) {
  let failure
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)) })
    try { check(); return } catch (error) { failure = error }
  }
  throw failure
}

async function go(label) {
  await act(async () => [...container.querySelectorAll('a')].find((item) => item.textContent === label).click())
  await waitFor(() => expect(container.textContent).not.toContain('Loading local business data'))
}
async function choose(name) {
  await act(async () => container.querySelector(`[aria-label="Record sale: ${name}"]`).click())
}
async function render(screen = 'pos') {
  await act(async () => { root.render(<MemoryRouter initialEntries={[screen === 'pos' ? '/business' : `/business/${screen}`]}><Routes><Route path='/business' element={<BusinessDashboardPage />} />{['inventory', 'history', 'settings'].map((screen) => <Route key={screen} path={`/business/${screen}`} element={<BusinessAdminPage screen={screen} />} />)}</Routes></MemoryRouter>) })
  await waitFor(() => expect(container.textContent).not.toContain('Loading local business data'))
}

beforeEach(async () => {
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  localStorage.clear()
})

describe('real Business UI and IndexedDB workflow', () => {
  it('shows a family photo on the POS and sale modal, keeps sample placeholders, and labels partial availability', async () => {
    const catalog = { family: 'Hallelujah Rub', category: 'Hallelujah Rub', type: 'Solo' }
    const solo = await businessService.addProduct({ name: 'Actual Solo', catalog, pricePesos: '199', openingStock: 1 })
    await businessService.addProduct({ name: 'Actual Set', catalog: { ...catalog, type: 'Set' }, pricePesos: '150', openingStock: 0 })
    await businessDb.productPhotos.put(fixturePhoto(productFamilyId(solo)))
    await posCatalogService.loadSampleCatalog(true)
    await render()
    const card = container.querySelector('[data-product-card]')
    expect(card.querySelector('img').alt).toBe('Hallelujah Rub product photo')
    expect(card.textContent).toContain('1 of 2 variants in stock')
    await choose('Hallelujah Rub')
    expect(container.querySelector('[role="dialog"] img')).not.toBeNull()
    await click('Close')
    await click('Sample Catalog')
    expect(container.querySelectorAll('[data-product-card] img')).toHaveLength(0)
    await go('Inventory')
    expect(container.querySelector('.photo-editor img')).not.toBeNull()
  })

  it('requires sample confirmation and shows the catalog immediately with no automatic inserts', async () => {
    await render()
    expect(await businessDb.products.count()).toBe(0)
    expect(container.querySelector('.sample-utilities').open).toBe(false)
    await act(async () => container.querySelector('.sample-utilities summary').click())
    await click('Load Sample Catalog')
    const confirm = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Confirm Load Sample Catalog')
    expect(confirm.disabled).toBe(true)
    await act(async () => container.querySelector('input[type="checkbox"]').click())
    await click('Confirm Load Sample Catalog', true)
    await waitFor(() => expect(container.querySelectorAll('[data-product-card]')).toHaveLength(9))
    expect(await businessDb.products.count()).toBe(52)
    expect(container.textContent).toContain('fictional stock')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it('switches categories, searches scents and sizes, clears filters, and separates actual inventory', async () => {
    await posCatalogService.loadSampleCatalog(true)
    await businessService.addProduct({ name: 'Actual Shawl', pricePesos: '99', openingStock: 1 })
    await render()
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(1)
    await click('Sample Catalog')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(9)
    await click('Shawls')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(3)
    await click('All Products')
    await change('Search products', 'Lavender')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(5)
    await change('Search products', '20x30')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(1)
    expect(container.querySelector('[data-product-card]').textContent).toContain('Magic Pillows')
    await change('Search products', 'no match')
    expect(container.textContent).toContain('No matching products')
    await click('Clear filters')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(9)
    await click('Actual Inventory')
    expect(container.querySelectorAll('[data-product-card]')).toHaveLength(1)
  })

  it('selects scent and Set, validates quantity, records one confirmed variant and updates audit/history', async () => {
    await posCatalogService.loadSampleCatalog(true)
    await render()
    await choose('Hallelujah Rub')
    expect(container.querySelector('[role="dialog"]').textContent).toContain('199.00')
    await click('Lavender')
    await click('Set')
    await change('Sale quantity', '2')
    const dialog = container.querySelector('[role="dialog"]')
    expect(dialog.textContent).toContain('150.00')
    expect(dialog.textContent).toContain('300.00')
    await click('GCash')
    expect([...dialog.querySelectorAll('button')].find((button) => button.textContent === 'GCash').getAttribute('aria-pressed')).toBe('true')
    await click('Record Sale')
    expect(dialog.textContent).toContain('Lavender')
    expect(dialog.textContent).toContain('Set')
    expect(await businessDb.sales.count()).toBe(0)
    await click('Owner: Confirm Completed Sale', true)
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    const [sale] = await businessService.listSalesHistory()
    expect(sale).toMatchObject({ paymentMethod: 'gcash', totalCentavos: 30000 })
    expect(sale.items).toHaveLength(1)
    expect(sale.items[0].productNameSnapshot).toContain('Sample')
    expect((await businessDb.products.get(sale.items[0].productId)).stockQuantity).toBe(18)
    const rubs = (await businessService.listProducts()).filter((product) => product.catalog?.family === 'Hallelujah Rub')
    expect(rubs.filter((product) => product.stockQuantity === 20)).toHaveLength(9)
    expect((await dailyAuditService.getReport(getManilaDate())).summary).toMatchObject({ totalSold: 2, totalCentavos: 30000 })
    await go('Sales History')
    expect(container.querySelector('tbody').textContent).toContain('Lavender')
    expect(container.querySelector('tbody').textContent).toContain('GCash')
  })

  it.each(['0', '-1', '1.5', '21', '', '9007199254740992'])('disables impossible quantity %s', async (quantity) => {
    await posCatalogService.loadSampleCatalog(true)
    await render()
    await choose('Shawl A')
    await change('Sale quantity', quantity)
    expect([...container.querySelectorAll('button')].find((button) => button.textContent === 'Record Sale').disabled).toBe(true)
    expect(await businessDb.sales.count()).toBe(0)
  })

  it('supports pillow sizes, quantity buttons, Cash default, close, focus return and Escape', async () => {
    await posCatalogService.loadSampleCatalog(true)
    await render()
    const card = container.querySelector('[aria-label="Record sale: Magic Pillows"]')
    card.focus()
    await choose('Magic Pillows')
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    await click('20x30 King Size')
    expect(container.querySelector('[role="dialog"]').textContent).toContain('899.00')
    expect([...container.querySelectorAll('button')].find((button) => button.textContent === 'Cash').getAttribute('aria-pressed')).toBe('true')
    await act(async () => container.querySelector('[aria-label="Increase quantity"]').click())
    expect(document.getElementById('sale-quantity').value).toBe('2')
    await act(async () => container.querySelector('[aria-label="Decrease quantity"]').click())
    expect(document.getElementById('sale-quantity').value).toBe('1')
    await click('Close')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(card)
    await choose('Magic Pillows')
    await act(async () => container.querySelector('[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(await businessDb.sales.count()).toBe(0)
  })

  it('disables sold-out cards and refreshes the remaining stock after a simple Cash sale', async () => {
    await businessService.addProduct({ name: 'Last shawl', pricePesos: '99', openingStock: 1 })
    await render()
    await choose('Last shawl')
    await click('Record Sale')
    await click('Owner: Confirm Completed Sale')
    expect(container.querySelector('[data-product-card]').disabled).toBe(true)
    expect(container.querySelector('[data-product-card]').textContent).toContain('Out of stock')
    expect((await businessService.listSales())[0].paymentMethod).toBe('cash')
  })

  it('keeps products with incomplete or duplicate variant coordinates individually selectable', async () => {
    const catalog = { family: 'Shawl collection', category: 'Shawls' }
    await businessService.addProduct({ name: 'Shawl A', pricePesos: '99', openingStock: 1, catalog })
    await businessService.addProduct({ name: 'Shawl B', pricePesos: '199', openingStock: 2, catalog })
    await render()
    await choose('Shawl collection')
    const select = field('Product variant')
    expect(select.options).toHaveLength(2)
    await change('Product variant', select.options[1].value)
    expect(container.querySelector('[role="dialog"]').textContent).toContain('199.00')
    await click('Record Sale')
    expect(container.querySelector('[role="dialog"]').textContent).toContain('Shawl B')
  })

  it('rejects a changed reviewed price at commit and requires another review', async () => {
    const product = await businessService.addProduct({ name: 'Shawl A', pricePesos: '99', openingStock: 3 })
    await render()
    await choose('Shawl A')
    await click('Record Sale')
    await businessDb.products.update(product.id, { unitPriceCentavos: 19900 })
    await click('Owner: Confirm Completed Sale')
    expect(container.textContent).toContain('Product price changed')
    expect(await businessDb.sales.count()).toBe(0)
    await click('Back to Edit')
    expect(container.querySelector('[role="dialog"]').textContent).toContain('199.00')
    await click('Record Sale')
    await click('Owner: Confirm Completed Sale')
    expect((await businessService.listSales())[0].totalCentavos).toBe(19900)
  })

  it('keeps an uncertain confirmed sale open and traps keyboard focus until its same-key retry resolves', async () => {
    await businessService.addProduct({ name: 'Retry product', pricePesos: '99', openingStock: 2 })
    vi.spyOn(businessService, 'completeSale').mockRejectedValueOnce(new Error('Unknown result'))
    await render()
    await choose('Retry product')
    await click('Record Sale')
    await click('Owner: Confirm Completed Sale')
    await click('Close')
    const dialog = container.querySelector('[role="dialog"]')
    await act(async () => dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    const first = dialog.querySelector('button')
    const last = [...dialog.querySelectorAll('button')].filter((button) => !button.disabled).at(-1)
    last.focus()
    await act(async () => last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })))
    expect(document.activeElement).toBe(first)
    await click('Retry Confirmed Sale')
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(await businessDb.sales.count()).toBe(1)
  })
  it('shows practical empty states and the access warning without salary setup', async () => {
    await render()
    expect(container.textContent).toContain('No products yet')
    expect(await businessDb.products.count()).toBe(0)
    await go('Sales History')
    expect(container.textContent).toContain('No completed sales yet')
    await go('Settings / Backup')
    expect(container.textContent).toContain('do not provide secure account access')
    expect(container.textContent).not.toContain('No Current Cutoff')
  })

  it('creates a shared variant and records owner-confirmed GCash with its own label', async () => {
    const product = await businessService.addProduct({ name: 'Roll-On Solo', pricePesos: '199', openingStock: 5, inventoryPoolName: 'Roll-On' })
    await render('inventory')
    await change('Product Category', 'Other product')
    await change('Custom product name', 'Roll-On Set')
    await change('Custom unit price', '150')
    await act(async () => container.querySelector('.product-creation details summary').click())
    await change('Use existing stock group', product.inventoryPoolId)
    expect([...container.querySelectorAll('label')].some((label) => label.textContent.includes('Opening Stock Quantity'))).toBe(false)
    await click('Save Product')
    const variant = (await businessService.listProducts()).find((item) => item.name === 'Roll-On Set')
    await go('POS')
    await choose(variant.name)
    await click('GCash')
    await click('Record Sale')
    expect(container.textContent).toContain('Payment method: GCash')
    await click('Owner: Confirm Completed Sale')
    expect((await businessService.listSales())[0]).toMatchObject({ paymentMethod: 'gcash', totalCentavos: 15000 })
    expect((await businessService.listProducts()).map((item) => item.stockQuantity)).toEqual([4, 4])
    await go('Sales History')
    expect(container.querySelector('details').closest('tr').textContent).toContain('GCash')
  })

  it('creates a product, adjusts stock with a reason, previews and explicitly confirms Coop once', async () => {
    await render('inventory')
    await change('Product Category', 'Other product')
    await change('Custom product name', 'Pillow')
    await change('Custom unit price', '350.25')
    await change('Opening Stock Quantity', '5')
    await click('Save Product', true)
    await waitFor(() => expect(container.textContent).toContain('Product saved'))
    const [product] = await businessService.listProducts()
    expect(await businessDb.products.count()).toBe(1)
    await change('Product to adjust', product.id)
    await change('Adjustment direction', 'remove')
    await change('Adjustment quantity', '1')
    expect(field('Adjustment reason').required).toBe(true)
    await change('Adjustment reason', 'Damaged unit')
    await click('Record Stock Adjustment')
    await waitFor(() => expect(container.textContent).toContain('Stock adjusted'))
    await go('POS')
    await choose(product.name)
    await change('Sale quantity', '2')
    await click('Coop Pay')
    expect(container.textContent).toContain('700.50')
    await click('Record Sale')
    expect(container.textContent).toContain('Confirm completed sale')
    expect(await businessDb.sales.count()).toBe(0)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(4)
    await click('Owner: Confirm Completed Sale', true)
    await waitFor(() => expect(container.textContent).toContain('Sale recorded.'))
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(2)
    expect((await businessService.listSalesHistory())[0]).toMatchObject({ paymentMethod: 'coop', totalCentavos: 70050 })
    await go('Sales History')
    const details = container.querySelector('details')
    expect(details.textContent).toContain('Pillow:')
    expect(details.querySelector('input')).toBeNull()
  })

  it('retains the same request on an uncertain result and safely retries a committed sale', async () => {
    const product = await businessService.addProduct({ name: 'Pillow', pricePesos: '350', openingStock: 3 })
    const original = businessService.completeSale.bind(businessService)
    const requests = []
    vi.spyOn(businessService, 'completeSale').mockImplementation(async (request) => {
      requests.push(request)
      const result = await original(request)
      if (requests.length === 1) throw new Error('Result unavailable. Retry this sale.')
      return result
    })
    await render()
    await choose(product.name)
    await click('Record Sale')
    await click('Owner: Confirm Completed Sale')
    expect(container.textContent).toContain('Result unavailable')
    expect([...container.querySelectorAll('button')].find((item) => item.textContent === 'Back to Edit').disabled).toBe(true)
    await click('Retry Confirmed Sale')
    expect(requests[1]).toEqual(requests[0])
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(2)
    expect(container.textContent).toContain('already recorded')
  })

  it('reports a post-commit refresh failure without offering to record the sale twice', async () => {
    const product = await businessService.addProduct({ name: 'Pillow', pricePesos: '350', openingStock: 3 })
    await render()
    await choose(product.name)
    await click('Record Sale')
    vi.spyOn(businessService, 'listSalesHistory').mockRejectedValueOnce(new Error('Read failed'))
    await click('Owner: Confirm Completed Sale')
    expect(container.textContent).toContain('Sale recorded.')
    expect(container.textContent).toContain('Unable to refresh business data')
    expect(await businessDb.sales.count()).toBe(1)
    await click('Retry Loading')
    expect(container.textContent).not.toContain('Unable to refresh business data')
    expect(await businessDb.sales.count()).toBe(1)
  })

  it('rejects stale stock at confirmation and allows the owner to edit the failed attempt', async () => {
    const product = await businessService.addProduct({ name: 'Pillow', pricePesos: '350', openingStock: 3 })
    await render()
    await choose(product.name)
    await change('Sale quantity', '3')
    await click('Record Sale')
    await businessService.adjustStock({ productId: product.id, quantity: 2, direction: 'remove', reason: 'Damaged' })
    await click('Owner: Confirm Completed Sale')
    expect(container.textContent).toContain('Insufficient stock')
    expect(await businessDb.sales.count()).toBe(0)
    await click('Back to Edit')
    await change('Sale quantity', '1')
    await click('Record Sale')
    await click('Owner: Confirm Completed Sale')
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(0)
    expect(container.textContent).toContain('Out of stock')
  })
})
