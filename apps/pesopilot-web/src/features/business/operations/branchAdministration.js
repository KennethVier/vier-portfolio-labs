import {
  BUSINESS_REALM,
  authorizedBranches,
  businessAdmin,
} from './branchRepository.js'

export async function createBranch(database, userId, name, requestKey) {
  if (!navigator.onLine) throw new Error('Connect to manage branches.')
  const clean = name.trim()
  if (!clean || clean.length > 80 || !/^[a-zA-Z0-9-]{1,80}$/.test(requestKey))
    throw new Error('Enter a branch name and stable creation key.')
  await database.cloud.sync({ purpose: 'pull', wait: true })
  const id = 'rlm-pesopilot-branch-' + requestKey
  await database.transaction(
    'rw',
    database.businessBranches,
    database.realms,
    database.members,
    async () => {
      if (!(await businessAdmin(database, userId)))
        throw new Error('Admin membership required.')
      const existing = await database.businessBranches.get(id)
      if (existing) {
        if (existing.name !== clean || existing.realmId !== BUSINESS_REALM)
          throw new Error('Branch key belongs to another branch.')
        return
      }
      if (
        (
          await database.businessBranches
            .where('realmId')
            .equals(BUSINESS_REALM)
            .toArray()
        ).some((branch) => branch.name.toLowerCase() === clean.toLowerCase())
      )
        throw new Error(
          'A branch with this name already exists. Review the branch list before retrying.',
        )
      const business = await database.realms.get(BUSINESS_REALM)
      // Canonical owner creates branches; the other Admin remains invited for oversight.
      if (business.owner !== userId)
        throw new Error('The business owner creates branch realms.')
      await database.realms.add({ realmId: id, owner: userId, name: clean })
      await database.businessBranches.add({
        id,
        branchId: id,
        realmId: BUSINESS_REALM,
        owner: null,
        name: clean,
        createdAt: new Date().toISOString(),
      })
      const admins = await database.members
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray()
      for (const member of admins.filter(
        (m) =>
          m.userId !== userId &&
          m.roles?.join() === 'admin' &&
          m.accepted &&
          !m.rejected,
      ))
        await database.members.add({
          realmId: id,
          email: member.email ?? member.userId,
          roles: ['admin'],
          invite: true,
        })
    },
  )
  await database.cloud.sync({ purpose: 'push', wait: true })
  return id
}

export async function assignStaff(database, userId, branchId, email) {
  if (!navigator.onLine) throw new Error('Connect to assign Staff.')
  email = email.trim().toLowerCase()
  await database.cloud.sync({ purpose: 'pull', wait: true })
  await database.transaction(
    'rw',
    database.businessBranches,
    database.realms,
    database.members,
    async () => {
      if (
        !(await businessAdmin(database, userId)) ||
        !(await authorizedBranches(database, userId)).some(
          (b) => b.id === branchId,
        )
      )
        throw new Error('Authorized branch Admin required.')
      const members = await database.members.toArray()
      const staff = members.find(
        (m) =>
          m.realmId === BUSINESS_REALM &&
          (m.email ?? m.userId)?.toLowerCase() === email &&
          m.roles?.join() === 'staff' &&
          m.accepted &&
          !m.rejected,
      )
      if (!staff)
        throw new Error(
          'First complete restricted Staff registration and business invitation acceptance in Users.',
        )
      const branchIds = new Set(
        (
          await database.businessBranches
            .where('realmId')
            .equals(BUSINESS_REALM)
            .toArray()
        ).map((b) => b.id),
      )
      const assignments = members.filter(
        (m) =>
          branchIds.has(m.realmId) &&
          !m.rejected &&
          (m.userId === staff.userId || m.email?.toLowerCase() === email),
      )
      if (assignments.some((m) => m.realmId !== branchId))
        throw new Error(
          'Staff already has another branch assignment. Review it before reassignment.',
        )
      if (assignments.length) {
        const assigned = assignments[0]
        if (
          assigned.roles?.join() !== 'staff' ||
          JSON.stringify(assigned.permissions) !==
            JSON.stringify({ add: ['branchTransactions'] })
        )
          throw new Error(
            'Existing branch permissions differ; owner review is required.',
          )
        return
      }
      await database.members.add({
        realmId: branchId,
        email,
        roles: ['staff'],
        invite: true,
        permissions: { add: ['branchTransactions'] },
      })
    },
  )
  await database.cloud.sync({ purpose: 'push', wait: true })
}

export async function publishCatalog(database, userId, products) {
  await database.transaction(
    'rw',
    database.branchCatalog,
    database.realms,
    database.members,
    async () => {
      if (!(await businessAdmin(database, userId)))
        throw new Error('Admin membership required.')
      for (const product of products) {
        if (product.catalog?.sampleKey || product.inventoryUnitsPerSale !== 1)
          throw new Error(
            'Review archived samples or unsupported consumption before publishing.',
          )
        const existing = await database.branchCatalog.get(product.id)
        if (existing) {
          if (
            existing.realmId !== BUSINESS_REALM ||
            existing.inventoryPoolId !== product.inventoryPoolId ||
            existing.name !== product.name
          )
            throw new Error(
              'Existing catalog definition differs. No catalog was overwritten.',
            )
          continue // Publish never resets a price edited in the shared catalog.
        }
        await database.branchCatalog.add({
          ...product,
          stockQuantity: 0,
          realmId: BUSINESS_REALM,
          owner: null,
        })
      }
    },
  )
  await database.cloud.sync({ purpose: 'push', wait: true })
}
