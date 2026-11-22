import { previousEvent } from './ledgerIdentity.js'
import { validateBusinessBackup } from '../services/businessBackupValidation.js'
import {
  buildDailyAudit,
  getManilaDate,
} from '../services/dailyAuditService.js'
import {
  BUSINESS_REALM,
  businessAdmin,
  authorizedBranches,
  eventId,
} from './branchRepository.js'

export function prepareLegacyImport(input, branchId) {
  if (!branchId?.startsWith('rlm-pesopilot-branch-'))
    throw new Error('Select an explicit default branch.')
  if (new TextEncoder().encode(JSON.stringify(input)).length > 1024 * 1024)
    throw new Error(
      'This atomic migration slice supports backups up to 1 MiB. Use a reviewed batched migration for larger ledgers; nothing was changed.',
    )
  const backup = validateBusinessBackup(input)
  if (backup.stores.products.some((p) => p.catalog?.sampleKey))
    throw new Error(
      'Archived/sample data requires separate owner review. Nothing was excluded or changed.',
    )
  const source = {
    products: backup.stores.products,
    pools: backup.stores.inventoryPools,
    sales: backup.stores.sales,
    items: backup.stores.saleItems,
    movements: backup.stores.inventoryMovements,
    auditEvents: backup.stores.auditEvents,
    productPhotos: backup.stores.productPhotos ?? [],
  }
  const latest = Math.max(
    Date.parse(backup.exportedAt),
    ...source.movements.map((m) => Date.parse(m.occurredAt)),
  )
  const report = buildDailyAudit(getManilaDate(new Date(latest)), source)
  for (const pool of source.pools) {
    if (
      source.movements
        .filter((m) => m.inventoryPoolId === pool.id)
        .reduce((sum, m) => sum + m.delta, 0) !== pool.stockQuantity
    )
      throw new Error(
        'Legacy current balances do not reconcile with movements.',
      )
  }
  return {
    branchId,
    source,
    occurredAt: backup.exportedAt,
    report,
    counts: {
      products: source.products.length,
      sales: source.sales.length,
      movements: source.movements.length,
    },
  }
}

export async function importLegacy(database, uid, input, branchId, confirmed) {
  if (!confirmed)
    throw new Error(
      'Export a backup, stop legacy selling and confirm the selected branch before import.',
    )
  const plan = prepareLegacyImport(input, branchId)
  const id = eventId(branchId, 'legacy:pesopilot-business', 'import-v1')
  return database.transaction(
    'rw',
    database.branchCatalog,
    database.businessBranches,
    database.branchTransactions,
    database.realms,
    database.members,
    async () => {
      if (
        !(await businessAdmin(database, uid)) ||
        !(await authorizedBranches(database, uid)).some(
          (b) => b.id === branchId,
        )
      )
        throw new Error('Authorized branch Admin required.')
      const previous = await previousEvent(
        database.branchTransactions,
        branchId,
        'legacy:pesopilot-business',
        'import-v1',
      )
      if (previous) {
        if (JSON.stringify(previous.source) !== JSON.stringify(plan.source))
          throw new Error(
            'Another legacy source was already imported. No records were overwritten.',
          )
        return { duplicate: true, counts: plan.counts }
      }
      if (
        await database.branchTransactions
          .where('realmId')
          .equals(branchId)
          .count()
      )
        throw new Error(
          'Legacy import requires an empty, quiescent branch. Use an explicit reviewed migration for active branches.',
        )
      if (
        (await database.branchTransactions.toArray()).some(
          (entry) => entry.kind === 'legacyImport',
        )
      )
        throw new Error(
          'The legacy device ledger already has a default branch. Do not import it into another branch.',
        )
      for (const product of plan.source.products) {
        const existing = await database.branchCatalog.get(product.id)
        if (
          existing &&
          (existing.inventoryPoolId !== product.inventoryPoolId ||
            existing.unitPriceCentavos !== product.unitPriceCentavos ||
            existing.name !== product.name)
        )
          throw new Error(
            'Catalog differs from the legacy backup. Review before importing.',
          )
        if (!existing)
          await database.branchCatalog.add({
            ...product,
            stockQuantity: 0,
            realmId: BUSINESS_REALM,
            owner: null,
          })
      }
      await database.branchTransactions.add({
        id,
        realmId: branchId,
        branchId,
        owner: uid,
        actorId: uid,
        kind: 'legacyImport',
        source: plan.source,
        movements: plan.source.movements,
        occurredAt: plan.occurredAt,
      })
      return { duplicate: false, counts: plan.counts }
    },
  )
}
