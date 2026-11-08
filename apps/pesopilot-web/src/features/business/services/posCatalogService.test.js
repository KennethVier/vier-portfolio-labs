import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { posCatalogService, createSampleCatalog } from './posCatalogService.js'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from './businessService.js'
import { businessBackupService } from './businessBackupService.js'
import { businessBackupRepository } from '../repositories/businessBackupRepository.js'
import { dailyAuditService, getManilaDate } from './dailyAuditService.js'
import { db } from '@/lib/db/dexie.js'

beforeEach(async () => { await Promise.all(businessDb.tables.map((table) => table.clear())) })
afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
})

it('defines the exact seven categories, names, prices and independent options', () => {
  const catalog = createSampleCatalog()
  expect(catalog).toHaveLength(52)
  expect(new Set(catalog.map((product) => product.catalog.sampleKey)).size).toBe(52)
  expect(catalog.slice(0, 3).map(({ name, unitPriceCentavos }) => [name, unitPriceCentavos])).toEqual([
    ['Shawl A', 9900], ['Shawl B', 19900], ['Shawl C', 29900],
  ])
  const categories = [...new Set(catalog.map((product) => product.catalog.category))]
  expect(categories).toEqual(['Shawls', 'Hallelujah Inhaler', 'Hallelujah Rub', 'Hallelujah Roll', 'Reigna Aroma Rub', 'Reigna Aroma Roll', 'Magic Pillows'])
  for (const category of categories.slice(1, 6)) {
    const products = catalog.filter((product) => product.catalog.category === category)
    expect([...new Set(products.map((product) => product.catalog.scent))]).toEqual(['Eucalyptus', 'Lemon Grass', 'Turmeric', 'Lavender', 'Negative Ion'])
    products.forEach((product) => expect(product.unitPriceCentavos).toBe(category === 'Hallelujah Inhaler' ? 9900 : product.catalog.type === 'Solo' ? 19900 : 15000))
  }
  expect(catalog.slice(-4).map(({ name, unitPriceCentavos }) => [name, unitPriceCentavos])).toEqual([
    ['16x16 Throw Pillow', 49900], ['17x24 Junior Size', 69900], ['18x28 Queen Size', 79900], ['20x30 King Size', 89900],
  ])
})

it('requires explicit confirmation and never seeds through list or catalog reads', async () => {
  expect(posCatalogService.families(await businessService.listProducts())).toEqual([])
  await expect(posCatalogService.loadSampleCatalog(false)).rejects.toThrow('Confirm')
  expect(await businessDb.products.count()).toBe(0)
})

it('refuses sample loading outside development even if called directly', async () => {
  vi.stubEnv('DEV', false)
  await expect(posCatalogService.loadSampleCatalog(true)).rejects.toThrow('only in development')
  expect(await businessDb.products.count()).toBe(0)
})

it('does not overwrite a conflicting sample identifier and rolls back earlier inserts', async () => {
  const actual = await businessService.addProduct({ name: 'Existing actual', pricePesos: '1', openingStock: 3 })
  // A restored record may occupy the deterministic namespace without being a sample.
  const conflict = createSampleCatalog().at(-1).catalog.sampleKey
  await businessDb.products.add({ ...actual, id: conflict })
  const before = await businessBackupRepository.read()
  await expect(posCatalogService.loadSampleCatalog(true)).rejects.toThrow('conflicts')
  expect(await businessBackupRepository.read()).toEqual(before)
})

it('seeds atomically and idempotently even for concurrent requests, preserving actual and sold sample stock', async () => {
  const before = await Promise.all(db.tables.map((table) => table.toArray()))
  const actual = await businessService.addProduct({ name: 'Shawl A', pricePesos: '99', openingStock: 7 })
  expect(await Promise.all([posCatalogService.loadSampleCatalog(true), posCatalogService.loadSampleCatalog(true)])).toEqual([52, 0])
  const samples = (await businessService.listProducts()).filter((product) => product.catalog?.sampleKey)
  expect(new Set(samples.map((product) => product.inventoryPoolId)).size).toBe(52)
  const set = samples.find((product) => product.catalog.family === 'Hallelujah Rub' && product.catalog.type === 'Set')
  await businessService.completeSale({ ownerConfirmed: true, paymentMethod: 'coop', requestKey: 'sample', items: [{ productId: set.id, quantity: 2 }] })
  expect(await posCatalogService.loadSampleCatalog(true)).toBe(0)
  expect((await businessDb.products.get(set.id)).stockQuantity).toBe(18)
  expect((await businessDb.products.get(actual.id)).stockQuantity).toBe(7)
  expect((await businessService.listSalesHistory())[0].items[0].productNameSnapshot).toMatch(/^Sample/)
  const report = await dailyAuditService.getReport(getManilaDate())
  expect(report.summary).toMatchObject({ totalCentavos: 30000, totalSold: 2, remainingQuantity: 1045 })
  expect(report.groups.find((group) => group.id === set.inventoryPoolId).remainingQuantity).toBe(18)
  expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(before)
})

it('rolls the entire sample insertion back on a late write failure', async () => {
  const fail = () => { throw new Error('Storage failure') }
  businessDb.auditEvents.hook('creating', fail)
  try { await expect(posCatalogService.loadSampleCatalog(true)).rejects.toThrow('Storage failure') }
  finally { businessDb.auditEvents.hook('creating').unsubscribe(fail) }
  expect(await Promise.all(businessDb.tables.map((table) => table.count()))).toEqual([0, 0, 0, 0, 0, 0, 0])
})

it('filters categories and search while preserving complete variant choices and separating actual stock', async () => {
  await posCatalogService.loadSampleCatalog(true)
  const actual = await businessService.addProduct({ name: 'Hallelujah Rub', pricePesos: '10', openingStock: 1 })
  const products = await businessService.listProducts()
  expect(posCatalogService.families(products).map((family) => family.products[0].id)).toEqual([actual.id])
  const families = posCatalogService.families(products, { sample: true, category: 'Hallelujah Rub', search: ' LAVENDER ' })
  expect(families).toHaveLength(1)
  expect(families[0].products).toHaveLength(10)
  expect(posCatalogService.families(products, { sample: true, search: '20x30' })[0].name).toBe('Magic Pillows')
  expect(posCatalogService.families(products, { sample: true, search: 'unknown' })).toEqual([])
})

it('refuses actual products sharing sample stock and refuses forged sample metadata', async () => {
  await posCatalogService.loadSampleCatalog(true)
  const sample = (await businessService.listProducts())[0]
  await expect(businessService.addProduct({ name: 'Actual', pricePesos: '1', inventoryPoolId: sample.id })).rejects.toThrow('remain separate')
  await expect(businessService.addProduct({ name: 'Forged', pricePesos: '1', catalog: sample.catalog })).rejects.toThrow('Load Sample Catalog')
  expect(await businessDb.products.count()).toBe(52)
})

it('round trips sample identity, independent stock, sales and audit through format 3', async () => {
  await posCatalogService.loadSampleCatalog(true)
  const product = (await businessService.listProducts())[0]
  await businessService.completeSale({ ownerConfirmed: true, requestKey: 'round-trip', paymentMethod: 'gcash', items: [{ productId: product.id, quantity: 3 }] })
  const before = await businessBackupRepository.read()
  const audit = await dailyAuditService.getReport(getManilaDate())
  const text = await businessBackupService.exportText()
  expect(JSON.parse(text).version).toBe(3)
  await businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'add', reason: 'fictional' })
  await businessBackupService.restore(await businessBackupService.prepareRestore(text), true)
  expect(await businessBackupRepository.read()).toEqual(before)
  expect(await dailyAuditService.getReport(getManilaDate())).toEqual(audit)
  expect(await posCatalogService.loadSampleCatalog(true)).toBe(0)
})

it('restores legacy format 1 without invented variant metadata, then exports format 3', async () => {
  await businessService.addProduct({ name: 'Legacy Solo', pricePesos: '199', openingStock: 4 })
  const backup = JSON.parse(await businessBackupService.exportText())
  backup.version = 1
  backup.databaseVersion = 2
  delete backup.stores.productPhotos
  const plan = await businessBackupService.prepareRestore(JSON.stringify(backup))
  await businessBackupService.restore(plan, true)
  expect((await businessService.listProducts())[0].catalog).toBeUndefined()
  expect(JSON.parse(await businessBackupService.exportText()).version).toBe(3)
})

it.each([
  ['unknown metadata', (backup) => { backup.stores.products[0].catalog.script = '<script>' }],
  ['invalid type', (backup) => { backup.stores.products[0].catalog.type = 'Bundle' }],
  ['changed sample identity', (backup) => { backup.stores.products[0].catalog.sampleKey += '-forged' }],
  ['metadata in legacy format', (backup) => { backup.version = 1 }],
])('rejects %s in backups before any writes', async (_, corrupt) => {
  await posCatalogService.loadSampleCatalog(true)
  const before = await businessBackupRepository.read()
  const backup = JSON.parse(await businessBackupService.exportText())
  corrupt(backup)
  await expect(businessBackupService.prepareRestore(JSON.stringify(backup))).rejects.toThrow(/backup/i)
  expect(await businessBackupRepository.read()).toEqual(before)
})
