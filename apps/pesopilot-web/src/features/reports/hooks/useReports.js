import { useEffect, useState } from 'react'

import { reportService } from '../services/reportService.js'

const initialReportsState = {
  data: null,
  error: null,
  isLoading: true,
}

export function useReports() {
  const [state, setState] = useState(initialReportsState)

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      try {
        const data = await reportService.loadReports()

        if (!isMounted) {
          return
        }

        setState({
          data,
          error: null,
          isLoading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState({
          data: null,
          error: error.message,
          isLoading: false,
        })
      }
    }

    loadReports()

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
