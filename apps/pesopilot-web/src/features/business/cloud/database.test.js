import { beforeAll, afterAll, describe, it, expect } from 'vitest'
import { sandbox } from '../../../../scripts/cloud/sandbox.mjs'
import { mapBackup, validateImport } from '../../../../scripts/cloud/import-plan.mjs'
import { businessService } from '../services/businessService.js'
import { businessBackupService } from '../services/businessBackupService.js'

let db
beforeAll(async () => {
  db = await sandbox()
}, 30000)
afterAll(async () => db?.close())

describe('Phase 1 database', () => {
  it('imports a real Dexie fixture with a set-format line and reconciles counts', async () => {
    const p = await businessService.addProduct({
      name: 'Fixture scent',
      pricePesos: '10',
      openingStock: 10,
    })
    await businessService.completeSale({
      ownerConfirmed: true,
      requestKey: 'set-fixture',
      paymentMethod: 'cash',
      items: [{ productId: p.id, quantity: 5, saleFormat: 'set' }],
    })
    const backup = JSON.parse(await businessBackupService.exportText())
    const tables = mapBackup(backup)
    expect(await validateImport(db, tables)).toMatchObject({
      business_products: 1,
      business_pools: 1,
      business_sales: 1,
      business_sale_items: 1,
      business_movements: 2,
      business_events: 2,
    })
    expect(
      (await db.query("select original->>'saleFormat' as format from recovery.business_sale_items"))
        .rows[0].format,
    ).toBe('set')
    await expect(validateImport(db, tables)).rejects.toThrow()
    expect((await db.query('select quantity from recovery.business_pools')).rows[0].quantity).toBe(5)
    backup.stores.sales.push(backup.stores.sales[0])
    expect(() => mapBackup(backup)).toThrow()
  })
  it('permits only a server credential to append a recovery observation and deduplicates retries', async () => {
    for (const role of ['anon', 'authenticated']) {
      await db.exec('reset role; set role ' + role)
      await expect(db.query('select * from recovery.business_sales')).rejects.toThrow()
      await expect(
        db.query("select public.observe_business_stock('one','Scent',3,99)"),
      ).rejects.toThrow()
    }
    await db.exec('reset role; set role service_role')
    for (let n = 0; n < 2; n++)
      await db.query("select public.observe_business_stock('one','Scent',3,99)")
    await db.exec('reset role')
    expect((await db.query('select * from recovery.catalog_observations')).rows).toHaveLength(1)
  })
})
