import { Button } from '@/components/ui/Button.jsx'
import { useBusinessAccess } from '../cloud/access.js'
import { useAutomaticBusinessBackup } from '../hooks/useAutomaticBusinessBackup.js'
import { MorningStockCheck } from './MorningStockCheck.jsx'
import { NavLink, Link } from 'react-router-dom'
import { BusinessIcon } from './BusinessIcon.jsx'
import '../business.css'

const links = [
  ['/business', 'POS', 'pos'],
  ['/business/inventory', 'Inventory', 'inventory'],
  ['/business/audit', 'Daily Audit', 'audit'],
  ['/business/history', 'Sales Analytics', 'history'],
  ['/business/settings', 'Settings / Backup', 'settings'],
]

export function BusinessShell({ children }) {
  const access = useBusinessAccess()
  const isStaff = access?.profile.role === 'staff'
  const sharedStock = ['/business/stock', 'Shared stock', 'inventory']
  const navigation = isStaff
    ? [links[0], sharedStock, ['/business/receipts', 'My sales', 'history']]
    : access
      ? [...links, sharedStock, ['/business/users', 'Users', 'settings']]
      : links
  useAutomaticBusinessBackup()
  return (
    <div className="business-touch min-h-screen">
      {!isStaff && <MorningStockCheck />}
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-8">
          <Link
            to="/business"
            className="business-brand flex min-h-11 items-center gap-3 rounded focus-visible:outline-primary"
          >
            <span className="business-brand-mark flex h-11 w-11 items-center justify-center rounded-lg">
              <BusinessIcon name="pos" />
            </span>
            <span>
              <span className="business-wordmark block text-xl">
                PesoPilot <span className="text-primary">Business</span>
              </span>
              <span className="block text-xs text-content-muted">Your daily sales workspace</span>
            </span>
          </Link>
          <nav aria-label="Business navigation" className="flex w-full gap-1 overflow-x-auto xl:w-auto">
            {navigation.map(([path, label, icon]) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/business'}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-primary ${isActive ? 'bg-primary-fixed text-primary' : 'text-content-muted hover:bg-surface-container-low'}`
                }
              >
                <BusinessIcon name={icon} />
                {label}
              </NavLink>
            ))}
          </nav>
          {access && (
            <div className="business-account flex w-full flex-wrap items-center justify-between gap-3 border-t pt-3 text-sm">
              <div className="min-w-0">
                <p className="break-all font-semibold">{access.profile.email || access.profile.id}</p>
                <p className="capitalize">{access.profile.role}</p>
              </div>
              <Button
                variant="secondary"
                className="business-signout min-h-11 shrink-0"
                onClick={access.logout}
              >
                Sign out
              </Button>
            </div>
          )}
        </div>
      </header>
      <main id="business-main" className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-4 text-xs text-content-muted sm:px-8">
        <p>Stored on this device · Back up after each selling day</p>
      </footer>
    </div>
  )
}
