import { StreamError, STREAM_ERROR_CODES } from './streamErrors.js'

export const STREAM_EVENT_VERSION = '1.0.0'

export const STREAM_EVENT_TYPES = Object.freeze(
  Object.assign(['started', 'chunk', 'completed', 'cancelled', 'failed', 'timed_out'], {
    STARTED: 'started',
    CHUNK: 'chunk',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    FAILED: 'failed',
    TIMED_OUT: 'timed_out',
  }),
)

export function createStreamEvent({
  streamId,
  sequence,
  eventType,
  payload = null,
  timestamp,
} = {}) {
  if (typeof streamId !== 'string' || !streamId.trim()) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamEvent requires a non-empty string streamId.',
    })
  }

  if (typeof sequence !== 'number' || !Number.isInteger(sequence) || sequence < 1) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamEvent sequence must be an integer >= 1.',
      streamId,
    })
  }

  if (!STREAM_EVENT_TYPES.includes(eventType)) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: `Invalid eventType "${eventType}". Must be one of: ${STREAM_EVENT_TYPES.join(', ')}.`,
      streamId,
    })
  }

  const resolvedTimestamp = typeof timestamp === 'string' && timestamp.trim()
    ? timestamp.trim()
    : new Date().toISOString()

  return Object.freeze({
    version: STREAM_EVENT_VERSION,
    streamId: streamId.trim(),
    sequence,
    eventType,
    payload: payload !== undefined ? payload : null,
    timestamp: resolvedTimestamp,
  })
}

export function validateStreamEvent(event) {
  const errors = []

  if (!event || typeof event !== 'object') {
    return {
      valid: false,
      errors: ['StreamEvent must be a valid non-null object.'],
    }
  }

  if (event.version !== STREAM_EVENT_VERSION) {
    errors.push(`StreamEvent version must be "${STREAM_EVENT_VERSION}".`)
  }

  if (typeof event.streamId !== 'string' || !event.streamId.trim()) {
    errors.push('StreamEvent streamId must be a non-empty string.')
  }

  if (typeof event.sequence !== 'number' || !Number.isInteger(event.sequence) || event.sequence < 1) {
    errors.push('StreamEvent sequence must be an integer >= 1.')
  }

  if (!STREAM_EVENT_TYPES.includes(event.eventType)) {
    errors.push(`StreamEvent eventType "${event.eventType}" is invalid.`)
  }

  if (typeof event.timestamp !== 'string' || !event.timestamp.trim()) {
    errors.push('StreamEvent timestamp must be a non-empty string.')
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  }
}
