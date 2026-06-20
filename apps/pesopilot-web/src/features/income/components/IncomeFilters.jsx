import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { EMPTY_INCOME_FILTERS, INCOME_SOURCES } from '../constants/incomeConstants.js'

export function IncomeFilters({
  compact = false,
  filters,
  framed = true,
  onChange,
  salaryCutoffs,
  showSearch = true,
}) {
  function updateFilter(key, value) {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  const content = (
    <div className={['grid gap-2', compact ? '' : 'md:grid-cols-2'].join(' ')}>
      {showSearch ? (
        <div className={compact ? '' : 'md:col-span-2'}>
          <Input
            id="income-search"
            label="Search"
            placeholder="Search source or note..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
          Cutoff
        </span>
        <select
          className="min-h-8 w-full rounded border border-outline-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={filters.cutoffId}
          onChange={(event) => updateFilter('cutoffId', event.target.value)}
        >
          <option value="">All cutoffs</option>
          {salaryCutoffs.map((cutoff) => (
            <option key={cutoff.id} value={cutoff.id}>
              {cutoff.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block font-label-caps text-label-caps uppercase text-on-surface-variant">
          Source
        </span>
        <select
          className="min-h-8 w-full rounded border border-outline-variant bg-surface-container-lowest px-2 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={filters.source}
          onChange={(event) => updateFilter('source', event.target.value)}
        >
          <option value="">All sources</option>
          {INCOME_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </label>

      <Input
        id="income-start-date"
        label="Start date"
        type="date"
        value={filters.startDate}
        onChange={(event) => updateFilter('startDate', event.target.value)}
      />

      <Input
        id="income-end-date"
        label="End date"
        type="date"
        value={filters.endDate}
        onChange={(event) => updateFilter('endDate', event.target.value)}
      />

      <div className={['flex justify-end', compact ? '' : 'md:col-span-2'].join(' ')}>
        <Button
          type="button"
          variant="secondary"
          className="min-h-8 px-2 py-1"
          onClick={() => onChange(EMPTY_INCOME_FILTERS)}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  )

  if (!framed) {
    return content
  }

  return <Card className="p-4">{content}</Card>
}
