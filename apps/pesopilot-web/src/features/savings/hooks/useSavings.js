import { useCallback, useEffect, useState } from 'react'

import { EMPTY_SAVINGS_FILTERS } from '../constants/savingsConstants.js'
import { savingsService } from '../services/savingsService.js'

export function useSavings() {
  const [savings, setSavings] = useState([])
  const [savingsKpis, setSavingsKpis] = useState({
    currentCutoffId: null,
    largestSavingsType: 'None',
    savingsRecords: 0,
    totalSavings: 0,
  })
  const [salaryCutoffs, setSalaryCutoffs] = useState([])
  const [filters, setFilters] = useState(EMPTY_SAVINGS_FILTERS)
  const [editingSavings, setEditingSavings] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadSavings = useCallback(async (nextFilters = filters) => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextSavings, nextSalaryCutoffs, nextSavingsKpis] = await Promise.all([
        savingsService.loadSavings(nextFilters),
        savingsService.loadSalaryCutoffs(),
        savingsService.loadSavingsKpis(),
      ])

      setSavings(nextSavings)
      setSavingsKpis(nextSavingsKpis)
      setSalaryCutoffs(nextSalaryCutoffs)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load savings')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadSavings(filters)
  }, [filters, loadSavings])

  async function saveSavings(savingsRecord) {
    setIsSaving(true)
    setError(null)

    try {
      if (editingSavings) {
        await savingsService.updateSavings(editingSavings.id, savingsRecord)
      } else {
        await savingsService.createSavings(savingsRecord)
      }

      setEditingSavings(null)
      await loadSavings(filters)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save savings')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteSavings(id) {
    setError(null)

    try {
      await savingsService.deleteSavings(id)
      await loadSavings(filters)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete savings')
    }
  }

  function updateFilters(nextFilters) {
    setFilters({
      ...EMPTY_SAVINGS_FILTERS,
      ...nextFilters,
    })
  }

  function clearEditingSavings() {
    setEditingSavings(null)
  }

  return {
    clearEditingSavings,
    deleteSavings,
    editingSavings,
    error,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveSavings,
    savings,
    savingsKpis,
    setEditingSavings,
    updateFilters,
  }
}
