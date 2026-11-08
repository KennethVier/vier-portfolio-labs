import { z } from 'zod'
import { getManilaDate } from './dailyAuditService.js'
import { catalogMetadataSchema } from '../constants/catalogMetadata.js'

export const BUSINESS_BACKUP_VERSION = 2
export const BUSINESS_BACKUP_MAX_BYTES = 10 * 1024 * 1024
const text = z.string().min(1).max(240).refine((value) => value.trim().length > 0)
const name = text.refine((value) => value.length <= 120)
const natural = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const positive = natural.refine((value) => value > 0)
const signed = z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER)
const time = z.string().datetime({ offset: true })
const payment = z.enum(['cash', 'gcash', 'coop'])
const poolFields = { inventoryPoolId: text, poolNameSnapshot: name }
const itemFields = {
  saleId: text, productId: text, productNameSnapshot: name,
  quantity: positive, unitPriceCentavos: positive, lineTotalCentavos: positive,
}
const movementFields = {
  productId: text, saleId: text.nullish(),
  type: z.enum(['opening_stock', 'stock_received', 'stock_adjustment', 'sale']),
  delta: signed.refine((value) => value !== 0), reason: text.optional(),
  beforeQuantity: natural, afterQuantity: natural, occurredAt: time,
}
const item = z.object({ id: positive, ...itemFields, ...poolFields, inventoryUnitsPerSale: z.literal(1) }).strict()
const movement = z.object({ id: positive, ...movementFields, ...poolFields }).strict()
// v1->v2 intentionally preserves the original event payload, which predates pools.
const eventItem = z.object({ id: positive.optional(), ...itemFields,
  inventoryPoolId: text.optional(), poolNameSnapshot: name.optional(), inventoryUnitsPerSale: z.literal(1).optional(),
}).strict()
const eventMovement = z.object({ id: positive.optional(), ...movementFields,
  inventoryPoolId: text.optional(), poolNameSnapshot: name.optional(),
}).strict()
const event = z.object({
  id: positive, saleId: text.nullish(),
  type: z.enum(['opening_stock', 'stock_received', 'stock_adjustment', 'sale_completed']), occurredAt: time,
  payload: z.union([eventMovement, z.object({ paymentMethod: payment, totalCentavos: positive,
    items: z.array(eventItem).min(1), movements: z.array(eventMovement).min(1),
  }).strict()]),
}).strict()
const records = (schema) => z.array(schema).max(100000)
const format = z.object({
  app: z.literal('PesoPilot Business'), version: z.union([z.literal(1), z.literal(BUSINESS_BACKUP_VERSION)]),
  databaseVersion: z.literal(2), exportedAt: time,
  stores: z.object({
    products: records(z.object({
      id: text, name, unitPriceCentavos: positive, stockQuantity: natural, createdAt: time,
      inventoryPoolId: text, inventoryPoolName: name.optional(), inventoryUnitsPerSale: z.literal(1),
      initialNameSnapshot: name, initialPriceCentavos: positive, legacyMetadata: z.boolean().optional(),
      catalog: catalogMetadataSchema.optional(),
    }).strict()),
    inventoryPools: records(z.object({ id: text, name, stockQuantity: natural, createdAt: time }).strict()),
    sales: records(z.object({ id: text, requestKey: text, paymentMethod: payment,
      totalCentavos: positive, confirmedAt: time }).strict()),
    saleItems: records(item), inventoryMovements: records(movement), auditEvents: records(event),
  }).strict(),
}).strict()

function requireIntegrity(condition) {
  if (!condition) throw new Error('Business backup history does not reconcile. No records were replaced.')
}

function uniqueMap(rows, key = 'id') {
  const map = new Map(rows.map((row) => [row[key], row]))
  requireIntegrity(map.size === rows.length)
  return map
}

function safeSum(left, right) {
  const total = left + right
  requireIntegrity(Number.isSafeInteger(total))
  return total
}

function sameSnapshot(snapshot, saved) {
  // Stored v1 payloads lack pool fields; compare every field they do contain.
  return Object.entries(snapshot).every(([key, value]) => saved[key] === value ||
    (key === 'saleId' && value == null && saved[key] == null))
}

export function validateBusinessBackup(input) {
  // Retain independent work limits before schema parsing, including for
  // nested/unknown fields. Do not rely solely on the schema's array limits.
  let nodes = 0
  function bound(value, depth = 0) {
    nodes += 1
    if (depth > 12 || nodes > 250000 || (Array.isArray(value) && value.length > (depth === 2 ? 100000 : 1000))) {
      throw new Error('Business backup exceeds supported validation limits.')
    }
    if (value && typeof value === 'object') {
      for (const child of Object.values(value)) bound(child, depth + 1)
    }
  }
  bound(input)
  // Fail on the first malformed record rather than accumulating errors for
  // every row in an attacker-controlled file.
  for (const [storeName, schema] of Object.entries(format.shape.stores.shape)) {
    const rows = input?.stores?.[storeName]
    if (Array.isArray(rows)) for (const row of rows) {
      if (!schema.element.safeParse(row).success) {
        throw new Error('Invalid or incompatible Business backup. No records were replaced.')
      }
    }
  }
  const parsed = format.safeParse(input)
  if (!parsed.success) throw new Error('Invalid or incompatible Business backup. No records were replaced.')
  const backup = parsed.data // validated copy; never retain caller-owned objects
  const { products, inventoryPools, sales, saleItems, inventoryMovements, auditEvents } = backup.stores
  const productMap = uniqueMap(products)
  const pools = uniqueMap(inventoryPools)
  const saleMap = uniqueMap(sales)
  uniqueMap(sales, 'requestKey')
  uniqueMap(saleItems)
  uniqueMap(inventoryMovements)
  uniqueMap(auditEvents)
  const usedPools = new Set()
  const sampleKeys = new Set()
  const sampleByPool = new Map()
  for (const product of products) {
    const pool = pools.get(product.inventoryPoolId)
    requireIntegrity(pool && product.stockQuantity === pool.stockQuantity)
    usedPools.add(pool.id)
    requireIntegrity(backup.version !== 1 || product.catalog === undefined)
    const sampleKey = product.catalog?.sampleKey
    if (sampleKey) {
      requireIntegrity(!sampleKeys.has(sampleKey) && product.id === sampleKey && product.inventoryPoolId === product.id)
      sampleKeys.add(sampleKey)
    }
    if (sampleByPool.has(pool.id)) requireIntegrity(sampleByPool.get(pool.id) === Boolean(sampleKey))
    sampleByPool.set(pool.id, Boolean(sampleKey))
  }
  requireIntegrity(usedPools.size === pools.size)

  const lines = new Map()
  const linesBySale = new Map()
  const totals = new Map()
  const lineKey = (row) => JSON.stringify([row.saleId, row.productId])
  for (const line of saleItems) {
    const product = productMap.get(line.productId)
    const key = lineKey(line)
    requireIntegrity(product && saleMap.has(line.saleId) && product.inventoryPoolId === line.inventoryPoolId &&
      !lines.has(key) && Number.isSafeInteger(line.quantity * line.unitPriceCentavos) &&
      line.lineTotalCentavos === line.quantity * line.unitPriceCentavos)
    lines.set(key, line)
    if (!linesBySale.has(line.saleId)) linesBySale.set(line.saleId, [])
    linesBySale.get(line.saleId).push(line)
    totals.set(line.saleId, safeSum(totals.get(line.saleId) ?? 0, line.lineTotalCentavos))
  }
  for (const sale of sales) requireIntegrity(totals.get(sale.id) === sale.totalCentavos)

  const balances = new Map()
  const lastDayByPool = new Map()
  const saleMovements = new Map()
  const nonSaleMovements = new Map()
  // Auto-increment movement IDs retain transaction order even if the device clock moves back.
  for (const row of [...inventoryMovements].sort((a, b) => a.id - b.id)) {
    const product = productMap.get(row.productId)
    const pool = pools.get(row.inventoryPoolId)
    const day = getManilaDate(new Date(row.occurredAt))
    requireIntegrity(product && pool && product.inventoryPoolId === row.inventoryPoolId &&
      Date.parse(row.occurredAt) >= Date.parse(product.createdAt) && Date.parse(row.occurredAt) >= Date.parse(pool.createdAt) &&
      day >= (lastDayByPool.get(pool.id) ?? day) &&
      row.beforeQuantity === (balances.get(row.inventoryPoolId) ?? 0) &&
      Number.isSafeInteger(row.beforeQuantity + row.delta) && row.afterQuantity === row.beforeQuantity + row.delta)
    lastDayByPool.set(pool.id, day)
    balances.set(row.inventoryPoolId, row.afterQuantity)
    if (row.type === 'sale') {
      const key = lineKey(row)
      const line = lines.get(key)
      const sale = saleMap.get(row.saleId)
      requireIntegrity(line && sale && !saleMovements.has(key) && row.delta === -line.quantity &&
        row.inventoryPoolId === line.inventoryPoolId && row.occurredAt === sale.confirmedAt)
      saleMovements.set(key, row)
    } else {
      requireIntegrity(row.saleId == null && (row.type === 'stock_adjustment' ? Boolean(row.reason?.trim()) : row.delta > 0))
      nonSaleMovements.set(row.id, row)
    }
  }
  requireIntegrity(lines.size === saleMovements.size)
  for (const pool of inventoryPools) requireIntegrity((balances.get(pool.id) ?? 0) === pool.stockQuantity)

  const saleEvents = new Set()
  for (const row of auditEvents) {
    if (row.type === 'sale_completed') {
      const sale = saleMap.get(row.saleId)
      const payload = row.payload
      requireIntegrity(sale && !saleEvents.has(sale.id) && row.occurredAt === sale.confirmedAt &&
        payload.totalCentavos === sale.totalCentavos && payload.paymentMethod === sale.paymentMethod &&
        Array.isArray(payload.items) && Array.isArray(payload.movements))
      const eventLines = uniqueMap(payload.items, 'productId')
      const eventMoves = uniqueMap(payload.movements, 'productId')
      const savedLines = linesBySale.get(sale.id) ?? []
      requireIntegrity(eventLines.size === savedLines.length && eventMoves.size === savedLines.length)
      for (const line of savedLines) {
        const savedMovement = saleMovements.get(lineKey(line))
        requireIntegrity(eventLines.has(line.productId) && eventMoves.has(line.productId) &&
          sameSnapshot(eventLines.get(line.productId), line) && sameSnapshot(eventMoves.get(line.productId), savedMovement))
      }
      saleEvents.add(sale.id)
    } else {
      requireIntegrity(row.saleId == null && row.payload.type === row.type && row.payload.occurredAt === row.occurredAt)
      const match = [...nonSaleMovements.values()].find((saved) => sameSnapshot(row.payload, saved))
      requireIntegrity(Boolean(match))
      nonSaleMovements.delete(match.id)
    }
  }
  requireIntegrity(saleEvents.size === sales.length && nonSaleMovements.size === 0)
  return backup
}
