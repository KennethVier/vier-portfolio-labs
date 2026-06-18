import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'

import { PAYMENT_METHODS } from '../constants/expenseConstants.js'

const DATE_RANGE_OPTIONS = [
  { days: 7, label: 'Last 7 Days' },
  { days: 14, label: 'Last 14 Days' },
  { days: 21, label: 'Last 21 Days' },
  { days: 30, label: 'Last 30 Days' },
  { days: 60, label: 'Last 60 Days' },
  { days: 90, label: 'Last 90 Days' },
]

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateRange(days) {
  const endDate = new Date()
  const startDate = new Date(endDate)

  startDate.setDate(endDate.getDate() - days + 1)

  return {
    endDate: formatLocalDate(endDate),
    startDate: formatLocalDate(startDate),
  }
}

function getSelectedDateRange(filters) {
  return DATE_RANGE_OPTIONS.find((option) => {
    const range = getDateRange(option.days)

    return (
      filters.startDate === range.startDate &&
      filters.endDate === range.endDate
    )
  })?.days ?? ''
}

export function ExpenseFilters({
  categories,
  compact = false,
  filters,
  framed = true,
  onChange,
  showSearch = true,
}) {
  function updateFilter(name, value) {
    onChange({
      ...filters,
      [name]: value,
    })
  }

  function updateDateRange(value) {
    if (!value) {
      onChange({
        ...filters,
        endDate: '',
        startDate: '',
      })
      return
    }

    onChange({
      ...filters,
      ...getDateRange(Number(value)),
    })
  }

  if (compact) {
    return (
      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <label className="flex w-full items-center gap-2 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 sm:w-auto sm:shrink-0">
          <span className="material-symbols-outlined text-body-sm text-on-surface-variant">calendar_today</span>
          <span className="sr-only">Date range</span>
          <select
            className="w-full border-0 bg-transparent p-0 text-sm font-medium text-content outline-none focus:ring-0 sm:w-32"
            value={getSelectedDateRange(filters)}
            onChange={(event) => updateDateRange(event.target.value)}
          >
            <option value="">All Dates</option>
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option.days} value={option.days}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-full items-center gap-2 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 sm:w-auto sm:shrink-0">
          <span className="material-symbols-outlined text-body-sm text-on-surface-variant">category</span>
          <span className="sr-only">Category</span>
          <select
            className="w-full border-0 bg-transparent p-0 text-sm font-medium text-content outline-none focus:ring-0 sm:w-40"
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

        <label className="flex w-full items-center gap-2 border border-outline-variant bg-surface-container-lowest px-3 py-1.5 sm:w-auto sm:shrink-0">
          <span className="material-symbols-outlined text-body-sm text-on-surface-variant">credit_card</span>
          <span className="sr-only">Payment method</span>
          <select
            className="w-full border-0 bg-transparent p-0 text-sm font-medium text-content outline-none focus:ring-0 sm:w-40"
            value={filters.paymentMethod}
            onChange={(event) => updateFilter('paymentMethod', event.target.value)}
          >
            <option value="">Payment Method</option>
            {PAYMENT_METHODS.map((paymentMethod) => (
              <option key={paymentMethod} value={paymentMethod}>
                {paymentMethod}
              </option>
            ))}
          </select>
        </label>
      </div>
    )
  }

  return (
    <div
      className={[
        'space-y-3',
        framed
          ? 'rounded border border-outline-variant bg-surface-container-lowest p-4'
          : '',
      ].join(' ')}
    >
      {showSearch ? (
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
      ) : null}

      <div
        className={[
          'grid gap-3',
          compact
            ? 'md:grid-cols-[minmax(140px,_0.85fr)_minmax(150px,_0.85fr)_minmax(130px,_0.65fr)_minmax(130px,_0.65fr)]'
            : 'md:grid-cols-4',
        ].join(' ')}
      >
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">Category</span>
        <select
          className="min-h-10 w-48 rounded border border-outline-variant bg-surface-container-lowest text-sm"
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
          className="min-h-10 w-48 rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
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
          className="min-h-10 w-48 rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
          type="date"
          value={filters.startDate}
          onChange={(event) => updateFilter('startDate', event.target.value)}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-content">To</span>
        <input
          className="min-h-10 w-48 rounded border border-outline-variant bg-surface-container-lowest px-3 text-sm"
          type="date"
          value={filters.endDate}
          onChange={(event) => updateFilter('endDate', event.target.value)}
        />
      </label>
      </div>
    </div>
  )
}
