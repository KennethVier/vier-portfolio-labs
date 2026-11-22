import { roleNavigation } from '../operations/navigation.js'
import { BusinessAccountMenu } from './BusinessAccountMenu.jsx'
import { useBusinessAccess } from '../cloud/access.js'
import { useAutomaticBusinessBackup } from '../hooks/useAutomaticBusinessBackup.js'
import { MorningStockCheck } from './MorningStockCheck.jsx'
import { NavLink, Link } from 'react-router-dom'
import { BusinessIcon } from './BusinessIcon.jsx'
import '../business.css'

export function BusinessShell({ children }) {
  const access = useBusinessAccess()
  const isStaff = access?.profile.role === 'staff'
  const navigation = roleNavigation(access?.profile.role)
  useAutomaticBusinessBackup()
  return (
    <div className="business-touch min-h-screen">
      {!access && !isStaff && <MorningStockCheck />}
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-4 py-4 sm:px-8">
          <Link
            to="/business"
            className="business-brand flex min-h-11 min-w-0 items-center gap-3 rounded focus-visible:outline-primary"
          >
            <span className="business-brand-mark flex h-11 w-11 items-center justify-center rounded-lg">
              <BusinessIcon name="pos" />
            </span>
            <span className="min-w-0">
              <span className="business-wordmark block text-xl">
                PesoPilot <span className="text-primary">Business</span>
              </span>
              <span className="block text-xs text-content-muted">
                Your daily sales workspace
              </span>
            </span>
          </Link>
          {access && (
            <BusinessAccountMenu
              profile={access.profile}
              logout={access.logout}
            />
          )}
          <nav
            aria-label="Business navigation"
            className="col-span-2 flex w-full gap-1 overflow-x-auto"
          >
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
        </div>
      </header>
      <main
        id="business-main"
        className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8"
      >
        {children}
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-4 text-xs text-content-muted sm:px-8">
        <p>Stored on this device · Back up after each selling day</p>
      </footer>
    </div>
  )
}
