import { useCallback, useEffect, useState } from 'react'

import { cutoffService } from '../services/cutoffService.js'

export function useSalaryCutoffs() {
  const [cutoffs, setCutoffs] = useState([])
  const [currentCutoff, setCurrentCutoff] = useState(null)
  const [editingCutoff, setEditingCutoff] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadCutoffs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await cutoffService.loadCutoffs()
      setCutoffs(result.cutoffs)
      setCurrentCutoff(result.currentCutoff)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load salary cutoffs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCutoffs()
  }, [loadCutoffs])

  async function saveCutoff(cutoff) {
    setIsSaving(true)
    setError(null)

    try {
      if (editingCutoff) {
        await cutoffService.updateCutoff(editingCutoff.id, cutoff)
      } else {
        await cutoffService.createCutoff(cutoff)
      }

      setEditingCutoff(null)
      await loadCutoffs()
    } catch (saveError) {
      setError(saveError.message || 'Unable to save salary cutoff')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCutoff(id) {
    setError(null)

    try {
      await cutoffService.deleteCutoff(id)
      await loadCutoffs()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete salary cutoff')
    }
  }

  async function markCutoffActive(id) {
    setError(null)

    try {
      await cutoffService.markCutoffActive(id)
      await loadCutoffs()
    } catch (activeError) {
      setError(activeError.message || 'Unable to mark cutoff active')
    }
  }

  async function closeCutoff(id) {
    setError(null)

    try {
      await cutoffService.closeCutoff(id)
      await loadCutoffs()
    } catch (closeError) {
      setError(closeError.message || 'Unable to close salary cutoff')
    }
  }

  async function assignExpensesToCutoff(id) {
    setError(null)

    try {
      const assignedCount = await cutoffService.assignExpensesToCutoff(id)
      await loadCutoffs()
      return assignedCount
    } catch (assignError) {
      setError(assignError.message || 'Unable to assign expenses')
      return 0
    }
  }

  function clearEditingCutoff() {
    setEditingCutoff(null)
  }

  return {
    assignExpensesToCutoff,
    clearEditingCutoff,
    closeCutoff,
    currentCutoff,
    cutoffs,
    deleteCutoff,
    editingCutoff,
    error,
    isLoading,
    isSaving,
    markCutoffActive,
    saveCutoff,
    setEditingCutoff,
  }
}
