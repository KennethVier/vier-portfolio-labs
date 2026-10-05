export function createDeterministicClock(initialMs = 1700000000000) {
  let currentMs = Number(initialMs)

  return {
    nowMs() {
      return currentMs
    },
    isoString() {
      return new Date(currentMs).toISOString()
    },
    advance(ms) {
      currentMs += Math.max(0, Number(ms) || 0)
      return currentMs
    },
    set(ms) {
      currentMs = Number(ms)
      return currentMs
    },
  }
}

export function createDeterministicTimer(clock = null) {
  let nextTimerId = 1
  const activeTimers = new Map()

  const timer = {
    setTimeout(fn, ms) {
      if (typeof fn !== 'function') {
        throw new TypeError('Timer callback must be a function.')
      }
      const id = nextTimerId++
      const now = clock && typeof clock.nowMs === 'function' ? clock.nowMs() : 0
      const delay = Math.max(0, Number(ms) || 0)
      activeTimers.set(id, {
        id,
        fn,
        delay,
        triggerAt: now + delay,
      })
      return id
    },

    clearTimeout(id) {
      activeTimers.delete(id)
    },

    getActiveCount() {
      return activeTimers.size
    },

    getActiveTimers() {
      return Array.from(activeTimers.values()).map((t) => ({ ...t }))
    },

    runDueTimers() {
      if (!clock || typeof clock.nowMs !== 'function') return 0
      const now = clock.nowMs()
      const due = []

      for (const [id, record] of activeTimers.entries()) {
        if (record.triggerAt <= now) {
          due.push(record)
          activeTimers.delete(id)
        }
      }

      // Execute due callbacks in chronological order of scheduled trigger
      due.sort((a, b) => a.triggerAt - b.triggerAt)
      for (const record of due) {
        try {
          record.fn()
        } catch {
          // Suppress internal callback error during batch timer flush
        }
      }
      return due.length
    },

    advanceTime(ms) {
      if (clock && typeof clock.advance === 'function') {
        clock.advance(ms)
      }
      return timer.runDueTimers()
    },

    clearAll() {
      activeTimers.clear()
    },
  }

  return timer
}

export function createDeterministicIdGenerator(prefix = 'wf') {
  let counter = 0
  return function generateId() {
    counter += 1
    const padded = String(counter).padStart(3, '0')
    return `${prefix}-${padded}`
  }
}

export function createDeterministicRuntime({
  initialMs = 1700000000000,
  idPrefix = 'wf',
} = {}) {
  const clock = createDeterministicClock(initialMs)
  const timer = createDeterministicTimer(clock)
  const idGenerator = createDeterministicIdGenerator(idPrefix)

  return Object.freeze({
    clock,
    timer,
    idGenerator,
  })
}
