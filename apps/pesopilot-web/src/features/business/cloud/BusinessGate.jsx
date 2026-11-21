import { useState, useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button.jsx'
import { Input } from '@/components/ui/Input.jsx'
import { db, watchAccount } from './client.ts'
import { AccessContext, permits } from './access.js'
import '../business.css'

export function BusinessGate() {
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setState({ loading: true })
    return db ? watchAccount(db, setState) : undefined
  }, [attempt])
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
      {state.diagnostics && (
        <details>
          <summary>Access diagnostics</summary>
          <pre className="overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(state.diagnostics, null, 2)}
          </pre>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  )
  if (!db) return panel(<p role="alert">Configure the development Dexie Cloud URL to sign in.</p>)
  if (state.error)
    return panel(
      <>
        <p role="alert">{state.error}</p>
        <Button onClick={() => setAttempt((value) => value + 1)}>Retry access check</Button>
        <Button onClick={logout}>Sign out</Button>
      </>,
    )
  if (state.loading)
    return panel(
      <p role="status">
        {state.synchronizing ? 'Synchronizing Business access…' : 'Checking Business membership…'}
      </p>,
    )
  if (!state.profile && state.invite)
    return panel(
      <Button disabled={busy} onClick={() => run(() => state.invite.accept())}>
        Accept Business invitation
      </Button>,
    )
  if (state.denied)
    return panel(
      <>
        <p>{state.reason || 'Ask the Admin for access to this business.'}</p>
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
      {state.diagnostics && (
        <details>
          <summary>Access diagnostics</summary>
          <pre className="overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(state.diagnostics, null, 2)}
          </pre>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
    </AccessContext.Provider>
  )
}
