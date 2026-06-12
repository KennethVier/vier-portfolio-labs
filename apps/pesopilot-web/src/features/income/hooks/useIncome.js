import { useCallback, useEffect, useState } from 'react'

import { EMPTY_INCOME_FILTERS } from '../constants/incomeConstants.js'
import { incomeService } from '../services/incomeService.js'

export function useIncome() {
  const [income, setIncome] = useState([])
  const [salaryCutoffs, setSalaryCutoffs] = useState([])
  const [filters, setFilters] = useState(EMPTY_INCOME_FILTERS)
  const [editingIncome, setEditingIncome] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadIncome = useCallback(async (nextFilters = filters) => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextIncome, nextSalaryCutoffs] = await Promise.all([
        incomeService.loadIncome(nextFilters),
        incomeService.loadSalaryCutoffs(),
      ])

      setIncome(nextIncome)
      setSalaryCutoffs(nextSalaryCutoffs)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load income')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadIncome(filters)
  }, [filters, loadIncome])

  async function saveIncome(incomeRecord) {
    setIsSaving(true)
    setError(null)

    try {
      if (editingIncome) {
        await incomeService.updateIncome(editingIncome.id, incomeRecord)
      } else {
        await incomeService.createIncome(incomeRecord)
      }

      setEditingIncome(null)
      await loadIncome(filters)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save income')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteIncome(id) {
    setError(null)

    try {
      await incomeService.deleteIncome(id)
      await loadIncome(filters)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete income')
    }
  }

  function updateFilters(nextFilters) {
    setFilters({
      ...EMPTY_INCOME_FILTERS,
      ...nextFilters,
    })
  }

  function clearEditingIncome() {
    setEditingIncome(null)
  }

  return {
    clearEditingIncome,
    deleteIncome,
    editingIncome,
    error,
    filters,
    income,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveIncome,
    setEditingIncome,
    updateFilters,
  }
}
