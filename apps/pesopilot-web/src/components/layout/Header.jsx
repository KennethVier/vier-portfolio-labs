import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useHeader } from '@/components/layout/headerContext.js'
import { Button } from '@/components/ui/Button.jsx'
import { notificationCenterService } from '@/features/notifications/services/notificationCenterService.js'

export function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const { config } = useHeader()
  const notificationRef = useRef(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationState, setNotificationState] = useState({
    activeCount: 0,
    badgeLabel: '',
    notifications: [],
  })

  const {
    searchPlaceholder,
    searchValue,
    showSearch,
    onSearchChange,
    healthScore,
    nextCutoff,
    statusSize,
  } = config
  const statusClassName =
    statusSize === 'lg'
      ? 'text-xs leading-4 tracking-[0.08em]'
      : 'text-label-caps'

  async function loadReminders() {
    try {
      const nextNotifications = await notificationCenterService.loadNotifications()
      setNotificationState(nextNotifications)
    } catch {
      setNotificationState({
        activeCount: 0,
        badgeLabel: '',
        notifications: [],
      })
    }
  }

  useEffect(() => {
    loadReminders()
  }, [])

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined
    }

    loadReminders()

    function handlePointerDown(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNotificationOpen])

  function openReminder(reminder) {
    setIsNotificationOpen(false)
    navigate(reminder.to)
  }

  async function dismissReminder(reminder) {
    notificationCenterService.dismissNotification(reminder)
    await loadReminders()
  }

  return (
    <header className="sticky top-0 z-40 flex min-h-14 w-full items-center justify-between gap-3 border-b border-outline-variant bg-surface px-4 py-2 lg:ml-[240px] lg:h-14 lg:w-[calc(100%-240px)] lg:px-6 lg:py-0">
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <button
          type="button"
          className="rounded border border-outline-variant bg-surface-container-lowest p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {showSearch ? (
          <div className="flex min-w-0 flex-1 items-center rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 sm:max-w-64">
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
          <span
            className={[
              'font-label-caps font-bold uppercase tracking-wider text-secondary',
              statusClassName,
            ].join(' ')}
          >
            Health Score: {healthScore}
          </span>
          <span
            className={[
              'font-label-caps uppercase tracking-wider text-outline',
              statusClassName,
            ].join(' ')}
          >
            Next Cutoff: {nextCutoff}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <div className="relative" ref={notificationRef}>
        <button
          type="button"
          className="relative rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container"
          aria-expanded={isNotificationOpen}
          aria-haspopup="dialog"
          aria-label="Open notifications"
          onClick={() => setIsNotificationOpen((isOpen) => !isOpen)}
        >
          <span className="material-symbols-outlined">notifications</span>
          {notificationState.activeCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold leading-none text-white">
              {notificationState.badgeLabel}
            </span>
          ) : null}
        </button>

        {isNotificationOpen ? (
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-11 z-50 w-[min(calc(100vw-2rem),360px)] rounded border border-outline-variant bg-surface-container-lowest shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
          >
            <div className="border-b border-outline-variant px-4 py-3">
              <p className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Notifications
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {notificationState.notifications.length === 0 ? (
                <div className="flex items-start gap-3 rounded bg-surface-container-low p-3">
                  <span className="material-symbols-outlined text-secondary">
                    check_circle
                  </span>
                  <div>
                    <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                      You&apos;re all caught up.
                    </p>
                    <p className="mt-1 text-body-sm text-on-surface-variant">
                      PesoPilot has no current workflow reminders.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationState.notifications.map((reminder) => (
                    <article
                      key={reminder.id}
                      className="rounded border border-outline-variant bg-surface p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-body-sm text-body-sm font-semibold text-on-surface">
                            {reminder.title}
                          </h2>
                          <p className="mt-1 text-body-sm text-on-surface-variant">
                            {reminder.message}
                          </p>
                        </div>
                        {reminder.dismissible ? (
                          <button
                            type="button"
                            className="rounded p-1 text-on-surface-variant hover:bg-surface-container"
                            aria-label={`Dismiss ${reminder.title}`}
                            onClick={() => dismissReminder(reminder)}
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        className="mt-3 w-full"
                        variant="secondary"
                        onClick={() => openReminder(reminder)}
                      >
                        {reminder.actionLabel}
                      </Button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
        </div>

        <button
          type="button"
          className="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container"
          aria-label="Open help"
          onClick={() => navigate('/help')}
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-highest text-[10px] font-bold text-on-surface-variant">
          PP
        </div>
      </div>
    </header>
  )
}
