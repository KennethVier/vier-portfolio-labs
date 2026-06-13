import { useHeader } from '@/components/layout/HeaderContent.jsx'

export function Header() {
  const { config } = useHeader()

  const {
    searchPlaceholder,
    searchValue,
    showSearch,
    onSearchChange,
    healthScore,
    nextCutoff,
  } = config

  return (
    <header className="sticky top-0 z-40 ml-[240px] flex h-14 w-[calc(100%-240px)] items-center justify-between border-b border-outline-variant bg-surface px-6">
      <div className="flex items-center gap-6">
        {showSearch ? (
          <div className="flex w-64 items-center rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5">
            <span className="material-symbols-outlined mr-2 text-sm text-outline">
              search
            </span>
            <input
              className="w-full border-none bg-transparent p-0 text-body-sm outline-none focus:ring-0"
              placeholder={searchPlaceholder}
              type="text"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>
        ) : null}

        <div className="hidden items-center gap-4 md:flex">
          <span className="font-label-caps text-label-caps font-bold uppercase tracking-wider text-secondary">
            Health Score: {healthScore}
          </span>
          <span className="font-label-caps text-label-caps uppercase tracking-wider text-outline">
            Next Cutoff: {nextCutoff}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-error" />
        </button>

        <button className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-highest text-[10px] font-bold text-on-surface-variant">
          PP
        </div>
      </div>
    </header>
  )
}