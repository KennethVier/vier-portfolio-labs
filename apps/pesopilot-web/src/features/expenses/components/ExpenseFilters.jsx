import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { PAYMENT_METHODS } from '../constants/expenseConstants.js'

export function ExpenseFilters({ categories, filters, onChange }) {
  function updateFilter(name, value) {
    onChange({
      ...filters,
      [name]: value,
    })
  }

  return (
    <div className="space-y-3 rounded border border-outline-variant bg-surface-container-lowest p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end">
        <div className="flex-1">
          <Input
            id="expense-search"
            label="Search"
            placeholder="Search merchant, note, payment method..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>
        {filters.search ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => updateFilter('search', '')}
          >
            Clear
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">Category</span>
        <select
          className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
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

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">
          Payment method
        </span>
        <select
          className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
          value={filters.paymentMethod}
          onChange={(event) => updateFilter('paymentMethod', event.target.value)}
        >
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((paymentMethod) => (
            <option key={paymentMethod} value={paymentMethod}>
              {paymentMethod}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">From</span>
        <input
          className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter('startDate', event.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">To</span>
        <input
          className="min-h-10 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter('endDate', event.target.value)}
        />
      </label>
      </div>
    </div>
  )
}
