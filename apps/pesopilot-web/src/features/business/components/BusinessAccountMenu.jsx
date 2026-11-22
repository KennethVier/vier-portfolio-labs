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
        Account <span aria-hidden="true">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <section
          id={panelId}
          aria-label="Signed-in account"
          className="business-account-panel absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border p-4 shadow-lg"
        >
          <div className="min-w-0 space-y-1">
            <p className="break-all text-sm font-semibold">{profile.email || profile.id}</p>
            <p className="text-sm capitalize">{profile.role}</p>
          </div>
          <Button
            variant="secondary"
            className="business-signout min-h-11 w-full"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            Sign out
          </Button>
        </section>
      )}
    </div>
  )
}
