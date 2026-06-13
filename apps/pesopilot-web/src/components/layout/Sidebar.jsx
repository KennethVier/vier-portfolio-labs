import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: 'D', label: 'Dashboard', to: '/dashboard' },
  { icon: 'E', label: 'Expenses', to: '/expenses' },
  { icon: 'C', label: 'Salary Cutoff', to: '/salary-cutoff' },
  { icon: 'I', label: 'Income', to: '/income' },
  { icon: 'S', label: 'Savings', to: '/savings' },
  { icon: 'F', label: 'Cashflow', to: '/cashflow' },
  { icon: 'R', label: 'Reports', to: '/reports' },
  { icon: 'X', label: 'Expense Inbox', to: '/expense-inbox' },
  { icon: 'G', label: 'Settings', to: '/settings' },
]

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[240px] border-r border-outline-variant bg-surface-container-low lg:fixed lg:left-0 lg:top-0 lg:block">
      <div className="border-b border-outline-variant px-5 py-5">
        <p className="font-heading text-[22px] font-semibold leading-7 text-primary">
          PesoPilot
        </p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.05em] text-content">
          Financial OS
        </p>
      </div>
      <nav className="px-3 py-5" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'mb-1 flex min-h-9 items-center gap-3 rounded px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-l-2 border-primary bg-primary-fixed text-primary'
                  : 'border-l-2 border-transparent text-content-muted hover:bg-surface-container hover:text-content',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden="true"
                  className={[
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[9px] font-bold leading-none',
                    isActive
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline text-content-muted',
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
    </aside>
  )
}
