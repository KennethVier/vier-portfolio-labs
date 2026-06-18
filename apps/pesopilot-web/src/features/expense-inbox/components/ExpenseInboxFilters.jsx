import { useState } from 'react'

import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { Popover } from '@/components/ui/Popover.jsx'

import {
  EMPTY_INBOX_FILTERS,
  INBOX_STATUS_OPTIONS,
} from '../constants/expenseInboxConstants.js'

export function ExpenseInboxFilters({ categories, filters, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  function updateFilter(key, value) {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  const activeFilterCount = [
    filters.status,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <Input
          id="expense-inbox-search"
          label="Search"
          placeholder="Search merchant, source, notes..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Popover
          isOpen={isOpen}
          className="right-auto left-0 w-[min(92vw,520px)] p-4 md:left-auto md:right-0"
          anchor={(
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen((current) => !current)}
            >
              <span className="material-symbols-outlined text-base">filter_list</span>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          )}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
                Status
              </span>
              <select
                className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={filters.status}
                onChange={(event) => updateFilter('status', event.target.value)}
              >
                <option value="">All statuses</option>
                {INBOX_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
                Category
              </span>
              <select
                className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={filters.categoryId}
                onChange={(event) => updateFilter('categoryId', event.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <Input
              id="expense-inbox-start-date"
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilter('startDate', event.target.value)}
            />

            <Input
              id="expense-inbox-end-date"
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilter('endDate', event.target.value)}
            />
          </div>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange(EMPTY_INBOX_FILTERS)}
        >
          Clear
        </Button>
      </div>
    </div>
  )
}
