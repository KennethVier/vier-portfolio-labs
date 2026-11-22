export function ownerMaintenanceAllowed(
  profile,
  environment = {
    development: import.meta.env.DEV,
    enabled: import.meta.env.VITE_BUSINESS_OWNER_MAINTENANCE === 'true',
  },
) {
  return (
    profile?.role === 'admin' && environment.development && environment.enabled
  )
}
