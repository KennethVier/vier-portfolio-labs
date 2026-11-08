import Dexie from 'dexie'

// Separate from the personal 'pesopilot' database and its 13 approved stores.
// This schema belongs only to the proposed v1.1 Business Mode.
export const businessDb = new Dexie('pesopilot-business')

businessDb.version(1).stores({
  products: 'id, name',
  sales: 'id, &requestKey, confirmedAt, paymentMethod',
  saleItems: '++id, saleId, productId',
  inventoryMovements: '++id, productId, saleId, occurredAt',
  auditEvents: '++id, saleId, occurredAt, type',
})
