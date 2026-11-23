import { useCatalogInitialization } from './useCatalogInitialization.js'
import { uploadCatalogPhoto, saveCatalogPhoto } from './catalogMedia.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { liveQuery } from 'dexie'
import { useBusinessAccess } from '../cloud/access.js'
import { db } from '../cloud/client.ts'
import { initialPull } from '../cloud/initialPull.ts'
import { createBusinessService } from '../services/businessService.js'
import { createBranchRepository } from './branchRepository.js'
import {
  readBranchWorkspace,
  workspaceReadReport,
  WorkspaceReadError,
  WORKSPACE_READ_MESSAGE,
} from './workspaceRead.js'

export function useBranchWorkspace(database = db) {
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
    readStatus: 'loading',
  })
  const [sync, setSync] = useState({ phase: 'initial' })
  const [invites, setInvites] = useState([])
  const generation = useRef(0)
  const refreshing = useRef(null)
  const active = useRef(null)
  const phase = useRef('initial')
  const context = useMemo(
    () => ({ userId: profile.id, role: profile.role, branchId }),
    [profile.id, profile.role, branchId],
  )
  const repo = useMemo(
    () => createBranchRepository(database, context),
    [database, context],
  )
  const service = useMemo(() => createBusinessService(repo), [repo])
  const accept = useCallback(
    (value) => {
      setState(value)
      if (value.resolvedBranchId !== context.branchId)
        setBranchId(value.resolvedBranchId)
    },
    [context],
  )
  const fail = useCallback(
    (error) =>
      setState((old) => ({
        ...old,
        error: WORKSPACE_READ_MESSAGE,
        isLoading: false,
        readStatus: 'error',
        diagnostics: workspaceReadReport(database, error, phase.current),
      })),
    [database],
  )
  useEffect(() => {
    const current = ++generation.current
    const session = { disposed: false }
    setState((old) => ({ ...old, isLoading: true, readStatus: 'loading' }))
    const status = database.cloud.syncState.subscribe((value) => {
      phase.current = value.phase
      setSync(value)
    })
    const invitations = database.cloud.invites.subscribe(setInvites)
    const subscription = liveQuery(
      async () => await readBranchWorkspace(database, context),
    ).subscribe({
      next(value) {
        if (!session.disposed && generation.current === current) accept(value)
      },
      error(error) {
        if (!session.disposed && generation.current === current) fail(error)
      },
    })
    active.current = { subscription, session }
    return () => {
      session.disposed = true
      subscription.unsubscribe()
      status.unsubscribe()
      invitations.unsubscribe()
    }
  }, [database, context, accept, fail, attempt])
  const refresh = useCallback(() => {
    if (refreshing.current) return refreshing.current
    const task = (async () => {
      const current = ++generation.current
      const session = active.current?.session
      active.current?.subscription.unsubscribe()
      setState((old) => ({ ...old, isLoading: true, readStatus: 'loading' }))
      let loaded = false
      try {
        let pullFailure
        try {
          await initialPull(database)
        } catch (error) {
          pullFailure = new WorkspaceReadError('synchronization', error)
          pullFailure.message =
            'Could not get cloud updates. Available business records remain on this device.'
        }
        const value = await readBranchWorkspace(database, context)
        if (!session || session.disposed || generation.current !== current)
          throw new DOMException(
            'Business view changed during reload.',
            'AbortError',
          )
        accept(value)
        loaded = true
        setAttempt((value) => value + 1)
        if (pullFailure) throw pullFailure
      } catch (error) {
        if (
          !loaded &&
          session &&
          !session.disposed &&
          generation.current === current
        )
          fail(error)
        throw error
      }
    })()
    refreshing.current = task
    void task
      .finally(() => {
        if (refreshing.current === task) refreshing.current = null
      })
      .catch(() => {})
    return task
  }, [database, context, accept, fail])

  const catalogSetup = useCatalogInitialization(
    database,
    profile,
    state.readStatus === 'ready',
  )
  return {
    ...state,
    database,
    catalogSetup,
    branchId,
    setBranchId,
    repo,
    service,
    profile,
    photos: state.photos ?? [],
    uploadPhoto: (file, familyId) =>
      uploadCatalogPhoto(database, profile.id, file, familyId),
    removePhoto: (familyId) =>
      saveCatalogPhoto(database, profile.id, familyId, null),
    sync,
    invites,
    refresh,
    completeSale: (input) => service.completeSale(input),
    receiveStock: (entries, options) => service.receiveStock(entries, options),
  }
}
