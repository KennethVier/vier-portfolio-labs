import { createContext, useContext } from 'react'

export const defaultHeaderConfig = {
  searchPlaceholder: 'Search data points...',
  searchValue: '',
  showSearch: true,
  onSearchChange: undefined,
  healthScore: 94,
  nextCutoff: '3d',
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
