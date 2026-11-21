import { useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { db, watchAccount } from './client.ts'
import { AccessContext, permits } from './access.js'
import '../business.css'

export function BusinessGate() {
  const [state, setState] = useState({ loading: true })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => (db ? watchAccount(db, setState) : undefined), [])
  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (failure) {
      setError(
        failure.code === 'USER_NOT_REGISTERED'
          ? 'Ask the Admin to provision your Dexie Cloud application user, then sign in again.'
          : failure.message || 'Unable to complete the request.',
      )
    } finally {
      setBusy(false)
    }
  }
  const logout = () => run(() => db.cloud.logout())
  const panel = (content) => (
    <main className="business-touch mx-auto max-w-md space-y-4 p-6">
      <h1 className="font-heading text-2xl">PesoPilot Business</h1>
      {content}
      {error && <p role="alert">{error}</p>}
    </main>
  )
  if (!db) return panel(<p role="alert">Configure the development Dexie Cloud URL to sign in.</p>)
  if (state.error) return panel(<p role="alert">{state.error}</p>)
  if (state.loading) return panel(<p role="status">Checking Business membership…</p>)
  if (!state.profile && state.invite)
    return panel(
      <Button disabled={busy} onClick={() => run(() => state.invite.accept())}>
        Accept Business invitation
      </Button>,
    )
  if (state.denied)
    return panel(
      <>
        <p>Ask the Admin for access to this business.</p>
        <Button disabled={busy} onClick={logout}>
          Sign out
        </Button>
      </>,
    )
  if (!state.profile)
    return panel(
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const email = String(new FormData(event.currentTarget).get('email')).trim().toLowerCase()
          run(() => db.cloud.login({ email, grant_type: 'otp', intent: 'login' }))
        }}
      >
        <Input label="Business email" name="email" required type="email" autoComplete="email" />
        <Button type="submit" disabled={busy}>
          Sign in with email code
        </Button>
      </form>,
    )
  const path = pathname.replace(/\/$/, '')
  if (!permits(state.profile, !['/business', '/business/receipts', '/business/stock'].includes(path)))
    return <Navigate to="/business" replace />
  return (
    <AccessContext.Provider key={state.profile.id} value={{ profile: state.profile, logout }}>
      <Outlet />
      {error && <p role="alert">{error}</p>}
    </AccessContext.Provider>
  )
}
