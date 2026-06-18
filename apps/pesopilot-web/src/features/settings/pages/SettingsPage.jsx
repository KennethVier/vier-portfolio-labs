import { useEffect } from 'react'

import { StatusBadge } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

const settingsSections = ['General', 'Appearance', 'Salary & Tax', 'Data Management']

function StaticSelect({ label, options, value }) {
  return (
    <label className="block space-y-2">
      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
        {label}
      </span>
      <select
        className="h-10 w-full rounded border border-outline-variant bg-surface-bright px-3 font-body-md text-body-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-80"
        disabled
        value={value}
        onChange={() => {}}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function StaticToggle({ checked = false }) {
  return (
    <span
      className={[
        'relative inline-flex h-6 w-11 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-outline-variant',
      ].join(' ')}
      aria-hidden="true"
    >
      <span
        className={[
          'absolute top-0.5 h-5 w-5 rounded-full border border-outline-variant bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        ].join(' ')}
      />
    </span>
  )
}

function StaticSegmentedControl({ options, selected }) {
  return (
    <div className="flex rounded bg-surface-container p-1">
      {options.map((option) => (
        <span
          key={option}
          className={[
            'rounded px-4 py-1.5 font-body-sm text-body-sm',
            option === selected
              ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
              : 'text-on-surface-variant',
          ].join(' ')}
        >
          {option}
        </span>
      ))}
    </div>
  )
}

function SettingsNavigation() {
  return (
    <aside className="space-y-6 border-outline-variant bg-surface-container-lowest p-6 lg:w-64 lg:border-r">
      <div>
        <h2 className="mb-4 font-headline-sm text-headline-sm text-on-surface">
          Configuration
        </h2>

        <nav className="space-y-1" aria-label="Settings sections">
          {settingsSections.map((section, index) => (
            <button
              key={section}
              type="button"
              disabled
              className={[
                'flex w-full items-center justify-between rounded px-3 py-2.5 text-left font-body-md text-body-md transition-colors',
                index === 0
                  ? 'border-r-2 border-primary bg-primary-container/10 font-semibold text-primary'
                  : 'text-on-surface-variant',
              ].join(' ')}
            >
              <span>{section}</span>
              {index === 0 ? (
                <span className="material-symbols-outlined text-sm">
                  chevron_right
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-outline-variant pt-6">
        <div className="rounded-xl bg-surface-container-low p-4">
          <p className="mb-2 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Cloud Status
          </p>
          <div className="flex items-center gap-2 font-body-sm text-body-sm font-semibold text-secondary">
            <span className="material-symbols-outlined text-sm">cloud_done</span>
            <span>Fully Synced</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SectionIntro({ description, title }) {
  return (
    <header>
      <h3 className="font-headline-md text-headline-md text-on-surface">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {description}
      </p>
    </header>
  )
}

function SettingsPanel({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded border border-outline-variant bg-surface-container-lowest shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function GeneralSection() {
  return (
    <section className="space-y-6" id="general">
      <SectionIntro
        title="General"
        description="Regional and localization parameters for financial processing."
      />

      <SettingsPanel className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <StaticSelect
            label="Display Language"
            value="English (US)"
            options={['English (US)', 'Tagalog (PH)', 'Spanish (ES)']}
          />
          <StaticSelect
            label="Base Currency"
            value="PHP (Peso) - Philippine Peso"
            options={[
              'PHP (Peso) - Philippine Peso',
              'USD ($) - US Dollar',
              'EUR (Euro) - Euro',
            ]}
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary-container/20 text-secondary">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div>
              <p className="font-body-md text-body-md font-semibold">
                Local Lifestyle Mode (PH-Specific)
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Auto-calculate SSS, PhilHealth, and Pag-IBIG contributions.
              </p>
            </div>
          </div>
          <StaticToggle checked />
        </div>
      </SettingsPanel>
    </section>
  )
}

function AppearanceSection() {
  return (
    <section className="space-y-6" id="appearance">
      <SectionIntro
        title="Appearance"
        description="Customize the visual density and theme of your dashboard."
      />

      <SettingsPanel className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-outline-variant p-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="font-body-md text-body-md font-semibold">Color Mode</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Switch between Light and Dark interface variants.
            </p>
          </div>
          <StaticSegmentedControl
            options={['Light', 'Dark', 'System']}
            selected="Light"
          />
        </div>

        <div className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <p className="font-body-md text-body-md font-semibold">UI Density</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Control the spacing and information density.
            </p>
          </div>
          <StaticSegmentedControl
            options={['Comfortable', 'Compact']}
            selected="Compact"
          />
        </div>
      </SettingsPanel>
    </section>
  )
}

function SalaryTaxSection() {
  return (
    <section className="space-y-6" id="salary">
      <SectionIntro
        title="Salary & Tax"
        description="Core parameters for income forecasting and budget generation."
      />

      <SettingsPanel className="space-y-8 p-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Input
            disabled
            id="settings-monthly-gross-salary"
            label="Monthly Gross Salary"
            readOnly
            value="PHP 125,000.00"
          />
          <StaticSelect
            label="Pay Schedule"
            value="Bi-monthly (15th & 30th)"
            options={[
              'Bi-monthly (15th & 30th)',
              'Monthly (End of month)',
              'Weekly (Friday)',
            ]}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-body-md text-body-md font-semibold">Buffer Days</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Days to delay recurring expenses after payday.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant"
              >
                -
              </button>
              <span className="w-4 text-center font-data-mono">3</span>
              <button
                type="button"
                disabled
                className="flex h-8 w-8 items-center justify-center rounded border border-outline-variant text-on-surface-variant"
              >
                +
              </button>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full w-[30%] bg-primary" />
          </div>
        </div>
      </SettingsPanel>
    </section>
  )
}

function DataManagementSection() {
  return (
    <section className="space-y-6" id="data">
      <SectionIntro
        title="Data Management"
        description="Export or reset your entire financial history."
      />

      <SettingsPanel className="divide-y divide-outline-variant overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div>
            <p className="font-body-md text-body-md font-semibold">Export Ledger</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Download all transactions as a CSV or JSON file.
            </p>
          </div>
          <div className="flex gap-3">
            <Button disabled variant="secondary">
              <span className="material-symbols-outlined text-sm">download</span>
              CSV
            </Button>
            <Button disabled variant="secondary">
              <span className="material-symbols-outlined text-sm">download</span>
              JSON
            </Button>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 p-6 md:flex-row md:items-center">
          <div>
            <p className="font-body-md text-body-md font-semibold">Import History</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Merge data from external banking CSVs.
            </p>
          </div>
          <Button disabled variant="secondary">
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Select File
          </Button>
        </div>

        <div className="flex flex-col justify-between gap-4 bg-error-container/5 p-6 md:flex-row md:items-center">
          <div>
            <p className="font-body-md text-body-md font-semibold text-error">
              Factory Reset
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Permanently delete all accounts, transactions, and settings.
            </p>
          </div>
          <Button disabled variant="ghost" className="text-error">
            Reset All Data
          </Button>
        </div>
      </SettingsPanel>
    </section>
  )
}

export function SettingsPage() {
  const { resetHeaderConfig, setHeaderConfig } = useHeader()

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
      <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[256px_minmax(0,1fr)]">
        <SettingsNavigation />

        <div className="settings-content overflow-y-auto bg-slate-50 p-5 md:p-10">
          <div className="mx-auto max-w-3xl space-y-12 pb-20">
            <GeneralSection />
            <AppearanceSection />
            <SalaryTaxSection />
            <DataManagementSection />

            <div className="flex justify-end gap-4 pt-4">
              <Button disabled variant="ghost">
                Discard Changes
              </Button>
              <Button disabled>
                Save Changes
              </Button>
            </div>

            <div className="flex justify-end">
              <StatusBadge tone="neutral">Static preview only</StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
