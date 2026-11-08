import { BUSINESS_PAYMENT_METHODS } from '../constants/businessConstants.js'
import { businessRepository } from '../repositories/businessRepository.js'

function newId() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('Secure local identifiers are unavailable')
  }
  return globalThis.crypto.randomUUID()
}

function assertQuantity(value, { allowZero = false } = {}) {
  const valid = Number.isSafeInteger(value) && (allowZero ? value >= 0 : value > 0)
  if (!valid) throw new Error('Quantity must be a valid whole number')
  return value
}

function parsePriceCentavos(input) {
  const text = String(input).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(text)) {
    throw new Error('Price must be a PHP amount with up to two decimal places')
  }
  const [pesos, fraction = ''] = text.split('.')
  const centavos = Number(pesos) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(centavos) || centavos < 1) {
    throw new Error('Price must be greater than zero and within the supported limit')
  }
  return centavos
}

export const businessService = {
  listProducts: () => businessRepository.listProducts(),
  listSales: () => businessRepository.listSales(),
  listSalesHistory: () => businessRepository.listSalesHistory(),
  listAuditEvents: () => businessRepository.listAuditEvents(),

  async addProduct({ name, pricePesos, openingStock = 0 }) {
    const cleanName = typeof name === 'string' ? name.trim() : ''
    if (!cleanName || cleanName.length > 120) {
      throw new Error('Product name must contain 1–120 characters')
    }
    const product = {
      id: newId(),
      name: cleanName,
      unitPriceCentavos: parsePriceCentavos(pricePesos),
      stockQuantity: assertQuantity(openingStock, { allowZero: true }),
      createdAt: new Date().toISOString(),
    }
    return businessRepository.addProduct(product)
  },

  adjustStock({ productId, quantity, direction, reason }) {
    assertQuantity(quantity)
    if (typeof productId !== 'string' || !productId.trim()) throw new Error('Product is required')
    if (!['add', 'remove'].includes(direction)) throw new Error('Choose add or remove stock')
    const cleanReason = typeof reason === 'string' ? reason.trim() : ''
    if (!cleanReason || cleanReason.length > 240) {
      throw new Error('Adjustment reason must contain 1–240 characters')
    }
    return businessRepository.adjustStock({
      productId,
      delta: direction === 'add' ? quantity : -quantity,
      reason: cleanReason,
      occurredAt: new Date().toISOString(),
    })
  },

  previewSale(product, quantity) {
    if (!product) throw new Error('Select a product')
    assertQuantity(quantity)
    if (quantity > product.stockQuantity) throw new Error('Insufficient stock')
    const totalCentavos = product.unitPriceCentavos * quantity
    if (!Number.isSafeInteger(totalCentavos)) throw new Error('Sale amount exceeds supported limit')
    return { quantity, unitPriceCentavos: product.unitPriceCentavos, totalCentavos }
  },

  async completeSale({ items, paymentMethod, requestKey, ownerConfirmed }) {
    if (ownerConfirmed !== true) throw new Error('Owner confirmation is required')
    if (!BUSINESS_PAYMENT_METHODS.includes(paymentMethod)) {
      throw new Error('Choose Cash or Coop')
    }
    if (typeof requestKey !== 'string' || !requestKey.trim()) {
      throw new Error('A stable sale request key is required')
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Add at least one product')
    }

    const seen = new Set()
    const validatedItems = items.map(({ productId, quantity, expectedUnitPriceCentavos }) => {
      if (typeof productId !== 'string' || !productId.trim() || seen.has(productId)) {
        throw new Error('Each sale item must reference a different product')
      }
      seen.add(productId)
      if (expectedUnitPriceCentavos !== undefined &&
          (!Number.isSafeInteger(expectedUnitPriceCentavos) || expectedUnitPriceCentavos < 1)) {
        throw new Error('Invalid reviewed price')
      }
      return { productId, quantity: assertQuantity(quantity), expectedUnitPriceCentavos }
    })

    return businessRepository.commitConfirmedSale({
      sale: {
        id: newId(),
        requestKey,
        paymentMethod,
        confirmedAt: new Date().toISOString(),
      },
      items: validatedItems,
    }).catch((error) => {
      // Dexie rejects only after aborting the transaction. Editing is safe in this case.
      error.saleNotRecorded = true
      throw error
    })
  },

  summarizeSales(sales) {
    return sales.reduce((summary, sale) => ({
      totalCentavos: summary.totalCentavos + sale.totalCentavos,
      cashCentavos: summary.cashCentavos + (sale.paymentMethod === 'cash' ? sale.totalCentavos : 0),
      coopCentavos: summary.coopCentavos + (sale.paymentMethod === 'coop' ? sale.totalCentavos : 0),
    }), { totalCentavos: 0, cashCentavos: 0, coopCentavos: 0 })
  },
}
