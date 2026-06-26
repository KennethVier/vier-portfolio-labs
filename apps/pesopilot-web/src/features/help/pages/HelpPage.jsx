import { Link } from 'react-router-dom'

import { PageHeader, SectionCard, StatusBadge } from '@/components/dashboard'
import { Button } from '@/components/ui/Button.jsx'

const workflowSteps = [
  {
    description: 'Define the salary-funded cycle that current KPIs use.',
    icon: 'event_repeat',
    title: 'Salary Cutoff',
  },
  {
    description: 'Record received salary and other inflows for the cycle.',
    icon: 'payments',
    title: 'Record Income',
  },
  {
    description: 'Create lifetime goals for money you want to protect or grow.',
    icon: 'flag',
    title: 'Create Savings Goal',
  },
  {
    description: 'Add real savings records linked to a goal and cutoff.',
    icon: 'savings',
    title: 'Add Savings Contributions',
  },
  {
    description: 'Track official spending records against the current cycle.',
    icon: 'receipt_long',
    title: 'Track Expenses',
  },
  {
    description: 'Review historical trends and compare cutoff periods.',
    icon: 'bar_chart',
    title: 'Review Reports',
  },
  {
    description: 'AI summaries are planned after the local workflow is stable.',
    icon: 'auto_awesome',
    title: 'Receive AI Insights',
    badge: 'Coming soon',
  },
]

const faqs = [
  {
    question: 'Why do KPI totals only show the current cutoff?',
    answer:
      'PesoPilot treats KPI cards as current-cycle widgets. Ledgers and Reports remain historical so you can still inspect older records.',
  },
  {
    question: "Why doesn't deleting a cutoff delete my records?",
    answer:
      'Income, expenses, and savings are financial records. Cutoffs organize them, but removing a cutoff should not erase the underlying history.',
  },
  {
    question: 'What is AI Quick Add?',
    answer:
      'AI Quick Add is a local natural-language parser. It sends parsed items to Expense Inbox for review; it does not create official expenses directly.',
  },
  {
    question: 'Why are Reports different from Dashboard?',
    answer:
      'Dashboard focuses on the current salary cutoff. Reports are for historical analysis across all data or a selected cutoff scope.',
  },
]

const featureGuides = [
  ['Dashboard', 'Current-cutoff status, recent activity, and operational shortcuts.'],
  ['Expenses', 'Official expense ledger and AI Quick Add entry point.'],
  ['Income', 'Current-cycle income KPIs and historical income records.'],
  ['Savings', 'Savings goals plus cutoff-based savings contributions.'],
  ['Cashflow', 'Read-only current-cutoff income, spending, savings, and remaining cash.'],
  ['Reports', 'Historical graphs and cutoff comparison.'],
  ['Expense Inbox', 'Review detected or manually parsed expenses before approval.'],
  ['Settings', 'Local preferences, backup/import, and advanced categorization access.'],
  ['Merchant Rules', 'Advanced local rules learned from category corrections.'],
]

const quickActions = [
  ['Create Salary Cutoff', '/salary-cutoff', 'event_repeat'],
  ['Record Income', '/income', 'payments'],
  ['Create Savings Goal', '/savings', 'flag'],
  ['Add Expense', '/expenses', 'add_card'],
  ['View Reports', '/reports', 'bar_chart'],
]

export function HelpPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Help Center"
        description="Learn the cutoff-centric workflow behind PesoPilot."
      />

      <SectionCard
        title="How PesoPilot Works"
        description="Follow this sequence to keep current-cycle tracking accurate."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <article
              key={step.title}
              className="border border-outline-variant bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-primary-container text-primary">
                  <span className="material-symbols-outlined text-lg">
                    {step.icon}
                  </span>
                </span>
                <span className="font-data-mono text-label-caps text-on-surface-variant">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-semibold text-on-surface">
                  {step.title}
                </h2>
                {step.badge ? <StatusBadge tone="info">{step.badge}</StatusBadge> : null}
              </div>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Frequently Asked Questions">
          <div className="space-y-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="border-b border-outline-variant pb-3 last:border-b-0 last:pb-0">
                <h2 className="font-body-md text-body-md font-semibold text-on-surface">
                  {faq.question}
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Feature Guide">
          <div className="grid gap-2">
            {featureGuides.map(([feature, description]) => (
              <div
                key={feature}
                className="flex items-start justify-between gap-3 border-b border-outline-variant py-2 last:border-b-0"
              >
                <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                  {feature}
                </span>
                <span className="max-w-sm text-right text-body-sm text-on-surface-variant">
                  {description}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Quick Actions"
        description="Jump directly into the workflow from here."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map(([label, to, icon]) => (
            <Link key={label} to={to} className="no-underline">
              <Button className="w-full justify-start" variant="secondary">
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </Button>
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="About PesoPilot">
        <p className="text-body-sm text-on-surface-variant">
          PesoPilot is a local-first financial operating system for salary-funded
          spending cycles. MVP data stays in your browser unless you export or
          import a backup from Settings.
        </p>
      </SectionCard>
    </div>
  )
}
