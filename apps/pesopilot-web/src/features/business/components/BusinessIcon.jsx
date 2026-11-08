const paths = {
  pos: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  inventory: 'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
  audit: 'M5 3h14v18H5z M8 7h8 M8 12h3 M8 16h3 M14 12h2 M14 16h2',
  history: 'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2',
  settings: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  shawl: 'M6 3h12l3 17-9-4-9 4z M9 4l3 12 3-12',
  bottle: 'M9 3h6v4H9z M8 7h8l2 4v10H6V11z M9 13h6 M9 17h4',
  pillow: 'M4 4l3 1h10l3-1-1 4v8l1 4-3-1H7l-3 1 1-4V8z',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
}

export function BusinessIcon({ name = 'pos', className = 'h-5 w-5' }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}><path d={paths[name] ?? paths.pos} /></svg>
}
