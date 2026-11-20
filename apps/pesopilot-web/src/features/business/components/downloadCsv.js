export function downloadCsv(name, rows) {
  const contents = rows.map(row => row.map(value => {
    const cell = String(value)
    const safe = typeof value === 'string' && /^[\s]*[=+@-]/.test(cell) ? "'" + cell : cell
    return '"' + safe.replaceAll('"', '""') + '"'
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF', contents], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name + '.csv'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
