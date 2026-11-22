import { Button } from '@/components/ui/Button.jsx'
export function BusinessSyncStatus({
  phase,
  online,
  busy,
  retry,
  problem,
  notice,
}) {
  const offline = !online || phase === 'offline'
  const message = offline
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
        <p role={phase === 'error' && !offline ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      {problem && <p role="alert">{problem}</p>}
      {notice && <p role="status">{notice}</p>}
      {(phase === 'error' || problem) && (
        <Button variant="secondary" disabled={busy || offline} onClick={retry}>
          Try again
        </Button>
      )}
      <details>
        <summary className="cursor-pointer py-2 text-xs">
          Connection details
        </summary>
        <p>
          {offline
            ? 'Waiting for a connection.'
            : phase === 'in-sync'
              ? 'All changes in this device are shared.'
              : 'Updates are still pending. Other devices may not have these changes yet.'}
        </p>
        <Button variant="secondary" disabled={busy || offline} onClick={retry}>
          Check for updates
        </Button>
      </details>
    </div>
  )
}
