import type Dexie from 'dexie'

export function syncFailure(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? '')
  if (/422|sealed schema|extend.*schema/i.test(text))
    return 'Dexie Cloud rejected the sealed schema (HTTP 422). Run the development schema update, then retry.'
  return 'Dexie Cloud synchronization failed. Check the connection and retry.'
}

export function initialPull(database: Dexie, timeoutMs = 30000) {
  return new Promise<void>((resolve, reject) => {
    let settled = false
    let stateSub: { unsubscribe(): void } | undefined
    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      stateSub?.unsubscribe()
      error ? reject(error) : resolve()
    }
    const timer = setTimeout(
      () =>
        finish(
          new Error(
            'Synchronization has not completed after 30 seconds. Check the connection and retry.',
          ),
        ),
      timeoutMs,
    )
    // Sync's promise may remain pending while the addon retries a failed HTTP request.
    let initialState = true
    stateSub = database.cloud.syncState.subscribe((state) => {
      if (initialState) {
        initialState = false
        return
      }
      if (state.phase === 'error' || state.status === 'error' || state.error)
        finish(new Error(syncFailure(state.error)))
    })
    if (settled) {
      stateSub.unsubscribe()
      return
    }
    database.cloud.sync({ purpose: 'pull', wait: true }).then(
      () => finish(),
      (error) => finish(new Error(syncFailure(error))),
    )
  })
}
