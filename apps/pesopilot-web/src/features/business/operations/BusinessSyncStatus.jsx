import { Button } from '@/components/ui/Button.jsx'
export function BusinessSyncStatus({
  phase,
  online,
  busy,
  retry,
  problem,
  notice,
  recordsStatus = problem ? 'error' : 'ready',
}) {
  const offline = !online || phase === 'offline'
  const failed = recordsStatus === 'error'
  const loading = recordsStatus === 'loading'
  const message = failed
    ? problem ||
      'Business records could not be loaded. Try again or ask the owner for help.'
    : loading
      ? 'Loading business records…'
      : problem
        ? problem
        : offline
          ? 'Offline. You can keep recording stock and sales here. Changes will be shared when you reconnect.'
          : {
              initial: 'Checking for updates…',
              'not-in-sync': 'Saved on this device. Sharing changes…',
              pushing: 'Sharing changes…',
              pulling: 'Getting the latest updates…',
              error:
                'Some updates could not be shared. Check your connection and try again.',
            }[phase]
  return (
    <div className="space-y-2 text-sm">
      {message && (
        <p
          role={
            failed ||
            Boolean(problem) ||
            (phase === 'error' && !offline && !loading)
              ? 'alert'
              : 'status'
          }
        >
          {message}
        </p>
      )}
      {notice && !failed && !loading && !problem && (
        <p role="status">{notice}</p>
      )}
      {(phase === 'error' || problem) && (
        <Button
          variant="secondary"
          disabled={busy || offline || loading}
          onClick={retry}
        >
          Try again
        </Button>
      )}
      <details>
        <summary className="cursor-pointer py-2 text-xs">
          Connection details
        </summary>
        <p>
          {failed
            ? 'Business records are unavailable. Retry checks the connection and reloads these records.'
            : loading
              ? 'Checking business records. Please wait.'
              : problem
                ? 'An operation needs attention. Retry checks updates and business records.'
                : offline
                  ? 'Waiting for a connection.'
                  : phase === 'in-sync'
                    ? 'All changes in this device are shared.'
                    : 'Updates are still pending. Other devices may not have these changes yet.'}
        </p>
        <Button
          variant="secondary"
          disabled={busy || offline || loading}
          onClick={retry}
        >
          Check for updates
        </Button>
      </details>
    </div>
  )
}
