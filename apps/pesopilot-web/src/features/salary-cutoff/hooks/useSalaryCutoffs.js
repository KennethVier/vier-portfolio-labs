import { useCallback, useEffect, useState } from 'react'

import { cutoffService } from '../services/cutoffService.js'

function getCutoffErrorMessage(error, fallbackMessage) {
  const message = error.message || fallbackMessage

  if (message.toLowerCase().includes('overlap')) {
    return 'This cutoff overlaps an existing cutoff. Choose another payday/date range, edit the existing cutoff, or create the next non-overlapping cycle.'
  }

  return message
}

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
      let savedCutoff

      if (editingCutoff) {
        savedCutoff = await cutoffService.updateCutoff(editingCutoff.id, cutoff)
      } else {
        savedCutoff = await cutoffService.createCutoff(cutoff)
      }

      setEditingCutoff(null)
      await loadCutoffs()
      return savedCutoff
    } catch (saveError) {
      const message = getCutoffErrorMessage(saveError, 'Unable to save salary cutoff')
      setError(message)
      throw new Error(message)
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

  async function createNextCutoff(id) {
    setError(null)

    try {
      const nextCutoff = await cutoffService.createNextCutoff(id)
      await loadCutoffs()
      return nextCutoff
    } catch (nextError) {
      const message = getCutoffErrorMessage(nextError, 'Unable to create next cutoff')
      setError(message)
      throw new Error(message)
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

  function clearEditingCutoff() {
    setEditingCutoff(null)
  }

  function clearError() {
    setError(null)
  }

  return {
    clearError,
    clearEditingCutoff,
    closeCutoff,
    createNextCutoff,
    currentCutoff,
    cutoffs,
    deleteCutoff,
    editingCutoff,
    error,
    isLoading,
    isSaving,
    saveCutoff,
    setEditingCutoff,
  }
}
