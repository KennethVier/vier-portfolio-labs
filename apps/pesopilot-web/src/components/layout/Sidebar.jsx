import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Expenses', to: '/expenses' },
  { label: 'Salary Cutoff', to: '/salary-cutoff' },
  { label: 'Savings', to: '/savings' },
  { label: 'Cashflow', to: '/cashflow' },
  { label: 'Reports', to: '/reports' },
  { label: 'Expense Inbox', to: '/expense-inbox' },
  { label: 'Settings', to: '/settings' },
]

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[240px] border-r border-outline-variant bg-surface-container-lowest lg:fixed lg:left-0 lg:top-0 lg:block">
      <div className="border-b border-outline-variant px-6 py-5">
        <p className="font-heading text-[18px] font-semibold leading-6 text-content">
          PesoPilot
        </p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted">
          Foundation
        </p>
      </div>
      <nav className="px-3 py-4" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'mb-1 flex min-h-9 items-center rounded px-3 text-sm font-medium text-content-muted transition-colors',
                isActive
                  ? 'border-l-2 border-primary bg-surface-container text-content'
                  : 'hover:bg-surface-container-low hover:text-content',
              ].join(' ')
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
