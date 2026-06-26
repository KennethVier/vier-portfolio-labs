export function Tooltip({ children, text }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden max-w-56 -translate-x-1/2 whitespace-nowrap rounded border border-outline-variant bg-on-surface px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  )
}
