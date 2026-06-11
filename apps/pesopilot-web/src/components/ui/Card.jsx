export function Card({ children, className = '' }) {
  return (
    <section
      className={[
        'rounded border border-outline-variant bg-surface-container-lowest',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  )
}
