import { useCallback, useEffect, useMemo, useState } from 'react'

import { dashboardService } from '@/features/dashboard/services/dashboardService.js'

import {
  defaultHeaderConfig,
  HeaderContext,
} from './headerContext.js'

function getNextCutoffLabel(data) {
  const daysLeft = data?.cutoffProgress?.daysLeft

  if (daysLeft === undefined || daysLeft === null) {
    return '--'
  }

  return `${daysLeft}d`
}

export function HeaderProvider({ children }) {
  const [config, setConfig] = useState(defaultHeaderConfig)
  const [statusConfig, setStatusConfig] = useState({
    healthScore: defaultHeaderConfig.healthScore,
    nextCutoff: defaultHeaderConfig.nextCutoff,
  })

  const refreshHeaderStatus = useCallback(async () => {
    try {
      const data = await dashboardService.loadDashboard()

      setStatusConfig({
        healthScore: data.healthScore ?? defaultHeaderConfig.healthScore,
        nextCutoff: getNextCutoffLabel(data),
      })
    } catch {
      setStatusConfig({
        healthScore: defaultHeaderConfig.healthScore,
        nextCutoff: defaultHeaderConfig.nextCutoff,
      })
    }
  }, [])

  useEffect(() => {
    refreshHeaderStatus()
  }, [refreshHeaderStatus])

  const value = useMemo(
    () => ({
      config: {
        ...config,
        ...statusConfig,
      },
      refreshHeaderStatus,
      setHeaderConfig: (nextConfig) =>
        setConfig({
          ...defaultHeaderConfig,
          ...statusConfig,
          ...nextConfig,
        }),
      resetHeaderConfig: () =>
        setConfig({
          ...defaultHeaderConfig,
          ...statusConfig,
        }),
    }),
    [config, refreshHeaderStatus, statusConfig],
  )

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}
