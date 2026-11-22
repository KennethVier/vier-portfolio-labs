import { useCallback, useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { useBusinessAccess } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { createBusinessService } from '../services/businessService.js'
import {
  authorizedBranches,
  createBranchRepository,
  projectBranch,
  BUSINESS_REALM,
} from './branchRepository.js'

export function useBranchWorkspace() {
  const { profile } = useBusinessAccess()
  const [branchId, setBranchId] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    branches: [],
    catalog: [],
    members: [],
    products: [],
    sales: [],
    events: [],
    conflicts: [],
    isLoading: true,
  })
  const [sync, setSync] = useState({ phase: 'initial' })
  const [invites, setInvites] = useState([])
  const repo = useMemo(
    () => createBranchRepository(db, { userId: profile.id, branchId }),
    [profile.id, branchId],
  )
  const service = useMemo(() => createBusinessService(repo), [repo])
  useEffect(() => {
    const status = db.cloud.syncState.subscribe(setSync)
    const invitations = db.cloud.invites.subscribe(setInvites)
    const subscription = liveQuery(async () => {
      const branches = await authorizedBranches(db, profile.id)
      const catalog = await db.branchCatalog
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray()
      const members = await db.members.toArray()
      const registry = await db.businessBranches
        .where('realmId')
        .equals(BUSINESS_REALM)
        .toArray()
      const overviews = await Promise.all(
        branches.map(async (branch) => ({
          branch,
          ...projectBranch(
            catalog,
            await db.branchTransactions
              .where('realmId')
              .equals(branch.id)
              .toArray(),
            branch.id,
          ),
        })),
      )
      if (
        profile.role === 'staff' &&
        branches.length === 1 &&
        branchId !== branches[0].id
      )
        return { branches, catalog, members, select: branches[0].id }
      const permitted =
        branches.some((branch) => branch.id === branchId) &&
        (profile.role === 'admin' || branches.length === 1)
      const source = permitted
        ? await repo.source()
        : { products: [], sales: [], events: [], conflicts: [] }
      const sales = permitted ? await repo.listSalesHistory() : []
      return {
        ...source,
        sales,
        branches,
        catalog,
        members,
        overviews,
        registry,
        isLoading: false,
        error: null,
      }
    }).subscribe({
      next(value) {
        if (value.select) setBranchId(value.select)
        else setState(value)
      },
      error() {
        setState((old) => ({
          ...old,
          products: [],
          sales: [],
          error:
            'Unable to read branch operations. Check schema, membership and ledger integrity.',
          isLoading: false,
        }))
      },
    })
    return () => {
      subscription.unsubscribe()
      status.unsubscribe()
      invitations.unsubscribe()
    }
  }, [profile.id, profile.role, repo, branchId, attempt])
  const refresh = useCallback(async () => {
    await db.cloud.sync({ purpose: 'pull', wait: true })
    setAttempt((value) => value + 1)
  }, [])
  return {
    ...state,
    branchId,
    setBranchId,
    repo,
    service,
    profile,
    photos: [],
    sync,
    invites,
    refresh,
    completeSale: (input) => service.completeSale(input),
    receiveStock: () =>
      Promise.reject(
        new Error('Use Branch Inventory to receive stock with a reason.'),
      ),
  }
}
