import { useCallback, useEffect, useState } from 'react'

import { EMPTY_EXPENSE_FILTERS } from '../constants/expenseConstants.js'
import { expenseService } from '../services/expenseService.js'

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [salaryCutoffs, setSalaryCutoffs] = useState([])
  const [filters, setFilters] = useState(EMPTY_EXPENSE_FILTERS)
  const [editingExpense, setEditingExpense] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  const loadExpenses = useCallback(async (nextFilters = filters) => {
    setIsLoading(true)
    setError(null)

    try {
      const [nextExpenses, nextCategories, nextSalaryCutoffs] = await Promise.all([
        expenseService.loadExpenses(nextFilters),
        expenseService.loadCategories(),
        expenseService.loadSalaryCutoffs(),
      ])

      setExpenses(nextExpenses)
      setCategories(nextCategories)
      setSalaryCutoffs(nextSalaryCutoffs)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load expenses')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadExpenses(filters)
  }, [filters, loadExpenses])

  async function saveExpense(expense) {
    setIsSaving(true)
    setError(null)

    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expense)
      } else {
        await expenseService.createExpense(expense)
      }

      setEditingExpense(null)
      await loadExpenses(filters)
    } catch (saveError) {
      setError(saveError.message || 'Unable to save expense')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteExpense(id) {
    setError(null)

    try {
      await expenseService.deleteExpense(id)
      await loadExpenses(filters)
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete expense')
    }
  }

  function updateFilters(nextFilters) {
    setFilters({
      ...EMPTY_EXPENSE_FILTERS,
      ...nextFilters,
    })
  }

  function clearEditingExpense() {
    setEditingExpense(null)
  }

  return {
    categories,
    clearEditingExpense,
    deleteExpense,
    editingExpense,
    error,
    expenses,
    filters,
    isLoading,
    isSaving,
    salaryCutoffs,
    saveExpense,
    setEditingExpense,
    updateFilters,
  }
}
