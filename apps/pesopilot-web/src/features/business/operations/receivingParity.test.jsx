// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { StaffInventory } from './StaffInventory.jsx'
import { Phase0InventoryPanel } from '../components/__fixtures__/Phase0InventoryPanel.jsx'
import { Phase0DailyStock } from '../components/__fixtures__/Phase0DailyStock.jsx'
import { standardCatalogDefinitions } from './standardCatalog.js'
let root, container
const products = standardCatalogDefinitions([])
  .filter((p) => p.catalog?.type !== 'Set')
  .map((p) => ({ ...p, stockQuantity: 10 }))
afterEach(async () => {
  if (root) await act(async () => root.unmount())
  container?.remove()
  root = null
})
async function render(element) {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  if (!root) {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  }
  await act(async () => root.render(element))
}
function layout() {
  const form = container.querySelector('details form'),
    grid = form.querySelector('.grid')
  return {
    stockHeading: container.querySelector('h2').textContent,
    cardClass: container.firstElementChild.className,
    searchLabel: [...container.querySelectorAll('label')].find((n) =>
      n.textContent.includes('Find stock'),
    ).textContent,
    groupClass: form.querySelector('select').className,
    options: [...form.querySelectorAll('select option')].map(
      (n) => n.textContent,
    ),
    gridClass: grid.className,
    rows: [...grid.querySelectorAll('label')].map((n) => ({
      label: n.textContent,
      inputClass: n.querySelector('input').className,
      min: n.querySelector('input').min,
      step: n.querySelector('input').step,
    })),
    correction: [...container.querySelectorAll('summary')].find(
      (n) => n.textContent === 'Correct stock',
    ).className,
  }
}
it('matches the actual Phase 0 component layout/classes at the receiving controls and retains a single secondary correction form', async () => {
  await render(
    <Phase0InventoryPanel products={products} adjustStock={vi.fn()}>
      <Phase0DailyStock products={products} receiveStock={vi.fn()} />
    </Phase0InventoryPanel>,
  )
  const reference = layout()
  const groups = [
    ...container.querySelector('details form select').options,
  ].map((option) => option.value)
  async function chooseGroup(value) {
    const select = container.querySelector('details form select')
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        'value',
      ).set.call(select, value)
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
  }
  const referenceGroups = new Map()
  for (const name of groups) {
    await chooseGroup(name)
    referenceGroups.set(name, layout())
  }
  await render(
    <StaffInventory
      work={{
        products,
        branches: [{ id: 'A', name: 'Branch A' }],
        branchId: 'A',
        service: { adjustStock: vi.fn() },
        receiveStock: vi.fn(),
      }}
    />,
  )
  expect(layout()).toEqual(reference)
  for (const name of groups) {
    await chooseGroup(name)
    expect(layout()).toEqual(referenceGroups.get(name))
  }
  expect(
    container.querySelectorAll('form[aria-label="Grouped stock delivery"]'),
  ).toHaveLength(1)
  expect(container.querySelectorAll('form')).toHaveLength(2)
  expect(container.textContent).not.toContain('Receive or remove stock')
  expect(container.textContent).not.toContain('Set unit costs')
  expect(container.querySelector('details').open).toBe(true)
  expect(
    [...container.querySelectorAll('details')].find(
      (n) => n.querySelector('summary').textContent === 'Correct stock',
    ).open,
  ).toBe(false)
})
it('preserves quantities across product groups and search, then confirms unequal rows once with branch, reason and a stable retry key', async () => {
  const receive = vi
    .fn()
    .mockRejectedValueOnce(new Error('Synthetic local failure'))
    .mockResolvedValue({})
  await render(
    <StaffInventory
      work={{
        products,
        branches: [{ id: 'A', name: 'Branch A' }],
        branchId: 'A',
        service: { adjustStock: vi.fn() },
        receiveStock: receive,
      }}
    />,
  )
  const form = container.querySelector('[aria-label="Grouped stock delivery"]')
  async function change(input, value) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        input.tagName === 'SELECT'
          ? window.HTMLSelectElement.prototype
          : window.HTMLInputElement.prototype,
        'value',
      ).set.call(input, value)
      input.dispatchEvent(
        new Event(input.tagName === 'SELECT' ? 'change' : 'input', {
          bubbles: true,
        }),
      )
    })
  }
  await change(form.querySelector('[type=number]'), '10')
  await change(form.querySelector('select'), 'Magic Pillows')
  await change(form.querySelector('[type=number]'), '2')
  await change(form.querySelector('[name=receiptReason]'), 'Delivery checked')
  await act(async () =>
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    ),
  )
  expect(receive).not.toHaveBeenCalled()
  expect(
    container.querySelector('[aria-label="Review delivery"]').textContent,
  ).toContain('Branch A')
  const confirm = () =>
    [...container.querySelectorAll('button')].find(
      (n) => n.textContent === 'Confirm delivery',
    )
  await act(async () => confirm().click())
  expect(container.textContent).toContain('Synthetic local failure')
  await act(async () => {
    confirm().click()
    confirm().click()
  })
  expect(receive).toHaveBeenCalledTimes(2)
  expect(receive.mock.calls[0]).toEqual(receive.mock.calls[1])
  expect(receive.mock.calls[1][0].map((row) => row.quantity)).toEqual([10, 2])
  expect(receive.mock.calls[1][1]).toMatchObject({
    reason: 'Delivery checked',
    requestKey: expect.any(String),
  })
})
