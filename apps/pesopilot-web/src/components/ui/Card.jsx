export function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded border border-outline-variant bg-surface-container-lowest shadow-sm shadow-slate-900/[0.02]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}
