import { StreamError, STREAM_ERROR_CODES } from './streamErrors.js'
import { createStreamEvent } from './streamEvent.js'
import { splitIntoStreamChunks } from './streamChunk.js'
import { createTokenBuffer, MAX_BUFFER_CHARACTERS } from './tokenBuffer.js'
import { createStreamDiagnostics } from './streamDiagnostics.js'

export const STREAM_LIFECYCLE_STATES = Object.freeze({
  STARTING: 'starting',
  STREAMING: 'streaming',
  VALIDATING: 'validating',
  PUBLISHING: 'publishing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  TIMED_OUT: 'timed_out',
})

const TERMINAL_STATES = new Set([
  STREAM_LIFECYCLE_STATES.COMPLETED,
  STREAM_LIFECYCLE_STATES.CANCELLED,
  STREAM_LIFECYCLE_STATES.FAILED,
  STREAM_LIFECYCLE_STATES.TIMED_OUT,
])

const DEFAULT_CLOCK = Object.freeze({
  nowMs: () => Date.now(),
  isoString: () => new Date().toISOString(),
})

const DEFAULT_ID_GENERATOR = () => {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `stream-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createStreamSession({
  streamId = null,
  clock = DEFAULT_CLOCK,
  idGenerator = DEFAULT_ID_GENERATOR,
  abortController = null,
  onEvent = null,
  onChunk = null,
  maxBufferLength = MAX_BUFFER_CHARACTERS,
} = {}) {
  const resolvedStreamId = typeof streamId === 'string' && streamId.trim()
    ? streamId.trim()
    : idGenerator()

  const controller = abortController || new AbortController()
  const tokenBuffer = createTokenBuffer({ maxCharacters: maxBufferLength })

  const getNowMs = () => (typeof clock?.nowMs === 'function' ? clock.nowMs() : Date.now())
  const getIsoString = () =>
    typeof clock?.isoString === 'function'
      ? clock.isoString()
      : new Date(getNowMs()).toISOString()

  const startedMs = getNowMs()
  const startedAt = getIsoString()

  let state = STREAM_LIFECYCLE_STATES.STARTING
  let eventSequence = 1
  let providerFragmentsReceived = 0
  let chunksPublished = 0
  let charactersGenerated = 0
  let charactersPublished = 0
  let providerCompletedAt = null
  let publicationStartedAt = null
  let completedAt = null
  let durationMs = null

  function emitEvent(eventType, payload = null) {
    const event = createStreamEvent({
      streamId: resolvedStreamId,
      sequence: eventSequence,
      eventType,
      payload,
      timestamp: getIsoString(),
    })
    eventSequence += 1

    if (typeof onEvent === 'function') {
      try {
        onEvent(event)
      } catch {
        // Safe callback execution
      }
    }
    return event
  }

  // Emit initial started event
  emitEvent('started')

  function getDiagnostics() {
    return createStreamDiagnostics({
      streamId: resolvedStreamId,
      state,
      providerFragmentsReceived,
      chunksPublished,
      charactersGenerated,
      charactersPublished,
      startedAt,
      providerCompletedAt,
      publicationStartedAt,
      completedAt,
      durationMs,
    })
  }

  let resolvePromise
  let rejectPromise
  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  promise.catch(() => {})

  function transitionTo(newState) {
    if (state === newState) return

    const validTransitions = {
      [STREAM_LIFECYCLE_STATES.STARTING]: [
        STREAM_LIFECYCLE_STATES.STREAMING,
        STREAM_LIFECYCLE_STATES.VALIDATING,
        STREAM_LIFECYCLE_STATES.CANCELLED,
        STREAM_LIFECYCLE_STATES.FAILED,
        STREAM_LIFECYCLE_STATES.TIMED_OUT,
      ],
      [STREAM_LIFECYCLE_STATES.STREAMING]: [
        STREAM_LIFECYCLE_STATES.VALIDATING,
        STREAM_LIFECYCLE_STATES.CANCELLED,
        STREAM_LIFECYCLE_STATES.FAILED,
        STREAM_LIFECYCLE_STATES.TIMED_OUT,
      ],
      [STREAM_LIFECYCLE_STATES.VALIDATING]: [
        STREAM_LIFECYCLE_STATES.PUBLISHING,
        STREAM_LIFECYCLE_STATES.CANCELLED,
        STREAM_LIFECYCLE_STATES.FAILED,
        STREAM_LIFECYCLE_STATES.TIMED_OUT,
      ],
      [STREAM_LIFECYCLE_STATES.PUBLISHING]: [
        STREAM_LIFECYCLE_STATES.COMPLETED,
        STREAM_LIFECYCLE_STATES.CANCELLED,
      ],
    }

    const allowed = validTransitions[state]
    if (!allowed || !allowed.includes(newState)) {
      throw new StreamError({
        code: STREAM_ERROR_CODES.STREAM_INVALID_TRANSITION,
        message: `Illegal transition from "${state}" to "${newState}".`,
        streamId: resolvedStreamId,
      })
    }

    state = newState
  }

  return {
    streamId: resolvedStreamId,
    abortController: controller,
    promise,

    getState() {
      return state
    },

    manager: {
      getState() {
        return state
      },
      transitionTo,
    },

    getDiagnostics,

    onProviderFragment(fragment) {
      if (TERMINAL_STATES.has(state)) {
        return
      }

      if (controller.signal.aborted) {
        this.cancel('Operation was aborted.')
        throw new StreamError({
          code: STREAM_ERROR_CODES.STREAM_CANCELLED,
          message: 'Stream was aborted.',
          streamId: resolvedStreamId,
        })
      }

      if (state === STREAM_LIFECYCLE_STATES.STARTING) {
        state = STREAM_LIFECYCLE_STATES.STREAMING
      }

      const textFragment = fragment?.textFragment ?? ''
      providerFragmentsReceived += 1

      try {
        tokenBuffer.append(textFragment)
        charactersGenerated = tokenBuffer.getLength()
      } catch (err) {
        controller.abort()
        this.fail(err)
        throw err
      }
    },

    onProviderComplete() {
      if (TERMINAL_STATES.has(state)) {
        throw new StreamError({
          code: STREAM_ERROR_CODES.STREAM_INVALID_TRANSITION,
          message: `Cannot complete provider in terminal state "${state}".`,
          streamId: resolvedStreamId,
        })
      }

      state = STREAM_LIFECYCLE_STATES.VALIDATING
      providerCompletedAt = getIsoString()
      tokenBuffer.close()
      return tokenBuffer.reconstruct()
    },

    resetForRetry() {
      if (TERMINAL_STATES.has(state)) {
        return
      }
      tokenBuffer.clear()
      charactersGenerated = 0
      state = STREAM_LIFECYCLE_STATES.STARTING
    },

    publishValidatedContent(content, options = {}) {
      if (TERMINAL_STATES.has(state)) {
        throw new StreamError({
          code: STREAM_ERROR_CODES.STREAM_INVALID_TRANSITION,
          message: `Cannot publish content in terminal state "${state}".`,
          streamId: resolvedStreamId,
        })
      }

      const activeOnChunk = options?.onChunk || onChunk

      if (controller.signal.aborted || state === STREAM_LIFECYCLE_STATES.CANCELLED) {
        this.cancel('Cancelled before publication.')
        return
      }

      state = STREAM_LIFECYCLE_STATES.PUBLISHING
      publicationStartedAt = getIsoString()

      const chunks = splitIntoStreamChunks(content, { streamId: resolvedStreamId })

      for (let i = 0; i < chunks.length; i++) {
        if (controller.signal.aborted || state === STREAM_LIFECYCLE_STATES.CANCELLED) {
          this.cancel('Cancelled during publication.')
          return
        }

        const chunk = chunks[i]
        chunksPublished += 1
        charactersPublished += chunk.content.length

        emitEvent('chunk', { chunk })

        if (typeof activeOnChunk === 'function') {
          try {
            activeOnChunk(chunk)
          } catch {
            // Safe consumer execution
          }
        }

        // Check if consumer triggered cancel inside onChunk
        if (controller.signal.aborted || state === STREAM_LIFECYCLE_STATES.CANCELLED) {
          this.cancel('Cancelled during publication callback.')
          return
        }
      }

      state = STREAM_LIFECYCLE_STATES.COMPLETED
      completedAt = getIsoString()
      durationMs = getNowMs() - startedMs

      const diag = getDiagnostics()
      emitEvent('completed', { diagnostics: diag })
      resolvePromise(diag)
    },

    cancel(reason = 'Stream cancelled by caller.') {
      if (TERMINAL_STATES.has(state)) {
        return getDiagnostics()
      }

      controller.abort()
      tokenBuffer.clear()
      state = STREAM_LIFECYCLE_STATES.CANCELLED
      completedAt = getIsoString()
      durationMs = getNowMs() - startedMs

      const diag = getDiagnostics()
      emitEvent('cancelled', { reason })
      resolvePromise(diag)
      return diag
    },

    fail(error) {
      if (TERMINAL_STATES.has(state)) {
        return getDiagnostics()
      }

      controller.abort()
      tokenBuffer.clear()
      state = STREAM_LIFECYCLE_STATES.FAILED
      completedAt = getIsoString()
      durationMs = getNowMs() - startedMs

      const safeMessage = error instanceof Error ? error.message : 'Stream failed.'
      const diag = getDiagnostics()
      emitEvent('failed', { error: safeMessage })
      rejectPromise(error instanceof Error ? error : new Error(safeMessage))
      return diag
    },

    timeout() {
      if (TERMINAL_STATES.has(state)) {
        return getDiagnostics()
      }

      controller.abort()
      tokenBuffer.clear()
      state = STREAM_LIFECYCLE_STATES.TIMED_OUT
      completedAt = getIsoString()
      durationMs = getNowMs() - startedMs

      const diag = getDiagnostics()
      emitEvent('timed_out')
      rejectPromise(new StreamError({
        code: STREAM_ERROR_CODES.STREAM_TIMED_OUT,
        message: 'Stream timed out.',
        streamId: resolvedStreamId,
      }))
      return diag
    },
  }
}
