import { beforeEach, afterEach, describe, expect, it } from 'vitest'
import { businessDb } from '../repositories/businessDb.js'
import { businessService } from './businessService.js'
import { dailyAuditService } from './dailyAuditService.js'
import { businessBackupService } from './businessBackupService.js'
import { applyHistoricalCostCorrections, summarizeProfit } from './salesProfit.js'

beforeEach(async () => {
  await businessDb.open()
  await Promise.all(businessDb.tables.map(table => table.clear()))
})
afterEach(async () => {
  await Promise.all(businessDb.tables.map(table => table.clear()))
  businessDb.close()
})

async function fixture() {
  const product = await businessService.addProduct({
    name: 'QA Shawl', pricePesos: '150', openingStock: 8,
  })
  await businessService.setUnitCost(product.id, '50')
  await businessService.completeSale({
    ownerConfirmed: true, requestKey: 'qa-cost-correction-1', paymentMethod: 'cash',
    items: [{ productId: product.id, quantity: 2 }],
  })
  const item = await businessDb.saleItems.toCollection().first()
  const sale = await businessDb.sales.toCollection().first()
  return { item, sale, product }
}

describe('historical cost corrections', () => {
  it('adjusts prior COGS and gross profit without editing receipts, stock or sale snapshots', async () => {
    const { item, sale, product } = await fixture()
    const day = new Date(sale.confirmedAt).toISOString().slice(0, 10)
    const beforeItem = structuredClone(await businessDb.saleItems.get(item.id))
    const beforeSale = structuredClone(await businessDb.sales.get(sale.id))
    const beforePools = await businessDb.inventoryPools.toArray()
    await businessService.updatePricing(product.id,
      { unitPriceCentavos: 15000, unitCostCentavos: 5000 }, { price: '150', cost: '70' })
    await businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 5000,
      correctedCost: '70', reason: 'Wrong cost entered yesterday',
    })
    expect(await businessDb.saleItems.get(item.id)).toEqual(beforeItem)
    expect(await businessDb.sales.get(sale.id)).toEqual(beforeSale)
    expect(await businessDb.inventoryPools.toArray()).toEqual(beforePools)
    const events = await businessDb.auditEvents.toArray()
    const effective = applyHistoricalCostCorrections([item], events)[0]
    expect(effective.unitCostCentavos).toBe(7000)
    expect(summarizeProfit([effective])).toEqual({
      costOfGoods: 14000, grossProfit: 16000, uncostedUnits: 0,
    })
    const report = await dailyAuditService.getReport(day)
    expect(report.profit.costOfGoods).toBe(14000)
    expect(report.profit.grossProfit).toBe(16000)
    expect(report.summary.totalCentavos).toBe(30000)
  })

  it('prevents stale changes and records successive reasons in chronological order', async () => {
    const { item } = await fixture()
    await businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 5000,
      correctedCost: '60', reason: 'Adjust supplier costing',
    })
    await expect(businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 5000,
      correctedCost: '65', reason: 'Stale change attempt',
    })).rejects.toThrow('changed')
    await businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 6000,
      correctedCost: '70', reason: 'Second verified correction',
    })
    const events = await businessDb.auditEvents.toArray()
    const reverse = [...events].reverse()
    expect(applyHistoricalCostCorrections([item], reverse)[0].unitCostCentavos).toBe(7000)
    const corrections = events.filter(event => event.type === 'cost_correction')
    expect(corrections.map(e => e.payload.previousUnitCostCentavos)).toEqual([5000, 6000])
    expect(corrections.map(e => e.payload.reason)).toEqual([
      'Adjust supplier costing', 'Second verified correction',
    ])
  })

  it('keeps corrections in validated backups and restores them', async () => {
    const { item } = await fixture()
    await businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 5000,
      correctedCost: '75', reason: 'Corrected old purchase cost',
    })
    const content = await businessBackupService.exportText()
    const backup = JSON.parse(content)
    expect(backup.stores.auditEvents.some(event => event.type === 'cost_correction')).toBe(true)
    const plan = await businessBackupService.prepareRestore(content)
    await businessBackupService.restore(plan, true)
    const costs = applyHistoricalCostCorrections(
      await businessDb.saleItems.toArray(), await businessDb.auditEvents.toArray())
    expect(costs[0].unitCostCentavos).toBe(7500)
  })

  it('rejects invalid or no-op corrections without creating audit events', async () => {
    const { item } = await fixture()
    const before = await businessDb.auditEvents.count()
    for (const correctedCost of ['', '-1', '1.234', '50']) {
      await expect(async () => businessService.correctHistoricalCost({
        saleItemId: item.id, expectedCostCentavos: 5000,
        correctedCost, reason: 'Price entry correction',
      })).rejects.toThrow()
    }
    await expect(async () => businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: 5000,
      correctedCost: '60', reason: 'x',
    })).rejects.toThrow('reason')
    expect(await businessDb.auditEvents.count()).toBe(before)
  })

  it('can backfill an originally missing cost without altering sale revenue', async () => {
    const product = await businessService.addProduct({
      name: 'Uncosted item', pricePesos: '100', openingStock: 2,
    })
    await businessService.completeSale({ ownerConfirmed: true,
      requestKey: 'uncosted', paymentMethod: 'cash',
      items: [{ productId: product.id, quantity: 1 }] })
    const item = await businessDb.saleItems.toCollection().first()
    expect(item.unitCostCentavos).toBeUndefined()
    await businessService.correctHistoricalCost({
      saleItemId: item.id, expectedCostCentavos: null,
      correctedCost: '0', reason: 'Verified zero cost item',
    })
    const event = (await businessDb.auditEvents.toArray()).find(e => e.type === 'cost_correction')
    expect(event.payload.previousUnitCostCentavos).toBeNull()
    const effective = applyHistoricalCostCorrections([item], [event])
    expect(summarizeProfit(effective)).toEqual({ costOfGoods: 0, grossProfit: 10000, uncostedUnits: 0 })
  })
})
