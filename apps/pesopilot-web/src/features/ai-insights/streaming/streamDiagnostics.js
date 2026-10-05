import { StreamError, STREAM_ERROR_CODES } from './streamErrors.js'

export const STREAM_DIAGNOSTICS_VERSION = '1.0.0'

export function createStreamDiagnostics({
  streamId,
  state = 'starting',
  providerFragmentsReceived = 0,
  chunksPublished = 0,
  charactersGenerated = 0,
  charactersPublished = 0,
  startedAt = '',
  providerCompletedAt = null,
  publicationStartedAt = null,
  completedAt = null,
  durationMs = null,
} = {}) {
  if (typeof streamId !== 'string' || !streamId.trim()) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamDiagnostics requires a non-empty string streamId.',
    })
  }

  return Object.freeze({
    version: STREAM_DIAGNOSTICS_VERSION,
    streamId: streamId.trim(),
    state: typeof state === 'string' ? state : 'unknown',
    providerFragmentsReceived: Math.max(0, Number(providerFragmentsReceived) || 0),
    chunksPublished: Math.max(0, Number(chunksPublished) || 0),
    charactersGenerated: Math.max(0, Number(charactersGenerated) || 0),
    charactersPublished: Math.max(0, Number(charactersPublished) || 0),
    startedAt: typeof startedAt === 'string' ? startedAt : '',
    providerCompletedAt: typeof providerCompletedAt === 'string' ? providerCompletedAt : null,
    publicationStartedAt: typeof publicationStartedAt === 'string' ? publicationStartedAt : null,
    completedAt: typeof completedAt === 'string' ? completedAt : null,
    durationMs: durationMs !== null && typeof durationMs === 'number' && durationMs >= 0 ? durationMs : null,
  })
}

export function validateStreamDiagnostics(diagnostics) {
  const errors = []

  if (!diagnostics || typeof diagnostics !== 'object') {
    return {
      valid: false,
      errors: ['StreamDiagnostics must be a valid non-null object.'],
    }
  }

  if (diagnostics.version !== STREAM_DIAGNOSTICS_VERSION) {
    errors.push(`StreamDiagnostics version must be "${STREAM_DIAGNOSTICS_VERSION}".`)
  }

  if (typeof diagnostics.streamId !== 'string' || !diagnostics.streamId.trim()) {
    errors.push('StreamDiagnostics streamId must be a non-empty string.')
  }

  if (typeof diagnostics.state !== 'string') {
    errors.push('StreamDiagnostics state must be a string.')
  }

  if (typeof diagnostics.providerFragmentsReceived !== 'number' || diagnostics.providerFragmentsReceived < 0) {
    errors.push('StreamDiagnostics providerFragmentsReceived must be a non-negative number.')
  }

  if (typeof diagnostics.chunksPublished !== 'number' || diagnostics.chunksPublished < 0) {
    errors.push('StreamDiagnostics chunksPublished must be a non-negative number.')
  }

  if (typeof diagnostics.charactersGenerated !== 'number' || diagnostics.charactersGenerated < 0) {
    errors.push('StreamDiagnostics charactersGenerated must be a non-negative number.')
  }

  if (typeof diagnostics.charactersPublished !== 'number' || diagnostics.charactersPublished < 0) {
    errors.push('StreamDiagnostics charactersPublished must be a non-negative number.')
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  }
}
