export const STREAM_ERROR_CODES = Object.freeze({
  STREAM_INVALID_TRANSITION: 'STREAM_INVALID_TRANSITION',
  STREAM_BUFFER_LIMIT_EXCEEDED: 'STREAM_BUFFER_LIMIT_EXCEEDED',
  BUFFER_OVERFLOW: 'STREAM_BUFFER_LIMIT_EXCEEDED',
  STREAM_CANCELLED: 'STREAM_CANCELLED',
  STREAM_FAILED: 'STREAM_FAILED',
  STREAM_TIMEOUT: 'STREAM_TIMEOUT',
  INVALID_STREAM_INPUT: 'INVALID_STREAM_INPUT',
})

export class StreamError extends Error {
  constructor({ code, streamId = null, message = '' } = {}) {
    super(message || code || 'Stream error occurred.')
    this.name = 'StreamError'
    this.code = code || STREAM_ERROR_CODES.STREAM_FAILED
    this.streamId = streamId
  }
}
