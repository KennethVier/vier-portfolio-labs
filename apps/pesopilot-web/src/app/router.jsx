import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { App } from './App.jsx'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage.jsx'

const ExpensesPage = lazy(() =>
  import('@/features/expenses/pages/ExpensesPage.jsx').then((module) => ({
    default: module.ExpensesPage,
  })),
)

const SalaryCutoffPage = lazy(() =>
  import('@/features/salary-cutoff/pages/SalaryCutoffPage.jsx').then((module) => ({
    default: module.SalaryCutoffPage,
  })),
)

const IncomePage = lazy(() =>
  import('@/features/income/pages/IncomePage.jsx').then((module) => ({
    default: module.IncomePage,
  })),
)

const SavingsPage = lazy(() =>
  import('@/features/savings/pages/SavingsPage.jsx').then((module) => ({
    default: module.SavingsPage,
  })),
)

const CashflowPage = lazy(() =>
  import('@/features/cashflow/pages/CashflowPage.jsx').then((module) => ({
    default: module.CashflowPage,
  })),
)

const ManualAiExpensePage = lazy(() =>
  import('@/features/manual-ai-expense/pages/ManualAiExpensePage.jsx').then((module) => ({
    default: module.ManualAiExpensePage,
  })),
)

const MerchantRulesPage = lazy(() =>
  import('@/features/merchant-rules/pages/MerchantRulesPage.jsx').then((module) => ({
    default: module.MerchantRulesPage,
  })),
)

const ExpenseInboxPage = lazy(() =>
  import('@/features/expense-inbox/pages/ExpenseInboxPage.jsx').then((module) => ({
    default: module.ExpenseInboxPage,
  })),
)

const SettingsPage = lazy(() =>
  import('@/features/settings/pages/SettingsPage.jsx').then((module) => ({
    default: module.SettingsPage,
  })),
)

const HelpPage = lazy(() =>
  import('@/features/help/pages/HelpPage.jsx').then((module) => ({
    default: module.HelpPage,
  })),
)

const ReportsPage = lazy(() =>
  import('@/features/reports/pages/ReportsPage.jsx').then((module) => ({
    default: module.ReportsPage,
  })),
)

const DevToolsPage = lazy(() =>
  import('@/features/dev-tools/pages/DevToolsPage.jsx').then((module) => ({
    default: module.DevToolsPage,
  })),
)

function wrapLazyRoute(element, label = 'Loading page') {
  return (
    <Suspense
      fallback={
        <div className="rounded border border-outline-variant bg-surface-container-lowest p-3 text-sm text-content-muted">
          {label}
        </div>
      }
    >
      {element}
    </Suspense>
  )
}

const devRoutes = import.meta.env.DEV
  ? [
      {
        path: 'dev-tools',
        element: wrapLazyRoute(<DevToolsPage />, 'Loading dev tools'),
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'expenses',
        element: wrapLazyRoute(<ExpensesPage />, 'Loading expenses'),
      },
      {
        path: 'salary-cutoff',
        element: wrapLazyRoute(<SalaryCutoffPage />, 'Loading salary cutoff'),
      },
      {
        path: 'income',
        element: wrapLazyRoute(<IncomePage />, 'Loading income'),
      },
      {
        path: 'savings',
        element: wrapLazyRoute(<SavingsPage />, 'Loading savings'),
      },
      {
        path: 'cashflow',
        element: wrapLazyRoute(<CashflowPage />, 'Loading cashflow'),
      },
      {
        path: 'reports',
        element: wrapLazyRoute(<ReportsPage />, 'Loading reports'),
      },
      {
        path: 'manual-ai-expense',
        element: wrapLazyRoute(<ManualAiExpensePage />, 'Loading manual AI expense'),
      },
      {
        path: 'merchant-rules',
        element: wrapLazyRoute(<MerchantRulesPage />, 'Loading merchant rules'),
      },
      {
        path: 'expense-inbox',
        element: wrapLazyRoute(<ExpenseInboxPage />, 'Loading expense inbox'),
      },
      {
        path: 'settings',
        element: wrapLazyRoute(<SettingsPage />, 'Loading settings'),
      },
      {
        path: 'help',
        element: wrapLazyRoute(<HelpPage />, 'Loading help'),
      },
      ...devRoutes,
    ],
  },
])
