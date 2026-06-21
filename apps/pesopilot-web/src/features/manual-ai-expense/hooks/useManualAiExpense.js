import { useCallback, useEffect, useState } from 'react'

import { manualAiExpenseService } from '../services/manualAiExpenseService.js'

export function useManualAiExpense() {
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [parsedResult, setParsedResult] = useState(null)
  const [successRecord, setSuccessRecord] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadCategories() {
      try {
        setIsLoading(true)
        setError('')
        const nextCategories = await manualAiExpenseService.loadCategories()

        if (isMounted) {
          setCategories(nextCategories)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Unable to load parser metadata.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const parseInput = useCallback((rawText) => {
    setError('')
    setSuccessRecord(null)
    const result = manualAiExpenseService.parse(rawText)
    setParsedResult(result)
    return result
  }, [])

  const updateParsedResult = useCallback((changes) => {
    setParsedResult((currentResult) => ({
      ...currentResult,
      ...changes,
    }))
  }, [])

  const submitParsedResult = useCallback(async () => {
    if (!parsedResult) {
      return null
    }

    try {
      setIsSubmitting(true)
      setError('')
      const createdRecord =
        await manualAiExpenseService.submitToInbox(parsedResult)
      setSuccessRecord(createdRecord)
      return createdRecord
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit parsed expense.')
      throw submitError
    } finally {
      setIsSubmitting(false)
    }
  }, [parsedResult])

  const resetParser = useCallback(() => {
    setError('')
    setParsedResult(null)
    setSuccessRecord(null)
  }, [])

  return {
    categories,
    error,
    isLoading,
    isSubmitting,
    parseInput,
    parsedResult,
    resetParser,
    submitParsedResult,
    successRecord,
    updateParsedResult,
  }
}
