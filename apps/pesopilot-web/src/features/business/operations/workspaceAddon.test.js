import Dexie from 'dexie'
import dexieCloud from 'dexie-cloud-addon'
import { expect, it } from 'vitest'
import { branchStores, projectBranch } from './branchRepository.js'

it('reproduces the pinned addon ownership metadata incompatibility without network or real data', async () => {
  const database = new Dexie('workspace-addon-fixture-' + crypto.randomUUID(), {
    addons: [dexieCloud],
  })
  database.version(1).stores({ catalogStock: 'id,realmId' })
  database.version(2).stores(branchStores)
  try {
    await database.open() // No databaseUrl: no cloud request, authentication or provider write.
    const catalog = {
      id: 'synthetic-product',
      name: 'Synthetic Lavender',
      inventoryPoolId: 'synthetic-pool',
      inventoryPoolName: 'Synthetic pool',
      unitPriceCentavos: 9900,
      createdAt: '2026-11-22T00:00:00.000Z',
    }
    const record = {
      id: 'synthetic-receipt',
      realmId: 'synthetic-branch',
      branchId: 'synthetic-branch',
      actorId: database.cloud.currentUserId,
      owner: null,
      kind: 'stock_adjustment',
      occurredAt: '2026-11-22T01:00:00.000Z',
      movements: [
        {
          id: 'synthetic-movement',
          productId: catalog.id,
          inventoryPoolId: catalog.inventoryPoolId,
          poolNameSnapshot: catalog.inventoryPoolName,
          type: 'stock_adjustment',
          delta: 10,
          reason: 'Synthetic receipt',
          occurredAt: '2026-11-22T01:00:00.000Z',
          saleId: null,
        },
      ],
    }
    await database.branchTransactions.add(record)
    const saved = await database.branchTransactions.get(record.id)
    expect(saved.owner).toBe(database.cloud.currentUserId)
    expect(database.verno).toBe(2)
    expect(saved.owner).not.toBeNull()
    // This exact persisted record throws in the uncorrected 08d68e9 projection.
    expect(
      projectBranch([catalog], [saved], 'synthetic-branch').pools[0]
        .stockQuantity,
    ).toBe(10)
    const delegated = {
      ...saved,
      id: 'delegated-receipt',
      owner: 'synthetic-business-owner',
    }
    await database.branchTransactions.add(delegated)
    expect((await database.branchTransactions.get(delegated.id)).owner).toBe(
      'synthetic-business-owner',
    )
  } finally {
    await database.delete()
  }
})
