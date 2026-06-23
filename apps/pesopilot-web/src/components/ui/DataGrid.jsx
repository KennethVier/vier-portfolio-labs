export function DataGrid({
  className = '',
  columns = [],
  getRowClassName,
  onRowClick,
  rows = [],
}) {
  return (
    <div
      className={[
        'overflow-hidden rounded border border-outline-variant bg-surface-container-lowest',
        className,
      ].join(' ')}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-surface-container">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase leading-4 tracking-[0.05em] text-content-muted"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={[
                'hover:bg-surface-container-low',
                onRowClick ? 'cursor-pointer' : '',
                getRowClassName ? getRowClassName(row) : '',
              ].join(' ')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="border-b border-outline-variant px-3 py-2 align-middle leading-5"
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
