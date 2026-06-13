const columnStyles = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-4',
  5: 'md:grid-cols-2 xl:grid-cols-5',
}

export function KpiGrid({ children, className = '', columns = 4 }) {
  return (
    <div
      className={[
        'grid gap-gutter mb-8',
        columnStyles[columns] ?? columnStyles[4],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
