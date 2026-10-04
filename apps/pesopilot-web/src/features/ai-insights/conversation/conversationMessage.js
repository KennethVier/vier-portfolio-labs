import { isValidTimestamp } from './conversationSession.js'

export const MESSAGE_ROLES = Object.freeze({
  assistant: 'assistant',
  user: 'user',
})

export const MAX_MESSAGE_CHARACTERS = 4000

export function createMessage({
  content,
  createdAt,
  messageId,
  role,
  sequence,
} = {}) {
  if (!messageId || typeof messageId !== 'string' || messageId.trim().length === 0) {
    throw new Error('createMessage requires a non-empty messageId string.')
  }
  if (!Object.values(MESSAGE_ROLES).includes(role)) {
    throw new Error(
      `Invalid message role "${role}". Allowed roles: ${Object.values(MESSAGE_ROLES).join(', ')}.`,
    )
  }
  if (typeof content !== 'string') {
    throw new Error('createMessage requires content to be a string.')
  }
  if (content.trim().length === 0) {
    throw new Error('createMessage requires non-empty text content.')
  }
  if (content.length > MAX_MESSAGE_CHARACTERS) {
    throw new Error(
      `Message content exceeds maximum allowed length of ${MAX_MESSAGE_CHARACTERS} characters.`,
    )
  }
  if (!createdAt || typeof createdAt !== 'string' || !isValidTimestamp(createdAt)) {
    throw new Error('createMessage requires a valid ISO-8601 createdAt timestamp.')
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('createMessage requires a positive integer sequence number.')
  }

  return Object.freeze({
    content,
    createdAt,
    messageId,
    role,
    sequence,
  })
}
