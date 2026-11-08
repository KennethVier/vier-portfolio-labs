// @vitest-environment happy-dom
import Dexie from 'dexie'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { businessDb, createBusinessDb } from '../repositories/businessDb.js'
import { productPhotoRepository } from '../repositories/productPhotoRepository.js'
import { businessBackupRepository } from '../repositories/businessBackupRepository.js'
import { businessService } from './businessService.js'
import { businessBackupService } from './businessBackupService.js'
import { posCatalogService } from './posCatalogService.js'
import { productFamilyId, PRODUCT_PHOTO_MAX_INPUT, PRODUCT_PHOTO_MAX_BYTES } from '../constants/productPresentation.js'
import { processProductPhoto, productPhotoService, validatePhotoFile } from './productPhotoService.js'
import { fixturePhoto, jpegDataUrl } from './productPhotoFixture.js'
import { validateProductPhoto } from './productPhotoValidation.js'
import { db } from '@/lib/db/dexie.js'

let dimensions
let decodeFailure
let drawImage
let fillRect
let canvasSize
beforeEach(async () => {
  await Promise.all(businessDb.tables.map((table) => table.clear()))
  dimensions = [16, 12]
  decodeFailure = false
  // happy-dom has no image/canvas codec. Exercise the real processing flow with
  // controlled platform APIs; physical browser decoding remains manual QA.
  vi.stubGlobal('Image', class {
    constructor() { [this.naturalWidth, this.naturalHeight] = dimensions }
    set src(value) { queueMicrotask(() => { if (decodeFailure) this.onerror(); else this.onload() }); this.source = value }
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-test')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  drawImage = vi.fn()
  fillRect = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect, drawImage })
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function () {
    canvasSize = [this.width, this.height]
    return jpegDataUrl
  })
})
afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await Promise.all(businessDb.tables.map((table) => table.clear()))
})
const product = (name = 'Rub', catalog) => businessService.addProduct({ name, catalog, pricePesos: '199', openingStock: 5 })
const file = (type = 'image/jpeg') => new File(['test pixels'], 'photo', { type })

it.each(['image/jpeg', 'image/png', 'image/webp'])('processes %s locally, previews safe JPEG data and releases object URLs', async (type) => {
  const photo = await processProductPhoto(file(type), 'family')
  expect(photo).toEqual(fixturePhoto('family'))
  expect(fillRect).toHaveBeenCalled()
  expect(drawImage).toHaveBeenCalled()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local-test')
})

it.each(['image/svg+xml', 'text/html', 'image/gif', '', 'image/heic'])('rejects unsupported type %s before decoding', (type) => {
  expect(() => validatePhotoFile(file(type))).toThrow('JPEG, PNG or WebP')
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

it('rejects empty and oversized files before processing', () => {
  for (const size of [0, PRODUCT_PHOTO_MAX_INPUT + 1]) {
    expect(() => validatePhotoFile({ type: 'image/png', size })).toThrow('2 MiB')
  }
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

it('scales the longest edge to 960 without cropping or enlargement', async () => {
  dimensions = [1920, 1440]
  await expect(processProductPhoto(file(), 'family')).rejects.toThrow('Invalid product photo')
  // The fixture encodes 16x12, so metadata validation deliberately rejects the
  // stubbed output; the requested canvas dimensions still prove resize math.
  expect(canvasSize).toEqual([960, 720])
  expect(drawImage.mock.calls[0].slice(1)).toEqual([0, 0, 960, 720])
})

it('rejects corrupt files, oversized decoded input and oversized processed output, cleaning URLs on every path', async () => {
  decodeFailure = true
  await expect(processProductPhoto(file(), 'family')).rejects.toThrow('could not be read')
  decodeFailure = false
  dimensions = [10000, 10000]
  await expect(processProductPhoto(file(), 'family')).rejects.toThrow('32 megapixels')
  dimensions = [16, 12]
  HTMLCanvasElement.prototype.toDataURL.mockReturnValue(`data:image/jpeg;base64,${btoa('x'.repeat(PRODUCT_PHOTO_MAX_BYTES + 1))}`)
  await expect(processProductPhoto(file(), 'family')).rejects.toThrow('too detailed')
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(3)
})

it('supports absent photos, upload, replacement, removal and persistence through a repository reopen', async () => {
  const personal = await Promise.all(db.tables.map((table) => table.toArray()))
  const item = await product()
  const familyId = productFamilyId(item)
  expect(await productPhotoService.list()).toEqual([])
  await productPhotoService.upload(file(), familyId)
  await productPhotoService.upload(file('image/png'), familyId)
  expect(await productPhotoService.list()).toEqual([fixturePhoto(familyId)])
  businessDb.close()
  await businessDb.open()
  expect(await productPhotoService.list()).toEqual([fixturePhoto(familyId)])
  await productPhotoService.remove(familyId)
  expect(await productPhotoService.list()).toEqual([])
  expect((await businessDb.products.get(item.id)).stockQuantity).toBe(5)
  expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(personal)
})

it('shares one photo across explicit family variants and isolates identical actual/sample family labels', async () => {
  const catalog = { category: 'Hallelujah Rub', family: 'Hallelujah Rub', scent: 'Lavender', type: 'Solo' }
  const solo = await product('Actual Solo', catalog)
  const set = await product('Actual Set', { ...catalog, type: 'Set' })
  await posCatalogService.loadSampleCatalog(true)
  const products = await businessService.listProducts()
  const sample = products.find((row) => row.catalog?.sampleKey && row.catalog.family === catalog.family)
  expect(productFamilyId(solo)).toBe(productFamilyId(set))
  expect(productFamilyId(solo)).not.toBe(productFamilyId(sample))
  await productPhotoService.upload(file(), productFamilyId(solo))
  expect((await productPhotoService.list()).some((photo) => photo.familyId === productFamilyId(sample))).toBe(false)
  await expect(productPhotoService.upload(file(), 'missing-family')).rejects.toThrow('no longer exists')
  expect(await businessDb.productPhotos.count()).toBe(1)
})

it('round trips photos with records, rejects stale photo review and rolls back a late photo-write failure', async () => {
  const item = await product()
  const familyId = productFamilyId(item)
  await productPhotoService.upload(file(), familyId)
  const text = await businessBackupService.exportText()
  const plan = await businessBackupService.prepareRestore(text)
  await productPhotoService.remove(familyId)
  await expect(businessBackupService.restore(plan, true)).rejects.toThrow('Business data changed')
  const fresh = await businessBackupService.prepareRestore(text)
  const before = await businessBackupRepository.read()
  const fail = () => { throw new Error('Photo quota exceeded') }
  businessDb.productPhotos.hook('creating', fail)
  try { await expect(businessBackupService.restore(fresh, true)).rejects.toThrow('Photo quota') }
  finally { businessDb.productPhotos.hook('creating').unsubscribe(fail) }
  expect(await businessBackupRepository.read()).toEqual(before)
  await businessBackupService.restore(fresh, true)
  expect(await productPhotoService.list()).toEqual([fixturePhoto(familyId)])
})

it.each([1, 2])('accepts existing format %s and explicitly replaces current photos with none', async (version) => {
  const item = await product()
  const backup = JSON.parse(await businessBackupService.exportText())
  backup.version = version
  backup.databaseVersion = 2
  delete backup.stores.productPhotos
  await productPhotoService.upload(file(), productFamilyId(item))
  await businessBackupService.restore(await businessBackupService.prepareRestore(JSON.stringify(backup)), true)
  expect(await productPhotoService.list()).toEqual([])
  expect((await businessDb.products.get(item.id)).stockQuantity).toBe(5)
})

it.each([
  (b) => { delete b.stores.productPhotos },
  (b) => { b.stores.productPhotos[0].mimeType = 'image/svg+xml' },
  (b) => { b.stores.productPhotos[0].dataUrl = 'https://example.invalid/photo.jpg' },
  (b) => { b.stores.productPhotos[0].byteLength += 1 },
  (b) => { b.stores.productPhotos[0].byteLength = PRODUCT_PHOTO_MAX_BYTES + 1 },
  (b) => { b.stores.productPhotos[0].width = 961 },
  (b) => { b.stores.productPhotos[0].height = 2 },
  (b) => { b.stores.productPhotos[0].familyId = 'unknown' },
  (b) => { b.stores.productPhotos.push(b.stores.productPhotos[0]) },
  (b) => { b.stores.productPhotos = Array(31).fill(b.stores.productPhotos[0]) },
])('rejects invalid photo metadata, encoding, dimensions, identity or bounds before writes (%#)', async (corrupt) => {
  const item = await product()
  await productPhotoService.upload(file(), productFamilyId(item))
  const before = await businessBackupRepository.read()
  const backup = JSON.parse(await businessBackupService.exportText())
  corrupt(backup)
  await expect(businessBackupService.prepareRestore(JSON.stringify(backup))).rejects.toThrow(/backup/i)
  expect(await businessBackupRepository.read()).toEqual(before)
})

it('checks pixel decoding both during review and again on restore without changing records on failure', async () => {
  const item = await product()
  await productPhotoService.upload(file(), productFamilyId(item))
  const text = await businessBackupService.exportText()
  const plan = await businessBackupService.prepareRestore(text)
  const before = await businessBackupRepository.read()
  decodeFailure = true
  await expect(businessBackupService.prepareRestore(text)).rejects.toThrow('could not be read')
  await expect(businessBackupService.restore(plan, true)).rejects.toThrow('could not be read')
  expect(await businessBackupRepository.read()).toEqual(before)
})

it('validates encoded JPEG frame dimensions before any browser decode', () => {
  expect(validateProductPhoto(fixturePhoto('family')).width).toBe(16)
  expect(() => validateProductPhoto({ ...fixturePhoto('family'), width: 2 })).toThrow('Invalid product photo')
})

it('adds an empty photo store to a saved v2 database without rewriting existing rows', async () => {
  const name = 'business-photo-migration'
  await Dexie.delete(name)
  const legacy = new Dexie(name)
  legacy.version(2).stores({ products: 'id, name, inventoryPoolId', inventoryPools: 'id, name, createdAt',
    sales: 'id, &requestKey, confirmedAt, paymentMethod', saleItems: '++id, saleId, productId',
    inventoryMovements: '++id, productId, inventoryPoolId, saleId, occurredAt', auditEvents: '++id, saleId, occurredAt, type' })
  const saved = { id: 'old', name: 'Existing without photo', stockQuantity: 3 }
  await legacy.products.add(saved)
  legacy.close()
  const upgraded = createBusinessDb(name)
  try {
    expect(await upgraded.products.toArray()).toEqual([saved])
    expect(await upgraded.productPhotos.count()).toBe(0)
  } finally { upgraded.close(); await Dexie.delete(name) }
})

it('enforces the workspace photo cap while permitting replacement at capacity', async () => {
  const items = []
  for (let index = 0; index < 31; index += 1) items.push(await product(`Item ${index}`))
  for (const item of items.slice(0, 30)) await productPhotoRepository.save(fixturePhoto(productFamilyId(item)))
  await expect(productPhotoRepository.save(fixturePhoto(productFamilyId(items[30])))).rejects.toThrow('30 product photos')
  await expect(productPhotoRepository.save(fixturePhoto(productFamilyId(items[0])))).resolves.toBeUndefined()
  expect(await businessDb.productPhotos.count()).toBe(30)
})
