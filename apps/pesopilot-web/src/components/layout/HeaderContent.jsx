import { useCallback, useEffect, useMemo, useState } from 'react'

import { dashboardService } from '@/features/dashboard/services/dashboardService.js'

import {
  defaultHeaderConfig,
  HeaderContext,
} from './headerContext.js'

function getNextCutoffLabel(data) {
  if (!data?.currentCutoff) {
    return '--'
  }

  const daysLeft = data?.cutoffProgress?.daysLeft

  if (daysLeft === undefined || daysLeft === null) {
    return '--'
  }

  return `${daysLeft}d`
}

export function HeaderProvider({ children }) {
  const [config, setConfig] = useState(defaultHeaderConfig)
  const [statusConfig, setStatusConfig] = useState({
    nextCutoff: defaultHeaderConfig.nextCutoff,
  })

  const refreshHeaderStatus = useCallback(async () => {
    try {
      const data = await dashboardService.loadDashboard()

      setStatusConfig({
        nextCutoff: getNextCutoffLabel(data),
      })
    } catch {
      setStatusConfig({
        nextCutoff: defaultHeaderConfig.nextCutoff,
      })
    }
  }, [])

  useEffect(() => {
    refreshHeaderStatus()
  }, [refreshHeaderStatus])

  const setHeaderConfig = useCallback((nextConfig) => {
    setConfig({
      ...defaultHeaderConfig,
      ...nextConfig,
    })
  }, [])

  const resetHeaderConfig = useCallback(() => {
    setConfig(defaultHeaderConfig)
  }, [])

  const value = useMemo(
    () => ({
      config: {
        ...config,
        ...statusConfig,
      },
      refreshHeaderStatus,
      setHeaderConfig,
      resetHeaderConfig,
    }),
    [config, refreshHeaderStatus, resetHeaderConfig, setHeaderConfig, statusConfig],
  )

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}
