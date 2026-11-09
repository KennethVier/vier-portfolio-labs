import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { posCatalogService } from './posCatalogService.js'
import { createSampleCatalog, populateCatalog } from './catalogTestFixture.js'
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

it('reads empty and mixed catalogs without creating or changing data', async () => {
  expect(posCatalogService.families(await businessService.listProducts())).toEqual([])
  expect(await businessDb.products.count()).toBe(0)
  const personal = await Promise.all(db.tables.map((table) => table.toArray()))
  await populateCatalog(true)
  const actual = await businessService.addProduct({ name: 'Shawl A', pricePesos: '99', openingStock: 2 })
  const products = await businessService.listProducts()
  const archived = products.find((row) => row.catalog?.sampleKey)
  await businessService.completeSale({ ownerConfirmed: true, paymentMethod: 'cash', requestKey: 'historic', items: [{ productId: archived.id, quantity: 1 }] })
  await businessService.completeSale({ ownerConfirmed: true, paymentMethod: 'coop', requestKey: 'real', items: [{ productId: actual.id, quantity: 1 }] })
  const before = await businessBackupRepository.read()
  expect(posCatalogService.families(products).flatMap((family) => family.products)).toEqual([products.find((row) => row.id === actual.id)])
  expect((await dailyAuditService.getReport(getManilaDate())).summary).toMatchObject({ totalCentavos: 9900, totalSold: 1, remainingQuantity: 1 })
  expect(await businessBackupRepository.read()).toEqual(before)
  expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(personal)
})

it('refuses actual products sharing sample stock and refuses forged sample metadata', async () => {
  await populateCatalog(true)
  const sample = (await businessService.listProducts())[0]
  await expect(businessService.addProduct({ name: 'Actual', pricePesos: '1', inventoryPoolId: sample.id })).rejects.toThrow('remain separate')
  await expect(businessService.addProduct({ name: 'Forged', pricePesos: '1', catalog: sample.catalog })).rejects.toThrow('Archived catalog')
  expect(await businessDb.products.count()).toBe(52)
})

it('round trips sample identity, independent stock, sales and audit through format 3', async () => {
  await populateCatalog(true)
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
  await populateCatalog(true)
  const before = await businessBackupRepository.read()
  const backup = JSON.parse(await businessBackupService.exportText())
  corrupt(backup)
  await expect(businessBackupService.prepareRestore(JSON.stringify(backup))).rejects.toThrow(/backup/i)
  expect(await businessBackupRepository.read()).toEqual(before)
})
