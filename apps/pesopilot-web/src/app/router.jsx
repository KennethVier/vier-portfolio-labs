import { createBrowserRouter } from 'react-router-dom'

import { App } from './App.jsx'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage.jsx'
import { ExpensesPage } from '@/features/expenses/pages/ExpensesPage.jsx'
import { IncomePage } from '@/features/income/pages/IncomePage.jsx'
import { SalaryCutoffPage } from '@/features/salary-cutoff/pages/SalaryCutoffPage.jsx'
import { SavingsPage } from '@/features/savings/pages/SavingsPage.jsx'
import { CashflowPage } from '@/features/cashflow/pages/CashflowPage.jsx'
import { ReportsPage } from '@/features/reports/pages/ReportsPage.jsx'
import { ExpenseInboxPage } from '@/features/expense-inbox/pages/ExpenseInboxPage.jsx'
import { SettingsPage } from '@/features/settings/pages/SettingsPage.jsx'

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
      { path: 'reports', element: <ReportsPage /> },
      { path: 'expense-inbox', element: <ExpenseInboxPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
