import { NavLink } from 'react-router-dom'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'payments', label: 'Expenses', to: '/expenses' },
  { icon: 'event_busy', label: 'Salary Cutoff', to: '/salary-cutoff' },
  { icon: 'account_balance_wallet', label: 'Income', to: '/income' },
  { icon: 'savings', label: 'Savings', to: '/savings' },
  { icon: 'swap_calls', label: 'Cashflow', to: '/cashflow' },
  { icon: 'analytics', label: 'Reports', to: '/reports' },
  { icon: 'inbox', label: 'Expense Inbox', to: '/expense-inbox' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[240px] flex-col border-r border-outline-variant bg-surface px-4 py-6 lg:flex">
      <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">account_balance_wallet</span>
          </div>
          <div>
              <h1 className="font-display-lg text-display-lg font-semibold text-primary">PesoPilot</h1>
              <p className="text-[10px] font-label-caps uppercase tracking-widest text-outline">Financial OS</p>
          </div>
      </div>
      <nav className="px-3 py-5" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
    </aside>
  )
}
