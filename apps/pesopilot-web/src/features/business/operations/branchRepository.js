import { planConfirmedSale } from '../services/planConfirmedSale.js'
import { findDuplicateProduct } from '../constants/productCatalog.js'

export const BUSINESS_REALM = 'rlm-pesopilot-business-dev'
export const branchStores = {
  branchCatalog: 'id,realmId,inventoryPoolId,name',
  businessBranches: 'id,realmId',
  branchTransactions: 'id,realmId,occurredAt',
}
const accepted = (member) => member.accepted && !member.rejected
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const integer = (value) => Number.isSafeInteger(value)
export function eventId(branch, actor, key) {
  if (
    ![branch, actor, key].every(
      (value) =>
        typeof value === 'string' && value.length > 0 && value.length <= 400,
    )
  )
    throw new Error('A stable branch, actor and request key are required.')
  return JSON.stringify([branch, actor, key])
}
const directRead = (_stage, action) => action()
export async function businessAdmin(database, uid, read = directRead) {
  const realm = await read('authorization.admin.realm', () =>
    database.realms.get(BUSINESS_REALM),
  )
  if (!realm || !uid) return false
  if (realm.owner === uid) return true
  return (
    await read('authorization.admin.members', () =>
      database.members.where('realmId').equals(BUSINESS_REALM).toArray(),
    )
  ).some((m) => m.userId === uid && accepted(m) && same(m.roles, ['admin']))
}
export async function authorizedBranches(database, uid, read = directRead) {
  const branches = await read('authorization.registry', () =>
    database.businessBranches.where('realmId').equals(BUSINESS_REALM).toArray(),
  )
  const members = await read('authorization.members', () =>
    database.members.toArray(),
  )
  const admin = await businessAdmin(database, uid, read)
  if (
    !admin &&
    !members.some(
      (m) =>
        m.realmId === BUSINESS_REALM &&
        m.userId === uid &&
        accepted(m) &&
        same(m.roles, ['staff']),
    )
  )
    return []
  const realms = new Map(
    (await read('authorization.realms', () => database.realms.toArray())).map(
      (row) => [row.realmId, row],
    ),
  )
  return branches.filter(
    (branch) =>
      branch.id === branch.branchId &&
      realms.has(branch.id) &&
      (realms.get(branch.id).owner === uid ||
        members.some(
          (m) =>
            m.realmId === branch.id &&
            m.userId === uid &&
            accepted(m) &&
            (admin ? same(m.roles, ['admin']) : same(m.roles, ['staff'])),
        )),
  )
}

// The transport synchronizes these envelopes; this projection only performs accounting.
export function projectBranch(catalog, events, branchId) {
  const products = catalog.map((row) => ({ ...row, stockQuantity: 0 }))
  const pools = new Map(
    products.map((p) => [
      p.inventoryPoolId,
      {
        id: p.inventoryPoolId,
        name: p.inventoryPoolName ?? p.name,
        stockQuantity: 0,
        createdAt: p.createdAt,
      },
    ]),
  )
  const sales = [],
    items = [],
    movements = [],
    auditEvents = []
  const seen = new Set()
  function integrity(condition, code) {
    if (!condition)
      throw Object.assign(
        new Error(
          'Branch ledger integrity check failed. No stock was replaced.',
        ),
        { code },
      )
  }
  // Owner is provider access metadata, not an accounting invariant. The pinned addon
  // replaces null with the writer; existing creator-owned records must remain readable.
  for (const entry of events) {
    integrity(entry && typeof entry === 'object', 'BRANCH_RECORD_SHAPE')
    integrity(
      typeof entry.id === 'string' && Boolean(entry.id),
      'BRANCH_EVENT_ID',
    )
    integrity(
      entry.realmId === branchId && entry.branchId === branchId,
      'BRANCH_SCOPE_MISMATCH',
    )
    integrity(
      typeof entry.actorId === 'string' && Boolean(entry.actorId),
      'BRANCH_ACTOR_MISSING',
    )
    integrity(
      entry.owner == null ||
        (typeof entry.owner === 'string' && Boolean(entry.owner)),
      'BRANCH_OWNER_SHAPE',
    )
    integrity(!seen.has(entry.id), 'BRANCH_EVENT_DUPLICATE')
    integrity(
      typeof entry.occurredAt === 'string' &&
        Number.isFinite(Date.parse(entry.occurredAt)),
      'BRANCH_TIME_INVALID',
    )
    seen.add(entry.id)
  }
  const ordered = [...events].sort(
    (a, b) =>
      a.occurredAt.localeCompare(b.occurredAt) || a.id.localeCompare(b.id),
  )
  for (const entry of ordered) {
    if (
      !['sale', 'stock_adjustment', 'legacyImport'].includes(entry.kind) ||
      !Array.isArray(entry.movements)
    )
      throw new Error('Unsupported branch ledger record.')
    if (entry.kind === 'legacyImport') {
      for (const product of entry.source.products) {
        const present = products.find((p) => p.id === product.id)
        if (!present) products.push({ ...product, stockQuantity: 0 })
      }
      for (const pool of entry.source.pools)
        if (!pools.has(pool.id))
          pools.set(pool.id, { ...pool, stockQuantity: 0 })
      sales.push(
        ...entry.source.sales.map((row) => ({
          ...row,
          branchId,
          actorId: 'legacy:unattributed',
        })),
      )
      items.push(
        ...entry.source.items.map((row) => ({
          ...row,
          sourceId: row.id,
          id: entry.id + ':legacy:item:' + row.id,
          branchId,
          actorId: 'legacy:unattributed',
        })),
      )
    } else if (entry.sale) {
      if (
        entry.sale.branchId !== branchId ||
        entry.sale.actorId !== entry.actorId ||
        !Array.isArray(entry.items) ||
        !integer(entry.sale.totalCentavos) ||
        !['cash', 'gcash', 'coop'].includes(entry.sale.paymentMethod) ||
        entry.sale.totalCentavos !==
          entry.items.reduce((sum, line) => sum + line.lineTotalCentavos, 0) ||
        entry.movements.length !== entry.items.length ||
        entry.items.some(
          (line) =>
            !integer(line.quantity) ||
            line.quantity <= 0 ||
            !integer(line.lineTotalCentavos) ||
            !integer(line.unitPriceCentavos) ||
            line.unitPriceCentavos < 1 ||
            line.lineTotalCentavos !== line.quantity * line.unitPriceCentavos ||
            line.saleId !== entry.sale.id ||
            !entry.movements.some(
              (m) =>
                m.saleId === line.saleId &&
                m.productId === line.productId &&
                m.delta === -line.quantity,
            ),
        )
      )
        throw new Error('Branch sale and movement totals do not reconcile.')
      sales.push(entry.sale)
      items.push(...entry.items)
    } else if (entry.kind === 'sale') throw new Error('Branch sale is missing.')
    for (const movement of entry.movements) {
      const product = products.find((p) => p.id === movement.productId)
      const pool = pools.get(movement.inventoryPoolId)
      if (
        !pool ||
        product?.inventoryPoolId !== pool.id ||
        !integer(movement.delta) ||
        !movement.delta ||
        ![
          'sale',
          'stock_adjustment',
          'opening_stock',
          'stock_received',
        ].includes(movement.type) ||
        (movement.type === 'stock_adjustment' && !movement.reason?.trim())
      )
        throw new Error('Branch stock movement does not reconcile.')
      const beforeQuantity = pool.stockQuantity
      pool.stockQuantity += movement.delta
      if (!integer(pool.stockQuantity))
        throw new Error('Branch stock limit exceeded.')
      movements.push({
        ...movement,
        sourceId:
          entry.kind === 'legacyImport'
            ? entry.id + ':legacy:movement:' + movement.id
            : movement.id,
        id: movements.length + 1,
        branchId,
        actorId: entry.actorId,
        beforeQuantity,
        afterQuantity: pool.stockQuantity,
      })
    }
    auditEvents.push({
      id: entry.id,
      type: entry.kind === 'sale' ? 'sale_completed' : entry.kind,
      branchId,
      actorId: entry.actorId,
      occurredAt: entry.occurredAt,
      payload: entry,
    })
  }
  const conflicts = [...pools.values()].filter((pool) => pool.stockQuantity < 0)
  return {
    products: products.map((p) => ({
      ...p,
      stockQuantity: pools.get(p.inventoryPoolId)?.stockQuantity ?? 0,
    })),
    pools: [...pools.values()],
    sales,
    items,
    movements,
    events: auditEvents,
    conflicts,
  }
}

export function createBranchRepository(database, { userId, branchId }) {
  const tables = [
    database.branchCatalog,
    database.businessBranches,
    database.branchTransactions,
    database.realms,
    database.members,
  ]
  async function requireAdmin() {
    if (!(await businessAdmin(database, userId)))
      throw new Error('Admin membership required.')
  }
  async function requireBranch(write = false) {
    const branches = await authorizedBranches(database, userId)
    const admin = await businessAdmin(database, userId)
    if (
      !branchId ||
      !branches.some((branch) => branch.id === branchId) ||
      (!admin && branches.length !== 1)
    )
      throw new Error(
        'Exactly one authorized branch assignment is required for Staff.',
      )
    if (write && admin)
      throw new Error('Branch operations belong to assigned Staff.')
  }
  async function source() {
    await requireBranch()
    return projectBranch(
      await database.branchCatalog
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray(),
      await database.branchTransactions
        .where('realmId')
        .equals(branchId)
        .toArray(),
      branchId,
    )
  }
  async function append(key, input, build) {
    const id = eventId(branchId, userId, key)
    return database.transaction('rw', tables, async () => {
      await requireBranch(true)
      const previous = await database.branchTransactions.get(id)
      if (previous) {
        if (!same(previous.input, input))
          throw new Error(
            'This request key already belongs to a different operation.',
          )
        return { sale: previous.sale, duplicate: true }
      }
      const state = await source()
      const entry = build(state, id)
      if (!Number.isFinite(Date.parse(entry.occurredAt)))
        throw new Error('Invalid operation time.')
      const branch = await database.realms.get(branchId)
      if (typeof branch?.owner !== 'string' || !branch.owner)
        throw new Error(
          'Branch owner is missing. Ask the owner to review this branch.',
        )
      await database.branchTransactions.add({
        ...entry,
        id,
        input,
        realmId: branchId,
        branchId,
        actorId: userId,
        owner: branch.owner,
      })
      return { sale: entry.sale, duplicate: false }
    })
  }
  return {
    source: () => database.transaction('r', tables, source),
    async listProducts() {
      return (await this.source()).products
    },
    async listSalesHistory() {
      const state = await this.source()
      return state.sales
        .map((sale) => ({
          ...sale,
          items: state.items.filter((item) => item.saleId === sale.id),
        }))
        .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))
    },
    async listSales() {
      return (await this.source()).sales
    },
    async listAuditEvents() {
      return (await this.source()).events
    },
    readDailyAuditSource() {
      return this.source()
    },
    async addProduct(product) {
      return database.transaction('rw', tables, async () => {
        await requireAdmin()
        if (product.stockQuantity !== 0)
          throw new Error(
            'Create catalog products at zero stock. Receive stock in a branch.',
          )
        const catalog = await database.branchCatalog
          .where('realmId')
          .equals(BUSINESS_REALM)
          .toArray()
        if (findDuplicateProduct(catalog, product))
          throw new Error('This product already exists.')
        if (
          product.inventoryPoolId !== product.id &&
          !catalog.some((p) => p.inventoryPoolId === product.inventoryPoolId)
        )
          throw new Error('Choose an existing shared stock pool.')
        const shared = catalog.find(
          (p) => p.inventoryPoolId === product.inventoryPoolId,
        )
        await database.branchCatalog.add({
          ...product,
          inventoryPoolName:
            shared?.inventoryPoolName ?? product.inventoryPoolName,
          stockQuantity: 0,
          realmId: BUSINESS_REALM,
          owner: null,
        })
        return product
      })
    },
    async setPrice(productId, priceCentavos) {
      return database.transaction('rw', tables, async () => {
        await requireAdmin()
        if (!integer(priceCentavos) || priceCentavos < 1)
          throw new Error('Invalid price.')
        const product = await database.branchCatalog.get(productId)
        if (product?.realmId !== BUSINESS_REALM)
          throw new Error('Product not found.')
        await database.branchCatalog.update(productId, {
          unitPriceCentavos: priceCentavos,
        })
      })
    },
    adjustStock({ productId, delta, reason, occurredAt, requestKey }) {
      if (
        !integer(delta) ||
        !delta ||
        !reason?.trim() ||
        reason.trim().length > 240
      )
        throw new Error('A whole quantity and reason are required.')
      return append(
        requestKey,
        { productId, delta, reason: reason.trim() },
        (state) => {
          const product = state.products.find((p) => p.id === productId)
          const pool = state.pools.find(
            (p) => p.id === product?.inventoryPoolId,
          )
          if (!pool) throw new Error('Product not found.')
          if (!integer(pool.stockQuantity + delta))
            throw new Error('Stock limit exceeded.')
          if (pool.stockQuantity + delta < 0)
            throw new Error(
              'Insufficient stock. Reconcile the physical count first.',
            )
          return {
            kind: 'stock_adjustment',
            occurredAt,
            movements: [
              {
                id: eventId(branchId, userId, requestKey) + ':movement',
                productId,
                inventoryPoolId: pool.id,
                poolNameSnapshot: pool.name,
                delta,
                type: 'stock_adjustment',
                saleId: null,
                reason: reason.trim(),
                occurredAt,
              },
            ],
          }
        },
      )
    },
    commitConfirmedSale({ sale, items }) {
      if (
        !['cash', 'gcash', 'coop'].includes(sale.paymentMethod) ||
        !Array.isArray(items) ||
        !items.length ||
        new Set(items.map((item) => item.productId)).size !== items.length ||
        items.some(
          (item) =>
            !integer(item.quantity) ||
            item.quantity <= 0 ||
            (item.acceptedUnitPriceCentavos !== undefined &&
              (!integer(item.acceptedUnitPriceCentavos) ||
                item.acceptedUnitPriceCentavos < 1)),
        )
      )
        throw new Error('Invalid sale items or payment method.')
      const input = { paymentMethod: sale.paymentMethod, items }
      return append(sale.requestKey, input, (state, id) => {
        if (state.conflicts.length)
          throw new Error(
            'Stock conflict. Reconcile the physical count before another sale.',
          )
        const attributed = { ...sale, id, branchId, actorId: userId }
        const plan = planConfirmedSale(
          attributed,
          items,
          new Map(state.products.map((p) => [p.id, p])),
          new Map(state.pools.map((p) => [p.id, p])),
        )
        return {
          kind: 'sale',
          occurredAt: sale.confirmedAt,
          sale: plan.confirmedSale,
          items: plan.lineItems.map((row, n) => ({
            ...row,
            id: id + ':item:' + n,
            branchId,
            actorId: userId,
          })),
          movements: plan.movements.map((row, n) => ({
            ...row,
            id: id + ':movement:' + n,
            branchId,
            actorId: userId,
          })),
        }
      })
    },
  }
}
