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
  listAuditEvents: () => businessRepository.listAuditEvents(),

  async addProduct({ name, pricePesos, openingStock = 0 }) {
    const cleanName = String(name ?? '').trim()
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

  receiveStock({ productId, quantity }) {
    assertQuantity(quantity)
    if (!productId) throw new Error('Product is required')
    return businessRepository.receiveStock({
      productId,
      quantity,
      occurredAt: new Date().toISOString(),
    })
  },

  completeSale({ items, paymentMethod, requestKey }) {
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
    const validatedItems = items.map(({ productId, quantity }) => {
      if (typeof productId !== 'string' || !productId.trim() || seen.has(productId)) {
        throw new Error('Each sale item must reference a different product')
      }
      seen.add(productId)
      return { productId, quantity: assertQuantity(quantity) }
    })

    return businessRepository.commitConfirmedSale({
      sale: {
        id: newId(),
        requestKey,
        paymentMethod,
        confirmedAt: new Date().toISOString(),
      },
      items: validatedItems,
    })
  },
}
