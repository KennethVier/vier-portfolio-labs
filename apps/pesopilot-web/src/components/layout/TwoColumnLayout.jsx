export function TwoColumnLayout({
  children,
  sidebar,
  className = '',
  sidebarClassName = '',
  contentClassName = '',
}) {
  return (
    <div
      className={[
        'grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start',
        className,
      ].join(' ')}
    >
      <div
        className={[
          'lg:col-span-2',
          contentClassName,
        ].join(' ')}
      >
        {children}
      </div>

      <aside className={sidebarClassName}>
        {sidebar}
      </aside>
    </div>
  )
}