import { useCallback, useEffect, useState } from 'react'

import { insightService } from '../services/insightService.js'
import { DEFAULT_INSIGHT_SCOPE } from '../utils/insightConstants.js'

export function useInsights({ scope = DEFAULT_INSIGHT_SCOPE } = {}) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const nextInsights = await insightService.loadInsights({ scope })
      setInsights(nextInsights)
      return nextInsights
    } catch (loadError) {
      setError(loadError)
      throw loadError
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    let isMounted = true

    async function loadInitialInsights() {
      setLoading(true)
      setError(null)

      try {
        const nextInsights = await insightService.loadInsights({ scope })

        if (isMounted) {
          setInsights(nextInsights)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialInsights()

    return () => {
      isMounted = false
    }
  }, [scope])

  return {
    insights,
    loading,
    error,
    refresh,
  }
}
