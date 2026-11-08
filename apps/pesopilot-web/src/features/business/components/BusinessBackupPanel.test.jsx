// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BusinessBackupPanel } from './BusinessBackupPanel.jsx'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from '../services/businessService.js'
import { businessBackupService } from '../services/businessBackupService.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
let root
let container
let refresh
beforeEach(async () => {
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  refresh = vi.fn().mockResolvedValue(undefined)
  await act(async () => root.render(<BusinessBackupPanel refresh={refresh} />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
})
async function settle(check) {
  let failure
  for (let attempt = 0; attempt < 100; attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 10)) })
    try { check(); return } catch (error) { failure = error }
  }
  throw failure
}
const button = (label) => [...container.querySelectorAll('button')].find((element) => element.textContent === label)
async function select(text, extra = {}) {
  await act(async () => {
    const input = container.querySelector('input[type="file"]')
    Object.defineProperty(input, 'files', { configurable: true,
      value: [{ name: 'business.json', size: text.length, text: async () => text, ...extra }] })
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
}

it('requires a validated file and explicit owner confirmation before replacing records once', async () => {
  const text = await businessBackupService.exportText()
  await businessService.addProduct({ name: 'Current stock', pricePesos: '10', openingStock: 5 })
  await select(text)
  await settle(() => expect(container.textContent).toContain('Backup validated'))
  expect(await businessDb.products.count()).toBe(1)
  expect(button('Replace Business Records').disabled).toBe(true)
  await act(async () => container.querySelector('input[type="checkbox"]').click())
  expect(button('Replace Business Records').disabled).toBe(false)
  await act(async () => { button('Replace Business Records').click(); button('Replace Business Records').click() })
  await settle(() => expect(container.textContent).toContain('replaced successfully'))
  expect(await businessDb.products.count()).toBe(0)
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(container.querySelector('input[type="checkbox"]')).toBeNull()
})

it('warns that restoring an older backup removes current photos before owner confirmation', async () => {
  const backup = JSON.parse(await businessBackupService.exportText())
  backup.version = 2
  backup.databaseVersion = 2
  delete backup.stores.productPhotos
  await select(JSON.stringify(backup))
  await settle(() => expect(container.textContent).toContain('older backup contains no photos'))
  expect(container.textContent).toContain('removes all current product photos')
  expect(button('Replace Business Records').disabled).toBe(true)
})

it('rejects corrupt files, clears earlier confirmation, and supports cancellation without mutation', async () => {
  await businessService.addProduct({ name: 'Preserved', pricePesos: '10' })
  const text = await businessBackupService.exportText()
  await select(text)
  await settle(() => expect(container.querySelector('input[type="checkbox"]')).not.toBeNull())
  await act(async () => container.querySelector('input[type="checkbox"]').click())
  await select('{"secret":"must never render"}')
  await settle(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
  expect(container.textContent).not.toContain('must never render')
  expect(container.querySelector('input[type="checkbox"]')).toBeNull()
  expect(await businessDb.products.count()).toBe(1)
  await select(text)
  await settle(() => expect(button('Cancel Restore')).toBeDefined())
  await act(async () => button('Cancel Restore').click())
  expect(container.querySelector('input[type="checkbox"]')).toBeNull()
  expect(await businessDb.products.count()).toBe(1)
})

it('rejects oversized files before reading them and reports post-commit refresh errors accurately', async () => {
  const fileRead = vi.fn()
  await select('', { size: 11 * 1024 * 1024, text: fileRead })
  await settle(() => expect(container.querySelector('[role="alert"]')).not.toBeNull())
  expect(fileRead).not.toHaveBeenCalled()
  await select(await businessBackupService.exportText())
  await settle(() => expect(container.querySelector('input[type="checkbox"]')).not.toBeNull())
  refresh.mockRejectedValueOnce(new Error('Read unavailable'))
  await act(async () => container.querySelector('input[type="checkbox"]').click())
  await act(async () => button('Replace Business Records').click())
  await settle(() => expect(container.textContent).toContain('Restore succeeded, but the display could not refresh'))
  expect(container.textContent).toContain('replaced successfully')
})
