import { useEffect, useState, useCallback } from 'react'
import { initialPull } from '../cloud/initialPull.ts'
import { BUSINESS_REALM } from './branchRepository.js'
import {
  catalogInitializationState,
  initializeStandardCatalog,
} from './catalogInitialization.js'
export function useCatalogInitialization(database, profile, ready) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState({ phase: 'checking' })
  const userId = profile.id,
    role = profile.role
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  useEffect(() => {
    if (
      !database ||
      database.cloud?.options?.databaseUrl !==
        'https://z5jxogiwe.dexie.cloud' ||
      role !== 'admin' ||
      !ready
    )
      return
    let active = true
    const update = (value) => {
      if (active) setStatus(value)
    }
    async function run() {
      update({ phase: 'checking' })
      const read = () =>
        database.branchCatalog.where('realmId').equals(BUSINESS_REALM).toArray()
      const existing = catalogInitializationState(await read())
      if (existing.initialized && !existing.missing && !existing.conflicts) {
        update({ phase: 'ready' })
        return
      }
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        update({ phase: 'offline' })
        return
      }
      const realm = await database.realms.get(BUSINESS_REALM)
      if (!existing.initialized && realm?.owner !== userId) {
        update({ phase: 'owner' })
        return
      }
      // New clients must not treat an empty/partial local cache as an empty business.
      try {
        await initialPull(database)
      } catch {
        update({ phase: 'connection' })
        return
      }
      if (!active) return
      const pulled = catalogInitializationState(await read())
      if (pulled.initialized) {
        update({
          phase: pulled.conflicts
            ? 'review'
            : pulled.missing
              ? 'waiting'
              : 'ready',
        })
        return
      }
      const result = await initializeStandardCatalog(database, userId)
      update({
        phase: result.missing || result.conflicts ? 'waiting' : 'ready',
      })
    }
    void run().catch((error) =>
      update({
        phase: 'review',
        ...(error?.code === 'CATALOG_DUPLICATES'
          ? { issues: error.productNames }
          : {}),
      }),
    )
    return () => {
      active = false
    }
  }, [database, userId, role, ready, attempt])
  return { ...status, retry }
}
