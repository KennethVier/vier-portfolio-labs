import { useMemo, useState } from 'react'

import {
  defaultHeaderConfig,
  HeaderContext,
} from './headerContext.js'

export function HeaderProvider({ children }) {
  const [config, setConfig] = useState(defaultHeaderConfig)

  const value = useMemo(
    () => ({
      config,
      setHeaderConfig: (nextConfig) =>
        setConfig({
          ...defaultHeaderConfig,
          ...nextConfig,
        }),
      resetHeaderConfig: () => setConfig(defaultHeaderConfig),
    }),
    [config],
  )

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}
