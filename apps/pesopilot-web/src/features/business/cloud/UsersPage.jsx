import { useState, useEffect, useRef } from 'react'
import { liveQuery } from 'dexie'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { BusinessDialog } from '../components/BusinessDialog.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { changeStaff, db, realmId } from './client.ts'

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const [removing, setRemoving] = useState(null)
  const locked = useRef(false)
  useEffect(() => {
    const sub = liveQuery(() => db.members.where('realmId').equals(realmId).toArray()).subscribe({
      next: setUsers,
      error: () => setFailure('Unable to load memberships.'),
    })
    return () => sub.unsubscribe()
  }, [])
  async function change(input, success) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setMessage('')
    setFailure('')
    try {
      await changeStaff(db, input)
      if ('email' in input) setEmail('')
      else setRemoving(null)
      setMessage(success)
    } catch (error) {
      setFailure(error.message || 'Operation failed. Check membership synchronization before retrying.')
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return (
    <BusinessShell>
      <div className="business-page-heading">
        <h1 className="font-heading text-3xl">Business users</h1>
        <p className="mt-2 text-content-muted">Manage invitations and business access.</p>
      </div>
      <section className="business-users-panel space-y-5 rounded-2xl border p-5 sm:p-6">
        <h2 className="text-xl">Invite Staff</h2>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            change(
              { email: email.trim().toLowerCase() },
              'Invitation synchronized. Complete owner-side account registration before Staff signs in.',
            )
          }}
        >
          <Input
            name="email"
            label="Staff email"
            type="email"
            required
            value={email}
            disabled={busy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button disabled={busy} type="submit" className="min-h-11">
            {busy ? 'Saving…' : 'Invite Staff'}
          </Button>
        </form>
        <p className="text-sm">
          An invitation grants business membership. Under restricted admission, the owner must also
          register the Staff application account using the setup script.
        </p>
        <p className="text-sm">
          Registration and licenses are unverified here. Run the owner-side account audit to check them.
        </p>
        {message && <p role="status">{message}</p>}
        {failure && (
          <p role="alert" className="text-error">
            {failure}
          </p>
        )}
      </section>
      <section
        aria-label="Business memberships"
        className="business-users-panel rounded-2xl border p-3 sm:p-5"
      >
        <ul className="divide-y">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="break-all font-semibold">{user.email || user.userId}</p>
                <p className="text-sm capitalize">
                  {user.roles?.join(', ')} ·{' '}
                  {user.rejected
                    ? 'Invitation declined'
                    : user.accepted
                      ? 'Membership accepted'
                      : 'Invitation pending'}
                </p>
                {user.roles?.join() === 'staff' && (
                  <p className="text-sm">Account registration · Owner verification required</p>
                )}
              </div>
              {user.roles?.join() === 'staff' && (
                <Button
                  disabled={busy}
                  variant="secondary"
                  className="min-h-11 shrink-0"
                  onClick={() => setRemoving(user)}
                >
                  Remove Staff
                </Button>
              )}
            </li>
          ))}
        </ul>
        {!users.length && <p className="p-3">No visible memberships.</p>}
      </section>
      {removing && (
        <BusinessDialog
          title="Remove Staff membership?"
          onClose={() => {
            if (!busy) setRemoving(null)
          }}
        >
          <p className="mb-5">
            Remove {removing.email || removing.userId} from this business? Cloud access is revoked after
            synchronization. Saved sales and account records are retained.
          </p>
          {failure && (
            <p role="alert" className="mb-3 text-error">
              {failure}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} variant="secondary" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={() => change({ id: removing.id }, 'Staff membership removed and synchronized.')}
            >
              Confirm Remove Staff
            </Button>
          </div>
        </BusinessDialog>
      )}
    </BusinessShell>
  )
}
