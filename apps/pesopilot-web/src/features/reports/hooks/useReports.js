import { useEffect, useState } from 'react'

import { reportService } from '../services/reportService.js'

const initialReportsState = {
  data: null,
  error: null,
  isLoading: true,
}

export function useReports(options) {
  const [state, setState] = useState(initialReportsState)

  useEffect(() => {
    let isMounted = true

    async function loadReports() {
      setState((currentState) => ({
        data: currentState.data,
        error: null,
        isLoading: true,
      }))

      try {
        const data = await reportService.loadReports(options)

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
  }, [options])

  return state
}
