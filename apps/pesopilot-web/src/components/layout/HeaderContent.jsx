import { createContext, useContext, useMemo, useState } from 'react'

const defaultHeaderConfig = {
  searchPlaceholder: 'Search data points...',
  searchValue: '',
  showSearch: true,
  onSearchChange: undefined,
  healthScore: 94,
  nextCutoff: '3d',
}

const HeaderContext = createContext(null)

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

export function useHeader() {
  const context = useContext(HeaderContext)

  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider')
  }

  return context
}