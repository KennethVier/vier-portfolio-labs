import { useCallback, useEffect, useState } from 'react'

import { budgetShockService } from '../services/budgetShockService.js'

export function useBudgetShock(cutoffId = null, asOfDate = null) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const reload = useCallback(() => {
    setReloadTrigger((count) => count + 1)
  }, [])

  useEffect(() => {
    let isCancelled = false

    setIsLoading(true)
    setError(null)
    // Clear stale state immediately on cutoff switch so previous cutoff risk/alert never leaks
    setData(null)

    if (cutoffId === null && cutoffId !== undefined) {
      setIsLoading(false)
      return undefined
    }

    async function fetchData() {
      try {
        const result = cutoffId
          ? await budgetShockService.evaluateBudgetShockForCutoff(cutoffId, asOfDate)
          : await budgetShockService.getCurrentBudgetShock(asOfDate)

        if (!isCancelled) {
          setData(result)
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.message || 'Unable to load budget shock data')
          setData(null)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [cutoffId, asOfDate, reloadTrigger])

  return {
    activeAlert: data?.activeAlert ?? null,
    data,
    error,
    forecast: data?.forecast ?? null,
    hasCurrentCutoff: data?.hasCurrentCutoff ?? false,
    isLoading,
    recommendation: data?.recommendation ?? null,
    reload,
    risk: data?.risk ?? null,
  }
}
