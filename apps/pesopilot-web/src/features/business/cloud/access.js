import { createContext, useContext } from 'react'
export const AccessContext = createContext(null)
export function useBusinessAccess() {
  return useContext(AccessContext)
}
export function permits(profile, adminOnly) {
  return (
    profile?.enabled === true && (profile.role === 'admin' || (!adminOnly && profile.role === 'staff'))
  )
}
