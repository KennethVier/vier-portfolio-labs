import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { App } from './App.jsx'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage.jsx'
import { ExpenseInboxPage } from '@/features/expense-inbox/pages/ExpenseInboxPage.jsx'
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage.jsx'
import { IncomePage } from '@/features/income/pages/IncomePage.jsx'
import { SalaryCutoffPage } from '@/features/salary-cutoff/pages/SalaryCutoffPage.jsx'
import { SavingsPage } from '@/features/savings/pages/SavingsPage.jsx'
import { CashflowPage } from '@/features/cashflow/pages/CashflowPage.jsx'
import { SettingsPage } from '@/features/settings/pages/SettingsPage.jsx'

const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage.jsx').then((module) => ({
    default: module.ReportsPage,
  })),
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'salary-cutoff', element: <SalaryCutoffPage /> },
      { path: 'income', element: <IncomePage /> },
      { path: 'savings', element: <SavingsPage /> },
      { path: 'cashflow', element: <CashflowPage /> },
      {
        path: 'reports',
        element: (
          <Suspense
            fallback={
              <div className="rounded border border-outline-variant bg-surface-container-lowest p-3 text-sm text-content-muted">
                Loading reports
              </div>
            }
          >
            <ReportsPage />
          </Suspense>
        ),
      },
      { path: 'expense-inbox', element: <ExpenseInboxPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
