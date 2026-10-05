import { StreamError, STREAM_ERROR_CODES } from './streamErrors.js'

export const STREAM_CHUNK_VERSION = '1.0.0'
export const MAX_CHUNK_CHARACTERS = 256

function isHighSurrogate(code) {
  return code >= 0xd800 && code <= 0xdbff
}

function isLowSurrogate(code) {
  return code >= 0xdc00 && code <= 0xdfff
}

export function createStreamChunk({
  streamId,
  sequence,
  content,
} = {}) {
  if (typeof streamId !== 'string' || !streamId.trim()) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamChunk requires a non-empty string streamId.',
    })
  }

  if (typeof sequence !== 'number' || !Number.isInteger(sequence) || sequence < 1) {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamChunk sequence must be an integer >= 1.',
      streamId,
    })
  }

  if (typeof content !== 'string') {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'StreamChunk content must be a string.',
      streamId,
    })
  }

  return Object.freeze({
    version: STREAM_CHUNK_VERSION,
    streamId: streamId.trim(),
    sequence,
    content,
  })
}

export function validateStreamChunk(chunk) {
  const errors = []

  if (!chunk || typeof chunk !== 'object') {
    return {
      valid: false,
      errors: ['StreamChunk must be a valid non-null object.'],
    }
  }

  if (chunk.version !== STREAM_CHUNK_VERSION) {
    errors.push(`StreamChunk version must be "${STREAM_CHUNK_VERSION}".`)
  }

  if (typeof chunk.streamId !== 'string' || !chunk.streamId.trim()) {
    errors.push('StreamChunk streamId must be a non-empty string.')
  }

  if (typeof chunk.sequence !== 'number' || !Number.isInteger(chunk.sequence) || chunk.sequence < 1) {
    errors.push('StreamChunk sequence must be an integer >= 1.')
  }

  if (typeof chunk.content !== 'string') {
    errors.push('StreamChunk content must be a string.')
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  }
}

export function splitIntoStreamChunks(content, optionsOrStreamId = {}) {
  const options = typeof optionsOrStreamId === 'string'
    ? { streamId: optionsOrStreamId }
    : (optionsOrStreamId || {})
  const { streamId = 'default-stream', maxChunkSize = MAX_CHUNK_CHARACTERS } = options
  if (typeof content !== 'string') {
    throw new StreamError({
      code: STREAM_ERROR_CODES.INVALID_STREAM_INPUT,
      message: 'splitIntoStreamChunks requires a string content.',
      streamId,
    })
  }

  if (!content) {
    return []
  }

  const chunks = []
  let startIndex = 0
  let sequence = 1

  while (startIndex < content.length) {
    let targetEnd = Math.min(startIndex + maxChunkSize, content.length)

    // Ensure we do not split a surrogate pair across chunks
    if (targetEnd < content.length) {
      const prevCode = content.charCodeAt(targetEnd - 1)
      const nextCode = content.charCodeAt(targetEnd)
      if (isHighSurrogate(prevCode) && isLowSurrogate(nextCode)) {
        targetEnd -= 1
      }
    }

    const chunkContent = content.slice(startIndex, targetEnd)
    chunks.push(createStreamChunk({
      streamId,
      sequence,
      content: chunkContent,
    }))

    sequence += 1
    startIndex = targetEnd
  }

  return Object.freeze(chunks)
}
