// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db/dexie.js'
import { ensureApplicationDefaults } from '@/lib/db/seed.js'
import { FIRST_USE_WELCOME_KEY } from '@/components/guidance/guidanceStorage.js'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from './businessService.js'
import { getActiveWorkspace } from './workspacePreference.js'
import { workspaceService } from './workspaceService.js'
import { dailyAuditService, getManilaDate } from './dailyAuditService.js'

beforeEach(async () => {
  localStorage.clear()
  await Promise.all([...db.tables, ...businessDb.tables].map((table) => table.clear()))
})
afterEach(async () => {
  localStorage.clear()
  await Promise.all([...db.tables, ...businessDb.tables].map((table) => table.clear()))
})

describe('workspace onboarding and personal data isolation', () => {
  it('offers first-use choice even after personal defaults have been seeded', async () => {
    await ensureApplicationDefaults()
    expect(await workspaceService.shouldOfferChoice()).toBe(true)
  })

  it.each(['income', 'expenses', 'savings', 'salary_cutoffs'])('does not re-onboard an existing personal user with %s records', async (table) => {
    await db.table(table).add({ amount: 1000, note: 'Existing personal record' })
    expect(await workspaceService.shouldOfferChoice()).toBe(false)
  })

  it('respects existing welcome dismissal and remembered Business selection', async () => {
    localStorage.setItem(FIRST_USE_WELCOME_KEY, 'true')
    expect(await workspaceService.shouldOfferChoice()).toBe(false)
    localStorage.clear()
    workspaceService.rememberRoute('business')
    expect(getActiveWorkspace()).toBe('business')
    expect(await workspaceService.shouldOfferChoice()).toBe(false)
    workspaceService.rememberRoute('personal')
    expect(getActiveWorkspace()).toBe('personal')
    expect(await workspaceService.shouldOfferChoice()).toBe(false)
  })

  it('leaves every personal store unchanged through inventory, sale and bidirectional switches', async () => {
    await ensureApplicationDefaults()
    await db.income.add({ amount: 50000, source: 'Salary', cutoffId: 3 })
    await db.expenses.add({ amount: 150, merchant: 'Personal', cutoffId: 3 })
    await db.savings.add({ amount: 500, source: 'Personal', cutoffId: 3 })
    const before = await Promise.all(db.tables.map((table) => table.toArray()))
    workspaceService.rememberRoute('business')
    const product = await businessService.addProduct({ name: 'Pillow', pricePesos: '350', openingStock: 3 })
    await businessService.adjustStock({ productId: product.id, quantity: 1, direction: 'add', reason: 'Delivery' })
    await businessService.completeSale({ ownerConfirmed: true, requestKey: 'isolated', paymentMethod: 'cash', items: [{ productId: product.id, quantity: 1 }] })
    const variant = await businessService.addProduct({ name: 'Shared variant', pricePesos: '150', inventoryPoolId: product.inventoryPoolId })
    await businessService.completeSale({ ownerConfirmed: true, requestKey: 'isolated-gcash', paymentMethod: 'gcash', items: [{ productId: variant.id, quantity: 1 }] })
    expect((await dailyAuditService.getReport(getManilaDate())).summary.totalSold).toBe(2)
    workspaceService.rememberRoute('personal')
    expect(await Promise.all(db.tables.map((table) => table.toArray()))).toEqual(before)
    expect(db.tables).toHaveLength(13)
    expect(db.name).not.toBe(businessDb.name)
  })
})
