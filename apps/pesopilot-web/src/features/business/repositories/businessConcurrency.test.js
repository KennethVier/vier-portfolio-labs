import { afterEach, beforeEach, expect, it } from 'vitest'
import { businessDb, createBusinessDb } from './businessDb.js'
import { createBusinessRepository } from './businessRepository.js'
import { businessService } from '../services/businessService.js'
import { businessBackupService } from '../services/businessBackupService.js'
import { businessBackupRepository } from './businessBackupRepository.js'

let otherDb
let other
beforeEach(async () => {
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  otherDb = createBusinessDb(businessDb.name)
  await otherDb.open()
  other = createBusinessRepository(otherDb)
})
afterEach(async () => {
  otherDb.close()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
})

const request = (product, requestKey = 'same-key') => ({
  sale: { id: crypto.randomUUID(), requestKey, paymentMethod: 'gcash', confirmedAt: new Date().toISOString() },
  items: [{ productId: product.id, quantity: 2, expectedUnitPriceCentavos: product.unitPriceCentavos }],
})

it('deduplicates the same key across independent IndexedDB connections', async () => {
  const product = await businessService.addProduct({ name: 'Solo', pricePesos: '9.99', openingStock: 2 })
  const results = await Promise.all([
    createBusinessRepository(businessDb).commitConfirmedSale(request(product)), other.commitConfirmedSale(request(product)),
  ])
  expect(results.map((result) => result.duplicate).sort()).toEqual([false, true])
  expect(await businessDb.sales.count()).toBe(1)
  expect((await otherDb.inventoryPools.get(product.id)).stockQuantity).toBe(0)
})

it('serializes competing shared-variant sales across connections without overselling', async () => {
  const solo = await businessService.addProduct({ name: 'Solo', pricePesos: '9.99', openingStock: 3 })
  const set = await businessService.addProduct({ name: 'Set', pricePesos: '19.99', inventoryPoolId: solo.id })
  const results = await Promise.allSettled([
    createBusinessRepository(businessDb).commitConfirmedSale(request(solo, 'solo')), other.commitConfirmedSale(request(set, 'set')),
  ])
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
  expect(await businessDb.sales.count()).toBe(1)
  expect((await businessService.listProducts()).map((product) => product.stockQuantity)).toEqual([1, 1])
})

it('refuses replacement when another connection commits after owner review', async () => {
  const product = await businessService.addProduct({ name: 'Solo', pricePesos: '9.99', openingStock: 3 })
  const plan = await businessBackupService.prepareRestore(await businessBackupService.exportText())
  await other.commitConfirmedSale(request(product))
  const before = await businessBackupRepository.read()
  await expect(businessBackupService.restore(plan, true)).rejects.toThrow('Business data changed')
  expect(await businessBackupRepository.read()).toEqual(before)
})
