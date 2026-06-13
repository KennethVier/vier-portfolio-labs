import { Button } from '@/components/ui/Button.jsx'
import { Card } from '@/components/ui/Card.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { EMPTY_INCOME_FILTERS, INCOME_SOURCES } from '../constants/incomeConstants.js'

export function IncomeFilters({ filters, framed = true, onChange, salaryCutoffs }) {
  function updateFilter(key, value) {
    onChange({
      ...filters,
      [key]: value,
    })
  }

  const content = (
    <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(4,_1fr)_auto]">
        <Input
          id="income-search"
          label="Search"
          placeholder="Search source or note..."
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
        />
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-content">
            Cutoff
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
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
          <span className="mb-1 block text-xs font-semibold text-content">
            Source
          </span>
          <select
            className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
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
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => onChange(EMPTY_INCOME_FILTERS)}
          >
            Clear
          </Button>
        </div>
    </div>
  )

  if (!framed) {
    return content
  }

  return (
    <Card className="p-4">
      {content}
    </Card>
  )
}
