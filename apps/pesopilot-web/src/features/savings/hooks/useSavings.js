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
  const [savingsGoals, setSavingsGoals] = useState([])
  const [salaryCutoffs, setSalaryCutoffs] = useState([])
  const [filters, setFilters] = useState(EMPTY_SAVINGS_FILTERS)
  const [editingSavings, setEditingSavings] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadSavings = useCallback(async (nextFilters = filters) => {
    setIsLoading(true)
    setError(null)

    try {
      const [
        nextSavings,
        nextSalaryCutoffs,
        nextSavingsKpis,
        nextSavingsGoals,
      ] = await Promise.all([
        savingsService.loadSavings(nextFilters),
        savingsService.loadSalaryCutoffs(),
        savingsService.loadSavingsKpis(),
        savingsService.loadSavingsGoals(),
      ])

      setSavings(nextSavings)
      setSavingsKpis(nextSavingsKpis)
      setSavingsGoals(nextSavingsGoals)
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

  async function saveSavingsGoal(goal) {
    setIsSaving(true)
    setError(null)

    try {
      if (editingGoal) {
        await savingsService.updateSavingsGoal(editingGoal.id, goal)
      } else {
        await savingsService.createSavingsGoal(goal)
      }

      setEditingGoal(null)
      await loadSavings(filters)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save savings goal')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function archiveSavingsGoal(id) {
    setError(null)

    try {
      await savingsService.archiveSavingsGoal(id)
      await loadSavings(filters)
    } catch (archiveError) {
      setError(archiveError.message || 'Unable to archive savings goal')
    }
  }

  async function deleteSavingsGoal(id) {
    setError(null)

    try {
      await savingsService.deleteSavingsGoal(id)
      await loadSavings(filters)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete savings goal')
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

  const updateFilters = useCallback((nextFilters) => {
    setFilters({
      ...EMPTY_SAVINGS_FILTERS,
      ...nextFilters,
    })
  }, [])

  function clearEditingSavings() {
    setEditingSavings(null)
  }

  function clearEditingGoal() {
    setEditingGoal(null)
  }

  return {
    archiveSavingsGoal,
    clearEditingSavings,
    clearEditingGoal,
    deleteSavings,
    deleteSavingsGoal,
    editingGoal,
    editingSavings,
    error,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveSavings,
    saveSavingsGoal,
    savings,
    savingsGoals,
    savingsKpis,
    setEditingGoal,
    setEditingSavings,
    updateFilters,
  }
}
