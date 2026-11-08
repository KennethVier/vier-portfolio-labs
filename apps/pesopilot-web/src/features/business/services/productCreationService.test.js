import { afterEach, beforeEach, expect, it } from 'vitest'
import { productCreationService } from './productCreationService.js'
import { businessService } from './businessService.js'
import { businessDb, createBusinessDb } from '../repositories/businessDb.js'
import { createBusinessRepository } from '../repositories/businessRepository.js'
import { businessBackupService } from './businessBackupService.js'
import { businessBackupRepository } from '../repositories/businessBackupRepository.js'
import { catalogMetadataSchema } from '../constants/catalogMetadata.js'
import { findDuplicateProduct, availableSharedStock } from '../constants/productCatalog.js'
import { productFamilyId } from '../constants/productPresentation.js'
import { db } from '@/lib/db/dexie.js'

beforeEach(async () => { await Promise.all(businessDb.tables.map((table) => table.clear())) })
afterEach(async () => { await Promise.all(businessDb.tables.map((table) => table.clear())) })

const cases = [
  ...[['Shawl A', 99], ['Shawl B', 199], ['Shawl C', 299]].map(([shawl, price]) => [
    { category: 'Shawls', shawl }, shawl, price, { category: 'Shawls', family: shawl },
  ]),
  ...['Eucalyptus', 'Lemon Grass', 'Turmeric', 'Lavender', 'Negative Ion'].flatMap((scent) => [
    [{ category: 'Hallelujah Inhaler', scent }, `Hallelujah Inhaler · ${scent}`, 99,
      { category: 'Hallelujah Inhaler', family: 'Hallelujah Inhaler', scent }],
    ...['Hallelujah Rub', 'Hallelujah Roll', 'Reigna Aroma Rub', 'Reigna Aroma Roll'].flatMap((category) => [
      [{ category, scent, type: 'Solo' }, `${category} · ${scent} · Solo`, 199, { category, family: category, scent, type: 'Solo' }],
      [{ category, scent, type: 'Set' }, `${category} · ${scent} · Set`, 150, { category, family: category, scent, type: 'Set' }],
    ]),
  ]),
  ...[['16x16 Throw Pillow', 499], ['17x24 Junior Size', 699], ['18x28 Queen Size', 799], ['20x30 King Size', 899]]
    .map(([size, price]) => [{ category: 'Magic Pillows', size }, size, price, { category: 'Magic Pillows', family: 'Magic Pillows', size }]),
]

it.each(cases)('derives exact details for %j and saves only on explicit request with zero opening stock', async (selection, name, price, catalog) => {
  const preview = productCreationService.preview({ ...selection, name: 'ignored', price: '1', sampleKey: 'ignored' })
  expect(preview).toEqual({ input: { name, pricePesos: price.toFixed(2), catalog }, unitPriceCentavos: price * 100 })
  expect(catalogMetadataSchema.safeParse(preview.input.catalog).success).toBe(true)
  expect(await businessDb.products.count()).toBe(0)
  const saved = await businessService.addProduct(preview.input)
  expect(saved).toMatchObject({ name, unitPriceCentavos: price * 100, catalog, stockQuantity: 0 })
  expect(saved.inventoryPoolId).toBe(saved.id)
  expect(await businessDb.inventoryMovements.count()).toBe(0)
})

it.each([
  {}, { category: 'unknown' }, { category: 'Shawls', shawl: 'Shawl D' },
  { category: 'Magic Pillows', size: 'huge' }, { category: 'Hallelujah Inhaler', scent: 'unlisted' },
  { category: 'Hallelujah Rub', scent: 'Lavender', type: 'Bundle' },
  { category: 'Other product', name: '', price: '10' }, { category: 'Other product', name: 'Item', price: '-1' },
  { category: 'Other product', name: 'Item', price: '1.234' },
])('refuses incomplete or unsupported selections without creating records: %j', async (selection) => {
  expect(productCreationService.preview(selection).error).toBeTruthy()
  expect(await businessDb.products.count()).toBe(0)
})

it('keeps custom names/prices editable without inventing metadata', async () => {
  const preview = productCreationService.preview({ category: 'Other product', name: '  Handwoven bag  ', price: '350.25' })
  expect(preview).toEqual({ input: { name: 'Handwoven bag', pricePesos: '350.25' }, unitPriceCentavos: 35025 })
  const saved = await businessService.addProduct(preview.input)
  expect(saved.catalog).toBeUndefined()
})

it('rejects a repeated explicit variant regardless of changed display name, price or pool choice', async () => {
  const input = productCreationService.preview({ category: 'Hallelujah Rub', scent: 'Lavender', type: 'Set' }).input
  const saved = await businessService.addProduct({ ...input, openingStock: 4 })
  const before = await businessBackupRepository.read()
  for (const changes of [{}, { name: 'Renamed', pricePesos: '200' }, { inventoryPoolId: saved.inventoryPoolId }]) {
    await expect(businessService.addProduct({ ...input, ...changes })).rejects.toThrow('already in your inventory')
  }
  expect(await businessBackupRepository.read()).toEqual(before)
})

it('normalizes custom-name whitespace/case, uses complete legacy names, and separates Actual/Sample identity', () => {
  const input = productCreationService.preview({ category: 'Hallelujah Rub', scent: 'Lavender', type: 'Solo' }).input
  expect(findDuplicateProduct([{ name: '  HALLELUJAH RUB · Lavender · Solo  ' }], input)).toBeTruthy()
  expect(findDuplicateProduct([{ name: ' Handwoven   BAG ' }], { name: 'handwoven bag' })).toBeTruthy()
  expect(findDuplicateProduct([{ ...input, catalog: { ...input.catalog, sampleKey: 'pos-demo-v1-rub' } }], input)).toBeUndefined()
  expect(findDuplicateProduct([{ name: 'Hallelujah Rub · Lemon Grass · Solo' }], input)).toBeUndefined()
})

it('prevents duplicate creation across independent IndexedDB connections with no extra opening stock', async () => {
  const otherDb = createBusinessDb(businessDb.name)
  try {
    const input = productCreationService.preview({ category: 'Shawls', shawl: 'Shawl A' }).input
    const first = await businessService.addProduct({ ...input, openingStock: 3 })
    await businessDb.products.clear()
    await businessDb.inventoryPools.clear()
    await businessDb.inventoryMovements.clear()
    await businessDb.auditEvents.clear()
    const results = await Promise.allSettled([
      createBusinessRepository(businessDb).addProduct(first),
      createBusinessRepository(otherDb).addProduct({ ...first, id: 'other-product', inventoryPoolId: 'other-product' }),
    ])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected').reason.message).toContain('already in your inventory')
    expect(await businessDb.products.count()).toBe(1)
    expect(await businessDb.inventoryPools.count()).toBe(1)
    expect(await businessDb.inventoryMovements.count()).toBe(1)
    expect(await businessDb.auditEvents.count()).toBe(1)
  } finally { otherDb.close() }
})

it('keeps scents and Solo/Set stock independent while retaining their photo family identity', async () => {
  const rows = []
  for (const [scent, type, openingStock] of [['Lavender', 'Solo', 3], ['Lavender', 'Set', 7], ['Turmeric', 'Solo', 2]]) {
    rows.push(await businessService.addProduct({ ...productCreationService.preview({ category: 'Hallelujah Rub', scent, type }).input, openingStock }))
  }
  expect(new Set(rows.map((row) => row.inventoryPoolId)).size).toBe(3)
  expect(new Set(rows.map(productFamilyId)).size).toBe(1)
  await businessService.completeSale({ ownerConfirmed: true, requestKey: 'independent', paymentMethod: 'cash', items: [{ productId: rows[0].id, quantity: 1 }] })
  expect(await Promise.all(rows.map(async (row) => (await businessDb.products.get(row.id)).stockQuantity))).toEqual([2, 7, 2])
})

it('uses the verified current shared quantity, never adds an opening balance, and rejects missing or invalid pools', async () => {
  const solo = await businessService.addProduct({ ...productCreationService.preview({ category: 'Reigna Aroma Roll', scent: 'Lavender', type: 'Solo' }).input, openingStock: 5 })
  const input = productCreationService.preview({ category: 'Reigna Aroma Roll', scent: 'Lavender', type: 'Set' }).input
  await businessService.adjustStock({ productId: solo.id, quantity: 2, direction: 'add', reason: 'Delivery before save' })
  const set = await businessService.addProduct({ ...input, inventoryPoolId: solo.inventoryPoolId })
  expect(set.stockQuantity).toBe(7)
  expect(await businessDb.inventoryPools.count()).toBe(1)
  expect(await businessDb.inventoryMovements.count()).toBe(2)
  await expect(businessService.addProduct({ name: 'New', pricePesos: '10', inventoryPoolId: 'missing' })).rejects.toThrow('not found')
  await expect(businessService.addProduct({ name: 'New', pricePesos: '10', inventoryPoolId: solo.id, openingStock: 1 })).rejects.toThrow('must not add opening stock')
  await businessDb.inventoryPools.update(solo.id, { stockQuantity: -1 })
  await expect(businessService.addProduct({ name: 'New', pricePesos: '10', inventoryPoolId: solo.id })).rejects.toThrow('quantity is invalid')
})

it('offers only coherent actual shared groups and rejects sample/malformed candidates', () => {
  const row = { inventoryPoolId: 'actual', inventoryPoolName: 'Actual', stockQuantity: 5 }
  expect(availableSharedStock([row, { ...row }, { ...row, inventoryPoolId: 'sample', catalog: { sampleKey: 'pos-demo-v1-x' } }])).toEqual([row])
  expect(availableSharedStock([row, { ...row, stockQuantity: 4 }])).toEqual([])
  expect(availableSharedStock([{ ...row, stockQuantity: NaN }])).toEqual([])
})

it('round trips guided metadata in the unchanged schema/backup format without touching Personal records', async () => {
  const personal = await Promise.all(db.tables.map((table) => table.toArray()))
  const preview = productCreationService.preview({ category: 'Magic Pillows', size: '20x30 King Size' })
  const product = await businessService.addProduct({ ...preview.input, openingStock: 2 })
  const text = await businessBackupService.exportText()
  expect(JSON.parse(text)).toMatchObject({ version: 3, databaseVersion: 3 })
  await businessBackupService.restore(await businessBackupService.prepareRestore(text), true)
  expect(await businessDb.products.get(product.id)).toMatchObject({ catalog: preview.input.catalog, stockQuantity: 2, unitPriceCentavos: 89900 })
  expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(personal)
})
