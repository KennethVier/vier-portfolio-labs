export function DataGrid({ columns = [], rows = [] }) {
  return (
    <div className="overflow-hidden rounded border border-outline-variant">
      <table className="w-full border-collapse bg-surface-container-lowest text-left text-sm">
        <thead className="bg-surface-container">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-outline-variant px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-content-muted"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-container-low">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="border-b border-outline-variant px-3 py-2"
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
