// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessDashboardPage } from '../pages/BusinessDashboardPage.jsx'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from '../services/businessService.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let container
let root

function field(label) {
  const element = [...container.querySelectorAll('label')].find((item) => item.textContent.includes(label))
  if (!element) throw new Error(`Missing field: ${label}`)
  return element.querySelector('input, select')
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

async function render() {
  await act(async () => { root.render(<MemoryRouter><BusinessDashboardPage /></MemoryRouter>) })
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
  it('shows practical empty states and the access warning without salary setup', async () => {
    await render()
    expect(container.textContent).toContain('No products yet')
    expect(container.textContent).toContain('No completed sales yet')
    expect(container.textContent).toContain('do not provide secure account access')
    expect(container.textContent).not.toContain('No Current Cutoff')
    expect([...field('Payment method').options].map((option) => option.value)).toEqual(['cash', 'gcash', 'coop'])
  })

  it('creates a shared variant and records owner-confirmed GCash with its own label', async () => {
    const product = await businessService.addProduct({ name: 'Roll-On Solo', pricePesos: '199', openingStock: 5, inventoryPoolName: 'Roll-On' })
    await render()
    await change('Product name', 'Roll-On Set')
    await change('Unit price', '150')
    await change('Inventory pool', product.inventoryPoolId)
    expect([...container.querySelectorAll('label')].some((label) => label.textContent.includes('Opening quantity'))).toBe(false)
    await click('Save Product')
    const variant = (await businessService.listProducts()).find((item) => item.name === 'Roll-On Set')
    await change('Sale product', variant.id)
    await change('Payment method', 'gcash')
    await click('Review Sale')
    expect(container.textContent).toContain('Payment method: GCash')
    await click('Owner: Confirm Completed Sale')
    expect((await businessService.listSales())[0]).toMatchObject({ paymentMethod: 'gcash', totalCentavos: 15000 })
    expect((await businessService.listProducts()).map((item) => item.stockQuantity)).toEqual([4, 4])
    expect(container.querySelector('details').closest('tr').textContent).toContain('GCash')
  })

  it('creates a product, adjusts stock with a reason, previews and explicitly confirms Coop once', async () => {
    await render()
    await change('Product name', 'Pillow')
    await change('Unit price', '350.25')
    await change('Opening quantity', '5')
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
    await change('Sale product', product.id)
    await change('Sale quantity', '2')
    await change('Payment method', 'coop')
    expect(container.textContent).toContain('700.50')
    await click('Review Sale')
    expect(container.textContent).toContain('Confirm completed sale')
    expect(await businessDb.sales.count()).toBe(0)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(4)
    await click('Owner: Confirm Completed Sale', true)
    await waitFor(() => expect(container.textContent).toContain('Sale recorded.'))
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(2)
    expect((await businessService.listSalesHistory())[0]).toMatchObject({ paymentMethod: 'coop', totalCentavos: 70050 })
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
    await change('Sale product', product.id)
    await click('Review Sale')
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
    await change('Sale product', product.id)
    await click('Review Sale')
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
    await change('Sale product', product.id)
    await change('Sale quantity', '3')
    await click('Review Sale')
    await businessService.adjustStock({ productId: product.id, quantity: 2, direction: 'remove', reason: 'Damaged' })
    await click('Owner: Confirm Completed Sale')
    expect(container.textContent).toContain('Insufficient stock')
    expect(await businessDb.sales.count()).toBe(0)
    await click('Back to Edit')
    await change('Sale quantity', '1')
    await click('Review Sale')
    await click('Owner: Confirm Completed Sale')
    expect(await businessDb.sales.count()).toBe(1)
    expect((await businessDb.products.get(product.id)).stockQuantity).toBe(0)
    expect(container.textContent).toContain('Out of stock')
  })
})
