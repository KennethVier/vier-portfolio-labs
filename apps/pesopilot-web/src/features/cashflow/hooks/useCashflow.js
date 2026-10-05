import { useCallback, useEffect, useState } from 'react'

import { cashflowService } from '../services/cashflowService.js'

export function useCashflow() {
  const [cashflow, setCashflow] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [hasCurrentCutoff, setHasCurrentCutoff] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadCurrentCashflow = useCallback(async (asOfDate) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await cashflowService.getCurrentCashflowAndForecast(asOfDate)
      setCashflow(result.cashflow)
      setForecast(result.forecast)
      setExplanation(result.explanation)
      setHasCurrentCutoff(result.hasCurrentCutoff)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load cashflow')
      setCashflow(null)
      setForecast(null)
      setExplanation(null)
      setHasCurrentCutoff(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadCutoffCashflow = useCallback(async (cutoffId, asOfDate) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await cashflowService.calculateCashflowAndForecastForCutoff(cutoffId, asOfDate)
      setCashflow(result.cashflow)
      setForecast(result.forecast)
      setExplanation(result.explanation)
      setHasCurrentCutoff(result.hasCurrentCutoff)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load cutoff cashflow')
      setCashflow(null)
      setForecast(null)
      setExplanation(null)
      setHasCurrentCutoff(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentCashflow()
  }, [loadCurrentCashflow])

  return {
    cashflow,
    error,
    explanation,
    forecast,
    hasCurrentCutoff,
    isLoading,
    loadCurrentCashflow,
    loadCutoffCashflow,
  }
}
