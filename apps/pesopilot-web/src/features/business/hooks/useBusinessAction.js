import { useRef, useState } from 'react'

export function useBusinessAction() {
  const locked = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function run(operation, message) {
    if (locked.current) return false
    locked.current = true
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await operation()
      setNotice(message)
      return true
    } catch (failure) {
      setError(failure.message || 'Unable to save. Please retry.')
      return false
    } finally {
      locked.current = false
      setSaving(false)
    }
  }

  return { saving, error, notice, run }
}
