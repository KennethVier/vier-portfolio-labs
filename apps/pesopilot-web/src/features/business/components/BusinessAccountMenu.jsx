import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button.jsx'

export function BusinessAccountMenu({ profile, logout }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const trigger = useRef(null)
  const panelId = useId()
  useEffect(() => {
    if (!open) return
    function outside(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
    }
  }, [open])
  return (
    <div
      ref={root}
      className="business-account relative justify-self-end"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="business-account-trigger inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-5 w-5"
        >
          <circle cx="12" cy="8" r="3" />
          <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
        </svg>
        <span className="hidden sm:inline">Account</span>
        <span className="sr-only sm:hidden">Account</span>
        <span aria-hidden="true" className="text-xs">
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && (
        <section
          id={panelId}
          aria-label="Signed-in account"
          className="business-account-panel absolute right-0 top-full z-40 mt-2 w-60 max-w-[calc(100vw-2rem)] space-y-2 rounded-lg border p-3 shadow-lg"
        >
          <div className="min-w-0 space-y-1">
            <p className="break-all text-xs font-semibold">
              {profile.email || profile.id}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs capitalize opacity-80">{profile.role}</p>
            <Button
              variant="secondary"
              className="business-signout min-h-11 px-3"
              onClick={() => {
                setOpen(false)
                logout()
              }}
            >
              Sign out
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
