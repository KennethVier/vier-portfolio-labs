import { useEffect, useMemo, useState } from 'react'

import { PageHeader, SectionCard, StatusBadge } from '@/components/dashboard'
import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { EmptyState } from '@/components/ui/EmptyState.jsx'
import { ErrorState } from '@/components/ui/ErrorState.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { LoadingState } from '@/components/ui/LoadingState.jsx'
import { Modal } from '@/components/ui/Modal.jsx'

import {
  MERCHANT_MATCH_TYPES,
  MERCHANT_RULE_SOURCES,
} from '../services/merchantRuleMatcher.js'
import {
  useMerchantRules,
} from '../hooks/useMerchantRules.js'

const emptyForm = {
  categoryId: '',
  keyword: '',
  matchType: MERCHANT_MATCH_TYPES.contains,
}

function getSourceTone(source) {
  return source === MERCHANT_RULE_SOURCES.user ? 'info' : 'neutral'
}

function RuleForm({ categories, error, initialRule, isSaving, onCancel, onSave }) {
  const [formValues, setFormValues] = useState(() => ({
    ...emptyForm,
    ...initialRule,
  }))

  useEffect(() => {
    setFormValues({
      ...emptyForm,
      ...initialRule,
    })
  }, [initialRule])

  function updateValue(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  async function submitForm(event) {
    event.preventDefault()
    await onSave(formValues)
  }

  return (
    <form className="space-y-4" onSubmit={submitForm}>
      {error ? (
        <div className="rounded border border-error/25 bg-error-container/40 p-3 text-body-sm text-error">
          {error}
        </div>
      ) : null}

      <Input
        id="merchant-rule-keyword"
        label="Merchant Keyword"
        value={formValues.keyword}
        onChange={(event) => updateValue('keyword', event.target.value)}
      />

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">
          Category
        </span>
        <select
          className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          value={formValues.categoryId}
          onChange={(event) => updateValue('categoryId', event.target.value)}
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">
          Match Type
        </span>
        <select
          className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          value={formValues.matchType}
          onChange={(event) => updateValue('matchType', event.target.value)}
        >
          <option value={MERCHANT_MATCH_TYPES.contains}>Contains</option>
          <option value={MERCHANT_MATCH_TYPES.exact}>Exact</option>
        </select>
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          Save Rule
        </Button>
      </div>
    </form>
  )
}

function RuleTable({ onDelete, onEdit, rules }) {
  if (rules.length === 0) {
    return (
      <EmptyState
        title="No merchant rules found"
        message="Try changing the filters or add a new local merchant rule."
      />
    )
  }

  return (
    <div className="overflow-x-auto border border-outline-variant">
      <table className="min-w-full border-collapse bg-surface-container-lowest text-body-sm">
        <thead className="bg-surface-container text-left font-label-caps text-label-caps uppercase text-on-surface-variant">
          <tr>
            <th className="border-b border-outline-variant px-3 py-2">Merchant</th>
            <th className="border-b border-outline-variant px-3 py-2">Category</th>
            <th className="border-b border-outline-variant px-3 py-2">Match</th>
            <th className="border-b border-outline-variant px-3 py-2">Source</th>
            <th className="border-b border-outline-variant px-3 py-2 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const isDefault = rule.source === MERCHANT_RULE_SOURCES.default

            return (
              <tr key={rule.id} className="border-b border-outline-variant last:border-b-0">
                <td className="px-3 py-2 font-medium text-on-surface">
                  {rule.keyword}
                </td>
                <td className="px-3 py-2 text-on-surface">{rule.categoryName}</td>
                <td className="px-3 py-2 text-on-surface-variant">
                  {rule.matchType}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge tone={getSourceTone(rule.source)}>
                    {rule.source}
                  </StatusBadge>
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      disabled={isDefault}
                      onClick={() => onEdit(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isDefault}
                      onClick={() => onDelete(rule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MerchantRulesPage() {
  const { resetHeaderConfig, setHeaderConfig } = useHeader()
  const [editingRule, setEditingRule] = useState(null)
  const [formError, setFormError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {
    categories,
    createRule,
    deleteRule,
    error,
    filters,
    isLoading,
    isSaving,
    resetFilters,
    rules,
    updateFilters,
    updateRule,
  } = useMerchantRules()

  const sourceOptions = useMemo(
    () => [
      { label: 'All sources', value: '' },
      { label: 'Default', value: MERCHANT_RULE_SOURCES.default },
      { label: 'User', value: MERCHANT_RULE_SOURCES.user },
    ],
    [],
  )

  useEffect(() => {
    setHeaderConfig({
      searchPlaceholder: 'Search merchant rules...',
      searchValue: filters.search,
      showSearch: true,
      onSearchChange: (value) => updateFilters({ search: value }),
    })

    return () => resetHeaderConfig()
  }, [filters.search, resetHeaderConfig, setHeaderConfig, updateFilters])

  function openCreateModal() {
    setEditingRule(null)
    setFormError('')
    setIsModalOpen(true)
  }

  function openEditModal(rule) {
    setEditingRule(rule)
    setFormError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingRule(null)
    setFormError('')
  }

  async function saveRule(values) {
    try {
      setFormError('')

      if (editingRule) {
        await updateRule(editingRule.id, values)
      } else {
        await createRule(values)
      }

      closeModal()
    } catch (saveError) {
      setFormError(saveError.message || 'Unable to save merchant rule.')
    }
  }

  if (isLoading) {
    return <LoadingState label="Loading merchant rules" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Local Rules"
        title="Merchant Rules"
        description="Merchant rules are learned automatically when you correct categories in Expense Inbox. You can manage them here if needed."
        actions={<Button onClick={openCreateModal}>Add Rule</Button>}
      />

      {error ? (
        <ErrorState title="Unable to process merchant rules" message={error} />
      ) : null}

      <SectionCard
        title="Rule Library"
        description="Default Philippine rules are protected. User rules can override defaults."
        actions={
          <Button variant="ghost" onClick={resetFilters}>
            Clear Filters
          </Button>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Category
            </span>
            <select
              className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={filters.categoryId}
              onChange={(event) => updateFilters({ categoryId: event.target.value })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-content">
              Source
            </span>
            <select
              className="min-h-9 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm leading-5 text-content outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={filters.source}
              onChange={(event) => updateFilters({ source: event.target.value })}
            >
              {sourceOptions.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <RuleTable rules={rules} onDelete={deleteRule} onEdit={openEditModal} />
      </SectionCard>

      <Modal
        isOpen={isModalOpen}
        title={editingRule ? 'Edit Merchant Rule' : 'Create Merchant Rule'}
        description="User rules override default local merchant mappings."
        onClose={closeModal}
      >
        <RuleForm
          categories={categories}
          error={formError}
          initialRule={editingRule}
          isSaving={isSaving}
          onCancel={closeModal}
          onSave={saveRule}
        />
      </Modal>
    </div>
  )
}
