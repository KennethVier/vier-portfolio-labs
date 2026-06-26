import { useState } from 'react'

import { Button } from '@/components/ui/Button.jsx'

import {
  getPageHelperKey,
  isStorageFlagSet,
  setStorageFlag,
} from './guidanceStorage.js'

export function DismissiblePageHelper({
  action,
  icon = 'tips_and_updates',
  message,
  pageKey,
  title,
}) {
  const storageKey = getPageHelperKey(pageKey)
  const [isDismissed, setIsDismissed] = useState(() =>
    isStorageFlagSet(storageKey),
  )

  if (isDismissed) {
    return null
  }

  function dismiss() {
    setStorageFlag(storageKey)
    setIsDismissed(true)
  }

  return (
    <section className="flex flex-col gap-3 rounded border border-outline-variant bg-surface-container-lowest p-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-lg text-primary">
          {icon}
        </span>
        <div>
          <h2 className="font-heading text-sm font-semibold text-on-surface">
            {title}
          </h2>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {message}
          </p>
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="self-start px-2"
        aria-label="Dismiss helper"
        onClick={dismiss}
      >
        <span className="material-symbols-outlined text-base">close</span>
      </Button>
    </section>
  )
}
