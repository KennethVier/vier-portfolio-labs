import { createContext, useContext } from 'react'

export const defaultHeaderConfig = {
  searchPlaceholder: 'Search data points...',
  searchValue: '',
  showSearch: false,
  onSearchChange: undefined,
  healthScore: '--',
  nextCutoff: '--',
  statusSize: 'md',
}

export const HeaderContext = createContext(null)

export function useHeader() {
  const context = useContext(HeaderContext)

  if (!context) {
    throw new Error('useHeader must be used within HeaderProvider')
  }

  return context
}
