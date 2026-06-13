import { useCallback, useEffect, useState } from 'react'

import { cashflowService } from '../services/cashflowService.js'

export function useCashflow() {
  const [cashflow, setCashflow] = useState(null)
  const [hasCurrentCutoff, setHasCurrentCutoff] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCurrentCashflow = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await cashflowService.getCurrentCashflow()
      setCashflow(result.cashflow)
      setHasCurrentCutoff(result.hasCurrentCutoff)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load cashflow')
    } finally {
      setIsLoading(false)
    }
  }, [])

  async function loadCutoffCashflow(cutoffId) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await cashflowService.calculateCashflowForCutoff(cutoffId)
      setCashflow(result.cashflow)
      setHasCurrentCutoff(result.hasCurrentCutoff)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load cutoff cashflow')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCurrentCashflow()
  }, [loadCurrentCashflow])

  return {
    cashflow,
    error,
    hasCurrentCutoff,
    isLoading,
    loadCurrentCashflow,
    loadCutoffCashflow,
  }
}
