import { BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'
import { businessRepository } from '../repositories/businessRepository.js'

const manilaDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function getManilaDate(value = new Date()) {
  const parts = Object.fromEntries(manilaDate.formatToParts(value).map(({ type, value: part }) => [type, part]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

function dateRange(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid audit date')
  const start = Date.parse(`${date}T00:00:00+08:00`)
  if (!Number.isFinite(start) || getManilaDate(new Date(start)) !== date) throw new Error('Choose a valid audit date')
  return { start, end: start + 86400000 }
}

function timestamp(value) {
  const result = Date.parse(value)
  if (!Number.isFinite(result)) throw new Error('Audit history contains an invalid date')
  return result
}

function integer(value, allowNegative = false) {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) {
    throw new Error('Audit history contains an invalid quantity or amount')
  }
  return value
}

function add(left, right) {
  return integer(left + right, true)
}

function emptyPayments() {
  return Object.fromEntries(BUSINESS_PAYMENT_METHODS.map((method) => [method, { quantity: 0, centavos: 0 }]))
}

function addPayment(target, method, quantity, centavos) {
  if (!target[method]) throw new Error('Audit contains an unsupported payment method')
  target[method].quantity = add(target[method].quantity, quantity)
  target[method].centavos = add(target[method].centavos, centavos)
}

function validateHistoryThrough(end, { pools, products, sales, items, movements }) {
  const poolIds = new Set(pools.map((pool) => pool.id))
  const productMap = new Map(products.map((product) => [product.id, product]))
  const saleMap = new Map(sales.filter((sale) => timestamp(sale.confirmedAt) < end).map((sale) => [sale.id, sale]))
  const lineKey = (row) => JSON.stringify([row.saleId, row.productId])
  const lines = new Map()
  const totals = new Map()
  for (const item of items) {
    if (!saleMap.has(item.saleId)) continue
    const key = lineKey(item)
    if (lines.has(key) || !poolIds.has(item.inventoryPoolId) ||
        productMap.get(item.productId)?.inventoryPoolId !== item.inventoryPoolId ||
        !integer(item.quantity) || !integer(item.unitPriceCentavos) || item.inventoryUnitsPerSale !== 1 ||
        integer(item.lineTotalCentavos) !== integer(item.quantity * item.unitPriceCentavos)) {
      throw new Error('Audit sale and inventory history do not reconcile')
    }
    lines.set(key, item)
    totals.set(item.saleId, add(totals.get(item.saleId) ?? 0, item.lineTotalCentavos))
  }
  for (const sale of saleMap.values()) {
    if (!totals.has(sale.id)) throw new Error('Audit inventory movement has no matching sale item')
    if (!BUSINESS_PAYMENT_METHODS.includes(sale.paymentMethod) || totals.get(sale.id) !== integer(sale.totalCentavos)) {
      throw new Error('Audit sale totals do not reconcile')
    }
  }
  const balances = new Map()
  for (const movement of [...movements].sort((left, right) => left.id - right.id)) {
    if (timestamp(movement.occurredAt) >= end) continue
    const before = integer(movement.beforeQuantity)
    const after = integer(movement.afterQuantity)
    const delta = integer(movement.delta, true)
    if (!poolIds.has(movement.inventoryPoolId) || productMap.get(movement.productId)?.inventoryPoolId !== movement.inventoryPoolId ||
        before !== (balances.get(movement.inventoryPoolId) ?? 0) ||
        after !== add(before, delta) || delta === 0) throw new Error('Audit stock movement chain does not reconcile')
    balances.set(movement.inventoryPoolId, after)
    if (movement.type === 'sale') {
      const key = lineKey(movement)
      const line = lines.get(key)
      const sale = saleMap.get(movement.saleId)
      if (!line || !sale || delta !== -line.quantity || movement.inventoryPoolId !== line.inventoryPoolId ||
          timestamp(movement.occurredAt) !== timestamp(sale.confirmedAt)) {
        throw new Error('Audit inventory movement has no matching sale item or sale date')
      }
      lines.delete(key)
    } else if (!['opening_stock', 'stock_received', 'stock_adjustment'].includes(movement.type) ||
        movement.saleId != null || (movement.type === 'stock_adjustment' && !movement.reason?.trim()) ||
        (movement.type !== 'stock_adjustment' && delta < 0)) {
      throw new Error('Audit contains an unsupported or untraceable inventory movement')
    }
  }
  if (lines.size) throw new Error('Audit sale and inventory history do not reconcile')
}

// Pure projection of recorded history. No current price/stock is used to recalculate sales.
export function buildDailyAudit(date, { products, pools, sales, items, movements }) {
  const { start, end } = dateRange(date)
  // Opening stock depends on earlier history too. Refuse corrupt prior-day
  // movements instead of rolling their deltas into a plausible opening balance.
  validateHistoryThrough(end, { products, pools, sales, items, movements })
  const groups = new Map()
  for (const pool of pools) {
    if (timestamp(pool.createdAt) >= end) continue
    groups.set(pool.id, {
      id: pool.id, name: pool.name, openingQuantity: 0, addedQuantity: 0,
      removedQuantity: 0, consumedQuantity: 0, availableQuantity: 0,
      remainingQuantity: 0, totalSold: 0, payments: emptyPayments(), rows: [],
    })
  }

  const saleMap = new Map(sales.map((sale) => [sale.id, sale]))
  const daySales = new Map(sales.filter((sale) => {
    const time = timestamp(sale.confirmedAt)
    return time >= start && time < end
  }).map((sale) => [sale.id, sale]))
  const movedByLine = new Map()
  const keyForLine = (saleId, productId) => JSON.stringify([saleId, productId])
  for (const movement of movements) {
    const time = timestamp(movement.occurredAt)
    if (time >= end) continue
    const group = groups.get(movement.inventoryPoolId)
    if (!group) throw new Error('Audit inventory pool is missing')
    const delta = integer(movement.delta, true)
    if (time < start) {
      group.openingQuantity = add(group.openingQuantity, delta)
    } else if (movement.type === 'sale') {
      const sale = saleMap.get(movement.saleId)
      if (delta >= 0 || !sale || !daySales.has(sale.id)) throw new Error('Audit sale movement does not match its sale date')
      group.consumedQuantity = add(group.consumedQuantity, -delta)
      const key = keyForLine(sale.id, movement.productId)
      if (movedByLine.has(key)) throw new Error('Audit contains duplicate sale movements')
      movedByLine.set(key, { quantity: -delta, poolId: group.id })
    } else if (['opening_stock', 'stock_received', 'stock_adjustment'].includes(movement.type)) {
      if (delta >= 0) group.addedQuantity = add(group.addedQuantity, delta)
      else group.removedQuantity = add(group.removedQuantity, -delta)
    } else {
      throw new Error('Audit contains an unsupported inventory movement')
    }
  }

  const rowMap = new Map()
  const saleTotals = new Map()
  const soldProducts = new Set()
  for (const item of items) {
    const sale = daySales.get(item.saleId)
    if (!sale) continue
    const group = groups.get(item.inventoryPoolId)
    if (!group) throw new Error('Audit sale inventory pool is missing')
    const quantity = integer(item.quantity)
    const price = integer(item.unitPriceCentavos)
    const amount = integer(item.lineTotalCentavos)
    const key = keyForLine(sale.id, item.productId)
    const movement = movedByLine.get(key)
    if (!quantity || !price || item.inventoryUnitsPerSale !== 1 ||
        amount !== integer(quantity * price) || movement?.quantity !== quantity || movement.poolId !== group.id) {
      throw new Error('Audit sale and inventory history do not reconcile')
    }
    movedByLine.delete(key)
    saleTotals.set(sale.id, add(saleTotals.get(sale.id) ?? 0, amount))
    const rowId = JSON.stringify([group.id, item.productId, item.productNameSnapshot, price])
    let row = rowMap.get(rowId)
    if (!row) {
      row = { id: rowId, name: item.productNameSnapshot, priceCentavos: price, payments: emptyPayments(), totalSold: 0 }
      rowMap.set(rowId, row)
      group.rows.push(row)
    }
    addPayment(row.payments, sale.paymentMethod, quantity, amount)
    addPayment(group.payments, sale.paymentMethod, quantity, amount)
    row.totalSold = add(row.totalSold, quantity)
    group.totalSold = add(group.totalSold, quantity)
    soldProducts.add(item.productId)
  }
  if (movedByLine.size) throw new Error('Audit inventory movement has no matching sale item')
  for (const sale of daySales.values()) {
    if (!BUSINESS_PAYMENT_METHODS.includes(sale.paymentMethod) || !saleTotals.has(sale.id) ||
        saleTotals.get(sale.id) !== integer(sale.totalCentavos)) throw new Error('Audit sale totals do not reconcile')
  }

  // Unsold products use creation snapshots, never mutable current names/prices.
  for (const product of products) {
    if (timestamp(product.createdAt) >= end || soldProducts.has(product.id)) continue
    const group = groups.get(product.inventoryPoolId)
    if (!group) throw new Error('Audit product inventory pool is missing')
    group.rows.push({
      id: product.id, name: product.legacyMetadata ? `${product.initialNameSnapshot} (name at migration)` : product.initialNameSnapshot,
      priceCentavos: product.legacyMetadata ? null : product.initialPriceCentavos,
      payments: emptyPayments(), totalSold: 0,
    })
  }

  const summary = {
    openingQuantity: 0, addedQuantity: 0, removedQuantity: 0, availableQuantity: 0,
    remainingQuantity: 0, totalSold: 0, totalCentavos: 0, payments: emptyPayments(),
  }
  for (const group of groups.values()) {
    integer(group.openingQuantity)
    group.availableQuantity = add(group.openingQuantity, group.addedQuantity)
    group.remainingQuantity = integer(group.availableQuantity - group.consumedQuantity - group.removedQuantity)
    for (const field of ['openingQuantity', 'addedQuantity', 'removedQuantity', 'availableQuantity', 'remainingQuantity', 'totalSold']) {
      summary[field] = add(summary[field], group[field])
    }
    for (const method of BUSINESS_PAYMENT_METHODS) {
      const payment = group.payments[method]
      addPayment(summary.payments, method, payment.quantity, payment.centavos)
      summary.totalCentavos = add(summary.totalCentavos, payment.centavos)
    }
    group.rows.sort((left, right) => left.name.localeCompare(right.name) || (left.priceCentavos ?? 0) - (right.priceCentavos ?? 0))
  }
  return { date, summary, groups: [...groups.values()].sort((left, right) => left.name.localeCompare(right.name)) }
}

export const dailyAuditService = {
  async getReport(date) {
    dateRange(date)
    const source = await businessRepository.readDailyAuditSource()
    const archived = new Set(source.products.filter((product) => product.catalog?.sampleKey).map((product) => product.id))
    if (!archived.size) return buildDailyAudit(date, source)
    const archivedSales = new Set(source.items.filter((item) => archived.has(item.productId)).map((item) => item.saleId))
    // A mixed transaction cannot be split without changing its historical meaning.
    if (source.items.some((item) => archivedSales.has(item.saleId) && !archived.has(item.productId))) {
      return { legacy: true, mixedSale: true }
    }
    const report = buildDailyAudit(date, {
      products: source.products.filter((row) => !archived.has(row.id)),
      pools: source.pools.filter((row) => !archived.has(row.id)),
      movements: source.movements.filter((row) => !archived.has(row.productId)),
      sales: source.sales.filter((row) => !archivedSales.has(row.id)),
      items: source.items.filter((row) => !archivedSales.has(row.saleId)),
    })
    return { ...report, legacy: true }
  },
}
