import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { SectionCard, StatusBadge } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import { useSettings } from '../hooks/useSettings.js'
import {
  SETTINGS_OPTIONS,
  settingsService,
} from '../services/settingsService.js'

const settingsSections = ['General', 'Appearance', 'Categorization', 'Data Management']

function SettingsNavigation({ activeSection }) {
  return (
    <aside className="space-y-6 border-outline-variant bg-surface-container-lowest p-5 lg:w-64 lg:border-r">
      <div>
        <h2 className="mb-4 font-headline-sm text-headline-sm text-on-surface">
          Configuration
        </h2>

        <nav className="space-y-1" aria-label="Settings sections">
          {settingsSections.map((section) => {
            const sectionId = section.toLowerCase().replaceAll(' ', '-')
            const isActive = activeSection === sectionId

            return (
              <a
                key={section}
                href={`#${sectionId}`}
                className={[
                  'flex w-full items-center justify-between rounded px-3 py-2.5 text-left font-body-md text-body-md transition-colors',
                  isActive
                    ? 'border-r-2 border-primary bg-primary-container/10 font-semibold text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                ].join(' ')}
              >
                <span>{section}</span>
                {isActive ? (
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                ) : null}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-outline-variant pt-5">
        <div className="rounded border border-outline-variant bg-surface p-4">
          <p className="mb-2 font-label-caps text-label-caps uppercase text-on-surface-variant">
            Storage Mode
          </p>
          <div className="flex items-center gap-2 font-body-sm text-body-sm font-semibold text-secondary">
            <span className="material-symbols-outlined text-sm">database</span>
            <span>Local IndexedDB</span>
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">
            No cloud sync or backend persistence is active.
          </p>
        </div>
      </div>
    </aside>
  )
}

function FieldLabel({ children }) {
  return (
    <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
      {children}
    </span>
  )
}

function SelectField({ label, onChange, options, value }) {
  return (
    <label className="block space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <select
        className="h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 font-body-sm text-body-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SegmentedControl({ label, onChange, options, value }) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap rounded bg-surface-container p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={[
              'rounded px-4 py-1.5 font-body-sm text-body-sm transition-colors',
              option.value === value
                ? 'bg-surface-container-lowest font-semibold text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface',
            ].join(' ')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PreferenceRow({ children, description, title }) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b border-outline-variant p-4 last:border-b-0 md:flex-row md:items-center">
      <div className="max-w-xl space-y-1">
        <p className="font-body-md text-body-md font-semibold text-on-surface">
          {title}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {description}
        </p>
      </div>
      <div className="w-full md:w-72">{children}</div>
    </div>
  )
}

function GeneralSection({ isSaving, onUpdate, settings }) {
  return (
    <section id="general">
      <SectionCard
        title="General"
        description="Regional preferences for PesoPilot displays and future localized behavior."
      >
        <div className="divide-y divide-outline-variant overflow-hidden rounded border border-outline-variant">
          <PreferenceRow
            title="Currency"
            description="Controls the preferred display currency for settings-aware surfaces."
          >
            <SelectField
              label="Currency"
              options={SETTINGS_OPTIONS.currencies}
              value={settings.currency}
              onChange={(currency) => onUpdate({ currency })}
              disabled={isSaving}
            />
          </PreferenceRow>

          <PreferenceRow
            title="Language"
            description="Stored for future localization. Full i18n is not part of this MVP pass."
          >
            <SelectField
              label="Language"
              options={SETTINGS_OPTIONS.languages}
              value={settings.language}
              onChange={(language) => onUpdate({ language })}
              disabled={isSaving}
            />
          </PreferenceRow>

          <PreferenceRow
            title="Lifestyle Mode"
            description="Supports future localized financial behavior without adding payroll or tax settings here."
          >
            <SelectField
              label="Lifestyle Mode"
              options={SETTINGS_OPTIONS.lifestyleModes}
              value={settings.lifestyleMode}
              onChange={(lifestyleMode) => onUpdate({ lifestyleMode })}
              disabled={isSaving}
            />
          </PreferenceRow>
        </div>
      </SectionCard>
    </section>
  )
}

function AppearanceSection({ isSaving, onUpdate, settings }) {
  return (
    <section id="appearance">
      <SectionCard
        title="Appearance"
        description="Local display preferences for the current browser."
      >
        <div className="divide-y divide-outline-variant overflow-hidden rounded border border-outline-variant">
          <PreferenceRow
            title="Theme"
            description="Light and dark mode apply a root class. System follows your OS preference."
          >
            <SegmentedControl
              label="Theme"
              options={SETTINGS_OPTIONS.themes}
              value={settings.theme}
              onChange={(theme) => onUpdate({ theme })}
              disabled={isSaving}
            />
          </PreferenceRow>

          <PreferenceRow
            title="Density"
            description="Stored for MVP and exposed on the app root for future compact/comfortable refinements."
          >
            <SegmentedControl
              label="Density"
              options={SETTINGS_OPTIONS.densities}
              value={settings.density}
              onChange={(density) => onUpdate({ density })}
              disabled={isSaving}
            />
          </PreferenceRow>
        </div>
      </SectionCard>
    </section>
  )
}

function CategorizationSection() {
  return (
    <section id="categorization">
      <SectionCard
        title="Categorization"
        description="Local rules help PesoPilot suggest expense categories without external AI."
      >
        <div className="overflow-hidden rounded border border-outline-variant">
          <PreferenceRow
            title="Merchant Rules"
            description="Manage local merchant rules used for automatic categorization."
          >
            <Link to="/merchant-rules" className="inline-flex no-underline">
              <Button variant="secondary">
                <span className="material-symbols-outlined text-sm">rule</span>
                Open Merchant Rules
              </Button>
            </Link>
          </PreferenceRow>
        </div>
      </SectionCard>
    </section>
  )
}

function DataActionRow({ actions, description, tone = 'neutral', title }) {
  const toneClasses = {
    critical: 'bg-error-container/10',
    neutral: 'bg-surface-container-lowest',
  }

  return (
    <div
      className={[
        'flex flex-col justify-between gap-4 border-b border-outline-variant p-4 last:border-b-0 md:flex-row md:items-center',
        toneClasses[tone] ?? toneClasses.neutral,
      ].join(' ')}
    >
      <div className="space-y-1">
        <p
          className={[
            'font-body-md text-body-md font-semibold',
            tone === 'critical' ? 'text-error' : 'text-on-surface',
          ].join(' ')}
        >
          {title}
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  )
}

function DataManagementSection({
  fileInputRef,
  isSaving,
  onExport,
  onImportClick,
  onResetClick,
}) {
  return (
    <section id="data-management">
      <SectionCard
        title="Data Management"
        description="Export, import, or reset local IndexedDB data with explicit safeguards."
      >
        <div className="overflow-hidden rounded border border-outline-variant">
          <DataActionRow
            title="Export Data"
            description="Download a JSON backup containing current local PesoPilot records as-is."
            actions={
              <Button onClick={onExport} disabled={isSaving} variant="secondary">
                <span className="material-symbols-outlined text-sm">download</span>
                Export JSON
              </Button>
            }
          />

          <DataActionRow
            title="Import Data"
            description="Importing replaces existing local PesoPilot data after typing IMPORT."
            actions={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onImportClick}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  variant="secondary"
                >
                  <span className="material-symbols-outlined text-sm">
                    upload_file
                  </span>
                  Select Backup
                </Button>
              </>
            }
          />

          <DataActionRow
            title="Reset Local Data"
            description="Deletes local PesoPilot IndexedDB data and reseeds defaults after typing RESET."
            tone="critical"
            actions={
              <Button
                onClick={onResetClick}
                disabled={isSaving}
                variant="ghost"
                className="border-error/30 text-error hover:bg-error-container/20"
              >
                Reset Data
              </Button>
            }
          />
        </div>
      </SectionCard>
    </section>
  )
}

function ConfirmationModal({
  confirmationPhrase,
  description,
  isOpen,
  isSaving,
  onClose,
  onConfirm,
  title,
}) {
  const [typedPhrase, setTypedPhrase] = useState('')
  const canConfirm = typedPhrase === confirmationPhrase

  useEffect(() => {
    if (!isOpen) {
      setTypedPhrase('')
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-error hover:bg-error/90"
            onClick={onConfirm}
            disabled={!canConfirm || isSaving}
          >
            Confirm {confirmationPhrase}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded border border-error/25 bg-error-container/30 p-3 text-body-sm text-error">
          This action is destructive and cannot be undone from the app.
        </div>

        <label className="block space-y-2">
          <FieldLabel>Type {confirmationPhrase} to continue</FieldLabel>
          <input
            className="h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 font-data-mono text-body-sm text-on-surface focus:border-error focus:outline-none focus:ring-2 focus:ring-error/10"
            value={typedPhrase}
            onChange={(event) => setTypedPhrase(event.target.value)}
            autoComplete="off"
          />
        </label>
      </div>
    </Modal>
  )
}

function downloadJsonBackup(backupData, fileName) {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

async function readJsonFile(file) {
  return JSON.parse(await file.text())
}

export function SettingsPage() {
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const {
    actionState,
    error,
    exportData,
    importData,
    isLoading,
    isSaving,
    resetData,
    settings,
    updateSetting,
  } = useSettings()
  const fileInputRef = useRef(null)
  const [activeSection, setActiveSection] = useState('general')
  const [pendingImportData, setPendingImportData] = useState(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setHeaderConfig({
      searchValue: '',
      showSearch: false,
    })

    return () => resetHeaderConfig()
  }, [resetHeaderConfig, setHeaderConfig])

  useEffect(() => {
    const sections = settingsSections.map((section) =>
      document.getElementById(section.toLowerCase().replaceAll(' ', '-')),
    )

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting)
        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )

    sections.forEach((section) => {
      if (section) {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [])

  async function handleExport() {
    setLocalError('')
    const { backupData, fileName } = await exportData()
    downloadJsonBackup(backupData, fileName)
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      setLocalError('')
      const backupData = await readJsonFile(file)
      settingsService.validateBackupData(backupData)
      setPendingImportData(backupData)
      setIsImportModalOpen(true)
    } catch (importError) {
      setLocalError(importError.message || 'Unable to read backup file.')
    }
  }

  async function handleConfirmImport() {
    await importData(pendingImportData)
    setPendingImportData(null)
    setIsImportModalOpen(false)
  }

  async function handleConfirmReset() {
    await resetData()
    setIsResetModalOpen(false)
  }

  if (isLoading || !settings) {
    return <LoadingState label="Loading settings" />
  }

  return (
    <>
      <div className="overflow-hidden rounded border border-outline-variant bg-surface-container-lowest">
        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[256px_minmax(0,1fr)]">
          <SettingsNavigation activeSection={activeSection} />

          <div className="settings-content overflow-y-auto bg-surface-container p-4 md:p-6">
            <div className="mx-auto max-w-4xl space-y-5 pb-16">
              <header className="flex flex-col justify-between gap-3 rounded border border-outline-variant bg-surface-container-lowest p-4 md:flex-row md:items-center">
                <div>
                  <h1 className="font-headline-md text-headline-md text-on-surface">
                    Settings
                  </h1>
                  <p className="text-body-sm text-on-surface-variant">
                    Manage local preferences, appearance, and backup controls.
                  </p>
                </div>
                <StatusBadge tone="info">Local-first</StatusBadge>
              </header>

              {error || localError ? (
                <ErrorState
                  title="Settings action failed"
                  message={localError || error}
                />
              ) : null}

              {actionState.message ? (
                <div className="rounded border border-outline-variant bg-surface-container-lowest p-3">
                  <StatusBadge tone={actionState.tone}>
                    {actionState.message}
                  </StatusBadge>
                </div>
              ) : null}

              <GeneralSection
                isSaving={isSaving}
                onUpdate={updateSetting}
                settings={settings}
              />
              <AppearanceSection
                isSaving={isSaving}
                onUpdate={updateSetting}
                settings={settings}
              />
              <CategorizationSection />
              <DataManagementSection
                fileInputRef={fileInputRef}
                isSaving={isSaving}
                onExport={handleExport}
                onImportClick={handleImportFile}
                onResetClick={() => setIsResetModalOpen(true)}
              />

              <div className="rounded border border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                      Unavailable in MVP Settings
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      Salary configuration remains in Salary Cutoff and Income.
                      AI, tax, notifications, and cloud sync are not active here.
                    </p>
                  </div>
                  <StatusBadge tone="neutral">No backend calls</StatusBadge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        confirmationPhrase="IMPORT"
        description="Importing replaces existing local PesoPilot data."
        isOpen={isImportModalOpen}
        isSaving={isSaving}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
        title="Import PesoPilot Backup"
      />

      <ConfirmationModal
        confirmationPhrase="RESET"
        description="Resetting clears local PesoPilot data and restores defaults."
        isOpen={isResetModalOpen}
        isSaving={isSaving}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Local Data"
      />
    </>
  )
}
