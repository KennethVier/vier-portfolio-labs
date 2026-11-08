import { NavLink, Link } from 'react-router-dom'
import { BusinessIcon } from './BusinessIcon.jsx'
import '../business.css'

const links = [
  ['/business', 'POS', 'pos'], ['/business/inventory', 'Inventory', 'inventory'],
  ['/business/audit', 'Daily Audit', 'audit'], ['/business/history', 'Sales History', 'history'],
  ['/business/settings', 'Settings / Backup', 'settings'],
]

export function BusinessShell({ children }) {
  return <div className="business-touch min-h-screen">
    <header className="border-b border-outline-variant bg-surface-container-lowest">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-8">
        <Link to="/business" className="business-brand flex min-h-11 items-center gap-3 rounded focus-visible:outline-primary">
          <span className="business-brand-mark flex h-11 w-11 items-center justify-center rounded-lg"><BusinessIcon name="pos" /></span>
          <span><span className="block font-heading text-xl font-semibold tracking-tight">PesoPilot <span className="text-primary">Business</span></span><span className="block text-xs text-content-muted">Your daily sales workspace</span></span>
        </Link>
        <nav aria-label="Business navigation" className="flex w-full gap-1 overflow-x-auto xl:w-auto">
          {links.map(([path, label, icon]) => <NavLink key={path} to={path} end={path === '/business'} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-primary ${isActive ? 'bg-primary-fixed text-primary' : 'text-content-muted hover:bg-surface-container-low'}`}><BusinessIcon name={icon} />{label}</NavLink>)}
        </nav>
      </div>
    </header>
    <main id="business-main" className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-outline-variant px-4 py-4 text-xs text-content-muted sm:px-8">
      <p>Stored on this device · Back up after each selling day</p>
      <Link to="/dashboard" className="flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">Switch to Personal</Link>
    </footer>
  </div>
}
