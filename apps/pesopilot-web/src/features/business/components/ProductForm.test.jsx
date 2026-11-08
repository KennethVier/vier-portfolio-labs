// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ProductForm } from './ProductForm.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root
let container
let addProduct

function field(label) {
  const parent = [...container.querySelectorAll('label')].find((node) => node.textContent.startsWith(label))
  if (!parent) throw new Error(`Missing field ${label}`)
  return parent.querySelector('input, select')
}
async function change(label, value) {
  await act(async () => {
    const element = field(label)
    const prototype = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value)
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
}
async function render(products = [], disabled = false) {
  await act(async () => root.render(<ProductForm products={products} addProduct={addProduct} disabled={disabled} />))
}
async function save(twice = false) {
  await act(async () => {
    container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    if (twice) container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  addProduct = vi.fn().mockResolvedValue({})
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
})

const cases = [
  ['Shawls', [['Shawl', 'Shawl B']], 'Shawl B', '199.00', { category: 'Shawls', family: 'Shawl B' }],
  ['Hallelujah Inhaler', [['Scent', 'Negative Ion']], 'Hallelujah Inhaler · Negative Ion', '99.00', { category: 'Hallelujah Inhaler', family: 'Hallelujah Inhaler', scent: 'Negative Ion' }],
  ...['Hallelujah Rub', 'Hallelujah Roll', 'Reigna Aroma Rub', 'Reigna Aroma Roll'].map((category) => [
    category, [['Scent', 'Lavender'], ['Solo / Set', 'Set']], `${category} · Lavender · Set`, '150.00', { category, family: category, scent: 'Lavender', type: 'Set' },
  ]),
  ['Magic Pillows', [['Pillow size', '18x28 Queen Size']], '18x28 Queen Size', '799.00', { category: 'Magic Pillows', family: 'Magic Pillows', size: '18x28 Queen Size' }],
  ['Other product', [['Custom product name', 'Handwoven bag'], ['Custom unit price', '350.25']], 'Handwoven bag', '350.25', undefined],
]

it('begins with only a category selector and never loads or inserts any records automatically', async () => {
  await render()
  expect(container.querySelectorAll('select')).toHaveLength(1)
  expect(container.querySelectorAll('input')).toHaveLength(0)
  expect([...field('Product Category').options].map((option) => option.textContent)).toEqual([
    'Choose a category', 'Shawls', 'Hallelujah Inhaler', 'Hallelujah Rub', 'Hallelujah Roll', 'Reigna Aroma Rub', 'Reigna Aroma Roll', 'Magic Pillows', 'Other product',
  ])
  expect(container.textContent).not.toMatch(/POS category & variant options|Product family|Inventory pool|Load Sample/)
  expect(addProduct).not.toHaveBeenCalled()
})

it.each(cases)('guides %s with relevant fields, price, summary and zero-stock explicit save', async (category, fields, name, price, catalog) => {
  await render()
  await change('Product Category', category)
  expect(field('Opening Stock Quantity').value).toBe('0')
  expect(container.querySelector('details').open).toBe(false)
  expect(container.querySelector('button[type="submit"]').disabled).toBe(true)
  for (const [label, value] of fields) await change(label, value)
  expect(container.querySelector('[aria-label="Product summary"]').textContent).toContain(name)
  expect(container.querySelector('[aria-label="Product summary"]').textContent).toContain(price)
  if (category !== 'Other product') {
    expect(field('Unit price').value).toBe(price)
    expect(field('Unit price').readOnly).toBe(true)
  }
  if (category === 'Shawls' || category === 'Magic Pillows' || category === 'Other product') {
    expect(() => field('Scent')).toThrow('Missing field')
    expect(() => field('Solo / Set')).toThrow('Missing field')
  }
  if (category === 'Hallelujah Inhaler') expect(() => field('Solo / Set')).toThrow('Missing field')
  expect(addProduct).not.toHaveBeenCalled()
  await save(true)
  expect(addProduct).toHaveBeenCalledTimes(1)
  expect(addProduct).toHaveBeenCalledWith({ name, pricePesos: price, openingStock: 0, ...(catalog ? { catalog } : {}) })
  expect(field('Product Category').value).toBe('')
  expect(container.querySelector('[role="status"]').textContent).toContain('Product photos below')
})

it('updates Solo/Set prices and clears irrelevant selections and stock on category change', async () => {
  await render()
  await change('Product Category', 'Hallelujah Rub')
  await change('Scent', 'Turmeric')
  await change('Solo / Set', 'Solo')
  expect(field('Unit price').value).toBe('199.00')
  await change('Solo / Set', 'Set')
  expect(field('Unit price').value).toBe('150.00')
  await change('Opening Stock Quantity', '7')
  await change('Product Category', 'Magic Pillows')
  expect(field('Opening Stock Quantity').value).toBe('0')
  expect(field('Pillow size').value).toBe('')
  await change('Pillow size', '20x30 King Size')
  await save()
  expect(addProduct.mock.calls[0][0].catalog).toEqual({ category: 'Magic Pillows', family: 'Magic Pillows', size: '20x30 King Size' })
})

it('blocks an existing variant using metadata even if its display name and price differ', async () => {
  await render([{ id: 'saved', name: 'Existing lavender', unitPriceCentavos: 100,
    catalog: { category: 'Hallelujah Rub', family: 'Hallelujah Rub', scent: 'Lavender', type: 'Set' } }])
  await change('Product Category', 'Hallelujah Rub')
  await change('Scent', 'Lavender')
  await change('Solo / Set', 'Set')
  expect(container.querySelector('[role="alert"]').textContent).toContain('already in your inventory')
  expect(container.querySelector('button[type="submit"]').disabled).toBe(true)
  await save()
  expect(addProduct).not.toHaveBeenCalled()
})

it('shares stock only after an explicit Advanced selection, submits zero opening stock and keeps photos optional', async () => {
  const existing = { id: 'solo', name: 'Solo', inventoryPoolId: 'verified', inventoryPoolName: 'Existing rolls', stockQuantity: 5 }
  await render([existing, { ...existing, id: 'sample', inventoryPoolId: 'sample-pool', inventoryPoolName: 'Fictional', catalog: { sampleKey: 'pos-demo-v1-x' } }])
  await change('Product Category', 'Hallelujah Roll')
  await change('Scent', 'Lavender')
  await change('Solo / Set', 'Set')
  await change('Opening Stock Quantity', '9')
  expect(field('Use existing stock group').value).toBe('')
  await act(async () => container.querySelector('details summary').click())
  expect([...field('Use existing stock group').options].map((option) => option.value)).toEqual(['', 'verified'])
  await change('Use existing stock group', 'verified')
  expect(() => field('Opening Stock Quantity')).toThrow('Missing field')
  expect(container.textContent).toContain('No opening stock will be added')
  expect(container.querySelector('[aria-label="Product summary"]').textContent).toContain('5 available. No quantity added.')
  expect(container.querySelector('a[href="#product-photos"]')).not.toBeNull()
  expect(container.querySelector('input[type="file"]')).toBeNull()
  await save()
  expect(addProduct.mock.calls[0][0]).toMatchObject({ inventoryPoolId: 'verified', openingStock: 0 })
})

it('blocks a stale shared-stock choice and reports write errors without losing the draft', async () => {
  await render([{ id: 'old', name: 'Old', inventoryPoolId: 'old', inventoryPoolName: 'Old stock', stockQuantity: 3 }])
  await change('Product Category', 'Other product')
  await change('Custom product name', 'New')
  await change('Custom unit price', '50')
  await change('Use existing stock group', 'old')
  await render([])
  expect(container.querySelector('[role="alert"]').textContent).toContain('shared stock is unavailable')
  await save()
  expect(addProduct).not.toHaveBeenCalled()
  await change('Use existing stock group', '')
  addProduct.mockRejectedValueOnce(new Error('This product is already in your inventory.'))
  await save()
  expect(container.querySelector('[role="alert"]').textContent).toContain('already in your inventory')
  expect(field('Custom product name').value).toBe('New')
})
