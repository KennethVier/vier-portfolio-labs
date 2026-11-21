import { it, expect, vi } from 'vitest'
import { BehaviorSubject } from 'rxjs'
import { initialPull } from './initialPull.ts'
it('surfaces addon 422 state even when the pull promise remains pending, then allows retry', async () => {
  const state = new BehaviorSubject({ phase: 'initial' })
  const db = { cloud: { syncState: state, sync: vi.fn(() => new Promise(() => {})) } }
  const failed = initialPull(db)
  state.next({ phase: 'error', error: new Error('HTTP 422 Unprocessable Entity token=private') })
  await expect(failed).rejects.toThrow('sealed schema')
  db.cloud.sync.mockResolvedValue(undefined)
  await expect(initialPull(db)).resolves.toBeUndefined()
})
it('bounds a silent pending pull', async () => {
  vi.useFakeTimers()
  try {
    const db = {
      cloud: { syncState: new BehaviorSubject({ phase: 'pulling' }), sync: () => new Promise(() => {}) },
    }
    const pull = expect(initialPull(db, 10)).rejects.toThrow('has not completed')
    await vi.advanceTimersByTimeAsync(10)
    await pull
  } finally {
    vi.useRealTimers()
  }
})
