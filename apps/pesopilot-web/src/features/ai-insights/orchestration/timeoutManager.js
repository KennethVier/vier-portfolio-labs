export const DEFAULT_WORKFLOW_TIMEOUT_MS = 45000

export function createTimeoutManager({
  timeoutMs = DEFAULT_WORKFLOW_TIMEOUT_MS,
  startedMs,
  clock = { nowMs: () => Date.now() },
  timer = {
    setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
    clearTimeout: (id) => globalThis.clearTimeout(id),
  },
} = {}) {
  const safeTimeoutMs = typeof timeoutMs === 'number' && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_WORKFLOW_TIMEOUT_MS

  const safeStartedMs = typeof startedMs === 'number' && startedMs > 0
    ? startedMs
    : clock.nowMs()

  const deadlineMs = safeStartedMs + safeTimeoutMs
  const controller = new AbortController()

  const remainingInitial = Math.max(0, deadlineMs - clock.nowMs())
  let timeoutId = timer.setTimeout(() => {
    controller.abort()
  }, remainingInitial)

  function cancelTimer() {
    if (timeoutId !== null) {
      timer.clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  function getRemainingMs() {
    return deadlineMs - clock.nowMs()
  }

  function isExpired() {
    return controller.signal.aborted || getRemainingMs() <= 0
  }

  function abort() {
    cancelTimer()
    if (!controller.signal.aborted) {
      controller.abort()
    }
  }

  return Object.freeze({
    controller,
    signal: controller.signal,
    deadlineMs,
    timeoutMs: safeTimeoutMs,
    cancelTimer,
    getRemainingMs,
    isExpired,
    abort,
  })
}
