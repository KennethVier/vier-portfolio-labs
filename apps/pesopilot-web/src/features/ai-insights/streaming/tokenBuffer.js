import { StreamError, STREAM_ERROR_CODES } from './streamErrors.js'

export const MAX_BUFFER_CHARACTERS = 5000

export function createTokenBuffer({ maxCharacters = MAX_BUFFER_CHARACTERS } = {}) {
  const fragments = []
  let totalLength = 0
  let isClosed = false

  return {
    append(textFragment) {
      if (isClosed) {
        throw new StreamError({
          code: STREAM_ERROR_CODES.STREAM_INVALID_TRANSITION,
          message: 'Cannot append to closed TokenBuffer.',
        })
      }

      if (typeof textFragment !== 'string' || !textFragment) {
        return totalLength
      }

      if (totalLength + textFragment.length > maxCharacters) {
        throw new StreamError({
          code: STREAM_ERROR_CODES.STREAM_BUFFER_LIMIT_EXCEEDED,
          message: `Buffer exceeded maximum limit of ${maxCharacters} characters.`,
        })
      }

      fragments.push(textFragment)
      totalLength += textFragment.length
      return totalLength
    },

    getLength() {
      return totalLength
    },

    getFragmentCount() {
      return fragments.length
    },

    reconstruct() {
      return fragments.join('')
    },

    getContent() {
      return fragments.join('')
    },

    clear() {
      fragments.length = 0
      totalLength = 0
    },

    close() {
      isClosed = true
    },

    isClosed() {
      return isClosed
    },
  }
}
