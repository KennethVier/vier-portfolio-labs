import { useCallback, useEffect, useState } from 'react'

import { merchantRuleService } from '../services/merchantRuleService.js'

export const EMPTY_MERCHANT_RULE_FILTERS = {
  categoryId: '',
  search: '',
  source: '',
}

export function useMerchantRules() {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_MERCHANT_RULE_FILTERS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rules, setRules] = useState([])

  const refresh = useCallback(async (nextFilters = filters) => {
    try {
      setIsLoading(true)
      setError('')
      const result = await merchantRuleService.loadRules(nextFilters)
      setCategories(result.categories)
      setRules(result.rules)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load merchant rules.')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    refresh(filters)
  }, [filters, refresh])

  const updateFilters = useCallback((changes) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...changes,
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_MERCHANT_RULE_FILTERS)
  }, [])

  const createRule = useCallback(async (payload) => {
    try {
      setIsSaving(true)
      setError('')
      await merchantRuleService.createRule(payload)
      await refresh()
    } catch (saveError) {
      setError(saveError.message || 'Unable to create merchant rule.')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const updateRule = useCallback(async (id, payload) => {
    try {
      setIsSaving(true)
      setError('')
      await merchantRuleService.updateRule(id, payload)
      await refresh()
    } catch (saveError) {
      setError(saveError.message || 'Unable to update merchant rule.')
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  const deleteRule = useCallback(async (id) => {
    if (!window.confirm('Delete this user merchant rule?')) {
      return
    }

    try {
      setIsSaving(true)
      setError('')
      await merchantRuleService.deleteRule(id)
      await refresh()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete merchant rule.')
      throw deleteError
    } finally {
      setIsSaving(false)
    }
  }, [refresh])

  return {
    categories,
    createRule,
    deleteRule,
    error,
    filters,
    isLoading,
    isSaving,
    resetFilters,
    rules,
    updateFilters,
    updateRule,
  }
}
