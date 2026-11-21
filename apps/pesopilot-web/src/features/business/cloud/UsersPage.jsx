import { useState, useEffect } from 'react'
import { liveQuery } from 'dexie'
import { BusinessShell } from '../components/BusinessShell.jsx'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { changeStaff, db, realmId } from './client.ts'

export function UsersPage() {
  const [users, setUsers] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    const sub = liveQuery(() => db.members.where('realmId').equals(realmId).toArray()).subscribe({
      next: setUsers,
      error: () => setMessage('Unable to load memberships.'),
    })
    return () => sub.unsubscribe()
  }, [])
  async function change(input, success) {
    setBusy(true)
    try {
      await changeStaff(db, input)
      setMessage(success)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <BusinessShell>
      <h1 className="font-heading text-3xl">Business users</h1>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          change({ email: new FormData(event.currentTarget).get('email') }, 'Invitation synchronized.')
        }}
      >
        <Input name="email" label="Staff email" type="email" required />
        <Button disabled={busy} type="submit">
          Invite Staff
        </Button>
      </form>
      {message && <p role="status">{message}</p>}
      <ul>
        {users.map((user) => (
          <li key={user.id} className="flex flex-wrap items-center gap-4 border-b p-3">
            <span>{user.email || user.userId}</span>
            <span>{user.roles?.join(', ')}</span>
            <span>{user.rejected ? 'Declined' : user.accepted ? 'Active' : 'Invited'}</span>
            {user.roles?.join() === 'staff' && (
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() => change({ id: user.id }, 'Staff access removed.')}
              >
                Disable access
              </Button>
            )}
          </li>
        ))}
      </ul>
    </BusinessShell>
  )
}
