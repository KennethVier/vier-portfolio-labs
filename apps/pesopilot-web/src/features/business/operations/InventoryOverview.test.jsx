// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { InventoryOverview } from './InventoryOverview.jsx'
import { inventoryOverviewRows } from './inventoryOverview.js'
let root, container
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  container?.remove()
})
const product = {
  id: 'solo',
  name: 'Hallelujah Rub Lavender Solo',
  inventoryPoolId: 'pool',
  unitPriceCentavos: 19900,
  catalog: {
    category: 'Hallelujah Rub',
    family: 'Hallelujah Rub',
    scent: 'Lavender',
    type: 'Solo',
  },
}
const views = ['A', 'B'].map((id) => ({
  branch: { id, name: 'Branch ' + id },
  products: [
    product,
    {
      ...product,
      id: 'set',
      unitPriceCentavos: 15000,
      catalog: { ...product.catalog, type: 'Set' },
    },
  ],
  pools: [{ id: 'pool', stockQuantity: id === 'A' ? 8 : 0 }],
}))
it('counts each authorized branch/pool once, retains Solo/Set prices, and never substitutes zero for an unavailable balance', () => {
  const rows = inventoryOverviewRows(views)
  expect(rows).toHaveLength(2)
  expect(rows.map((row) => row.available)).toEqual([8, 0])
  expect(rows[0].products).toHaveLength(2)
  expect(rows[0].shared).toBe(true)
  expect(inventoryOverviewRows([{ ...views[0], pools: [] }])[0]).toMatchObject({
    available: null,
    status: 'Unavailable',
  })
  expect(
    inventoryOverviewRows([
      { ...views[0], pools: [{ id: 'pool', stockQuantity: -1 }] },
    ])[0].status,
  ).toBe('Needs review')
})
it('renders accessible columns, accurate totals, search/status/category filters and an iPad scroll region', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <InventoryOverview overviews={views} branchId="" setBranchId={vi.fn()} />,
    ),
  )
  expect(container.querySelectorAll('thead th[scope=col]')).toHaveLength(7)
  expect(container.textContent).toContain('2 stock groups · 8 recorded units')
  expect(container.textContent).toContain('Set: ₱150.00')
  expect(container.querySelector('[role=region]').className).toContain(
    'overflow-x-auto',
  )
  expect(container.querySelector('table').className).toContain('min-w-')
  await act(async () => {
    const input = container.querySelector('[type=search]')
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    ).set.call(input, 'Branch B')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(container.querySelector('tbody').textContent).toContain('Out of stock')
  async function select(label, value) {
    const control = [...container.querySelectorAll('label')]
      .find((node) => node.textContent.startsWith(label))
      .querySelector('select')
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      ).set.call(control, value)
      control.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
  await act(async () => {
    const input = container.querySelector('[type=search]')
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    ).set.call(input, '')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const pillow = {
    ...product,
    id: 'pillow',
    inventoryPoolId: 'pillow',
    name: 'Magic Pillow',
    catalog: {
      category: 'Magic Pillows',
      family: 'Magic Pillows',
      size: '16x16',
    },
  }
  const expanded = [
    {
      ...views[0],
      products: [...views[0].products, pillow],
      pools: [...views[0].pools, { id: 'pillow', stockQuantity: 3 }],
    },
    views[1],
  ]
  await act(async () =>
    root.render(
      <InventoryOverview
        overviews={expanded}
        branchId=""
        setBranchId={vi.fn()}
      />,
    ),
  )
  expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
  await select('Category', 'Hallelujah Rub')
  expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
  await select('Stock status', 'Out of stock')
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(container.querySelector('tbody').textContent).toContain('Branch B')
  await select('Stock status', '')
  await act(async () =>
    root.render(
      <InventoryOverview
        overviews={expanded}
        branchId="A"
        setBranchId={vi.fn()}
      />,
    ),
  )
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1)
  expect(container.querySelector('tbody').textContent).toContain('Branch A')
})
