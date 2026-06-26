import { useCallback, useEffect, useMemo, useState } from 'react'

import { EMPTY_INBOX_FILTERS } from '../constants/expenseInboxConstants.js'
import { expenseInboxService } from '../services/expenseInboxService.js'

export function useExpenseInbox() {
  const [categories, setCategories] = useState([])
  const [editingRecord, setEditingRecord] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(EMPTY_INBOX_FILTERS)
  const [inboxRecords, setInboxRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [kpis, setKpis] = useState({
    approvedToday: 0,
    pending: 0,
    rejectedToday: 0,
    total: 0,
  })
  const [selectedRecordId, setSelectedRecordId] = useState(null)

  const selectedRecord = useMemo(
    () =>
      inboxRecords.find((record) => record.id === selectedRecordId) ??
      inboxRecords[0] ??
      null,
    [inboxRecords, selectedRecordId],
  )

  const refresh = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setIsLoading(true)
    }

    setError(null)

    try {
      const result = await expenseInboxService.loadInbox(filters)
      setCategories(result.categories)
      setInboxRecords(result.records)
      setKpis(result.kpis)
      setSelectedRecordId((currentSelectedId) => {
        if (result.records.some((record) => record.id === currentSelectedId)) {
          return currentSelectedId
        }

        return result.records[0]?.id ?? null
      })
    } catch (loadError) {
      setError(loadError.message ?? 'Unable to load expense inbox')
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }, [filters])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function runMutation(action) {
    setIsSaving(true)
    setError(null)

    try {
      await action()
      setEditingRecord(null)
      await refresh({ showLoading: false })
    } catch (mutationError) {
      setError(mutationError.message ?? 'Unable to update inbox record')
      throw mutationError
    } finally {
      setIsSaving(false)
    }
  }

  const selectRecord = useCallback((record) => {
    setSelectedRecordId(record?.id ?? null)
  }, [])

  const updateFilters = useCallback((nextFilters) => {
    setFilters({
      ...EMPTY_INBOX_FILTERS,
      ...nextFilters,
    })
  }, [])

  return {
    approveRecord(id, payload) {
      return runMutation(() => expenseInboxService.approveInboxRecord(id, payload))
    },
    categories,
    editRecord(record) {
      setEditingRecord(record)
    },
    editingRecord,
    error,
    filters,
    inboxRecords,
    isLoading,
    isSaving,
    kpis,
    rejectRecord(id) {
      return runMutation(() => expenseInboxService.rejectInboxRecord(id))
    },
    resetEditingRecord() {
      setEditingRecord(null)
    },
    selectedRecord,
    selectRecord,
    updateFilters,
    updateRecord(id, payload) {
      return runMutation(() => expenseInboxService.updateInboxRecord(id, payload))
    },
  }
}
