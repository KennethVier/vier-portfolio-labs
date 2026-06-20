import { useEffect, useState } from 'react'

import { dashboardService } from '../services/dashboardService.js'

export function useDashboard() {
  const [dashboardState, setDashboardState] = useState({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      try {
        const data = await dashboardService.loadDashboard()

        if (!isMounted) {
          return
        }

        setDashboardState({
          data,
          error: null,
          isLoading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setDashboardState({
          data: null,
          error: error.message,
          isLoading: false,
        })
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  return dashboardState
}
