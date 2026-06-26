import { Button } from '@/components/ui/Button.jsx'

import { PAGE_SIZE_OPTIONS } from './paginationUtils.js'

export function PaginationControls({
  page,
  pageCount,
  pageSize,
  rangeLabel,
  total,
  onPageChange,
  onPageSizeChange,
}) {
  if (total === 0) {
    return (
      <div className="border-t border-outline-variant px-3 py-2 text-body-sm text-on-surface-variant">
        Showing 0 of 0 records
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant px-3 py-2 text-body-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
      <span>{rangeLabel}</span>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span>Rows</span>
          <select
            className="min-h-8 rounded border border-outline-variant bg-surface-container-lowest px-2 text-sm text-on-surface"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="font-data-mono text-xs text-on-surface">
          Page {pageCount === 0 ? 0 : page} of {pageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
