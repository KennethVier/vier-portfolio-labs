import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'payments', label: 'Expenses', to: '/expenses' },
  { icon: 'event_busy', label: 'Salary Cutoff', to: '/salary-cutoff' },
  { icon: 'account_balance_wallet', label: 'Income', to: '/income' },
  { icon: 'savings', label: 'Savings', to: '/savings' },
  { icon: 'swap_calls', label: 'Cashflow', to: '/cashflow' },
  { icon: 'bar_chart', label: 'Reports', to: '/reports' },
  { icon: 'inbox', label: 'Expense Inbox', to: '/expense-inbox' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
  ...(import.meta.env.DEV
    ? [{ icon: 'construction', label: 'Dev Tools', to: '/dev-tools' }]
    : []),
]

function Brand({ compact = false }) {
  return (
    <div className={['flex items-center gap-3 px-2', compact ? 'mb-0' : 'mb-8'].join(' ')}>
      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
        <span className="material-symbols-outlined text-lg text-white">
          account_balance_wallet
        </span>
      </div>
      <div>
        <h1 className="font-display-lg text-display-lg font-semibold text-primary">
          PesoPilot
        </h1>
        <p className="text-[10px] font-label-caps uppercase tracking-widest text-outline">
          Financial OS
        </p>
      </div>
    </div>
  )
}

function Navigation({ onNavigate }) {
  return (
    <nav className="px-3 py-5" aria-label="Primary navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2 transition-colors duration-150',
              isActive
                ? 'border-l-2 border-primary bg-surface-container-low font-medium text-primary'
                : 'rounded text-on-surface-variant hover:bg-surface-container',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  'material-symbols-outlined',
                  isActive ? 'text-primary' : 'text-on-surface-variant',
                ].join(' ')}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export function Sidebar({ isMobileOpen = false, onClose }) {
  useEffect(() => {
    if (!isMobileOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileOpen, onClose])

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[240px] flex-col border-r border-outline-variant bg-surface px-4 py-6 lg:flex">
        <Brand />
        <Navigation />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/25"
            aria-label="Close navigation"
            onClick={onClose}
          />
          <aside className="relative flex h-full w-[min(82vw,280px)] flex-col border-r border-outline-variant bg-surface px-4 py-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <Brand compact />
              <button
                type="button"
                className="rounded border border-outline-variant p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close navigation"
                onClick={onClose}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <Navigation onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  )
}
