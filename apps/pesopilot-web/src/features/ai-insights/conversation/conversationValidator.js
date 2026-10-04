import {
  isValidTimestamp,
  SESSION_STATUSES,
} from './conversationSession.js'
import {
  MAX_MESSAGE_CHARACTERS,
  MESSAGE_ROLES,
} from './conversationMessage.js'
import { CONVERSATION_TOPICS } from './topicTracker.js'
import { CLARIFICATION_REASONS } from './clarificationManager.js'
import { CONVERSATION_VERSION } from './conversation.js'
import {
  CONVERSATION_CONTEXT_VERSION,
  MAX_RECENT_MESSAGES,
} from './conversationContextBuilder.js'

export function validateSession(session) {
  const errors = []
  if (!session || typeof session !== 'object') {
    return {
      errors: ['Session must be a valid object.'],
      valid: false,
    }
  }

  if (!Object.values(SESSION_STATUSES).includes(session.status)) {
    errors.push(
      `Session status "${session.status}" is invalid. Allowed: ${Object.values(SESSION_STATUSES).join(', ')}.`,
    )
  }

  if (!isValidTimestamp(session.startedAt)) {
    errors.push('Session startedAt must be a valid ISO-8601 timestamp string.')
  }

  if (session.status === SESSION_STATUSES.active && session.endedAt !== null) {
    errors.push('Active session must have endedAt as null.')
  }

  if (session.status === SESSION_STATUSES.closed && !isValidTimestamp(session.endedAt)) {
    errors.push('Closed session must have a valid ISO-8601 endedAt timestamp string.')
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateMessage(message) {
  const errors = []
  if (!message || typeof message !== 'object') {
    return {
      errors: ['Message must be a valid object.'],
      valid: false,
    }
  }

  if (typeof message.messageId !== 'string' || message.messageId.trim().length === 0) {
    errors.push('Message messageId must be a non-empty string.')
  }

  if (!Object.values(MESSAGE_ROLES).includes(message.role)) {
    errors.push(
      `Message role "${message.role}" is invalid. Allowed: ${Object.values(MESSAGE_ROLES).join(', ')}.`,
    )
  }

  if (typeof message.content !== 'string') {
    errors.push('Message content must be a string.')
  } else {
    if (message.content.trim().length === 0) {
      errors.push('Message content must not be empty or whitespace-only.')
    }
    if (message.content.length > MAX_MESSAGE_CHARACTERS) {
      errors.push(
        `Message content exceeds max character limit of ${MAX_MESSAGE_CHARACTERS}.`,
      )
    }
  }

  if (!isValidTimestamp(message.createdAt)) {
    errors.push('Message createdAt must be a valid ISO-8601 timestamp string.')
  }

  if (!Number.isInteger(message.sequence) || message.sequence < 1) {
    errors.push('Message sequence must be a positive integer starting from 1.')
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateTopicState(topicState) {
  const errors = []
  if (!topicState || typeof topicState !== 'object') {
    return {
      errors: ['TopicState must be a valid object.'],
      valid: false,
    }
  }

  if (!Object.values(CONVERSATION_TOPICS).includes(topicState.current)) {
    errors.push(
      `Topic current "${topicState.current}" is invalid. Allowed: ${Object.values(CONVERSATION_TOPICS).join(', ')}.`,
    )
  }

  if (
    topicState.previous !== null &&
    !Object.values(CONVERSATION_TOPICS).includes(topicState.previous)
  ) {
    errors.push(
      `Topic previous "${topicState.previous}" is invalid. Allowed: null or ${Object.values(CONVERSATION_TOPICS).join(', ')}.`,
    )
  }

  if (!isValidTimestamp(topicState.updatedAt)) {
    errors.push('TopicState updatedAt must be a valid ISO-8601 timestamp string.')
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateClarificationState(clarificationState) {
  const errors = []
  if (!clarificationState || typeof clarificationState !== 'object') {
    return {
      errors: ['ClarificationState must be a valid object.'],
      valid: false,
    }
  }

  if (typeof clarificationState.required !== 'boolean') {
    errors.push('ClarificationState required must be a boolean.')
  }

  if (clarificationState.required === false) {
    if (clarificationState.reason !== null) {
      errors.push(
        'ClarificationState reason must be null when required is false.',
      )
    }
    if (
      !Array.isArray(clarificationState.missingFields) ||
      clarificationState.missingFields.length > 0
    ) {
      errors.push(
        'ClarificationState missingFields must be an empty array when required is false.',
      )
    }
  } else {
    if (!Object.values(CLARIFICATION_REASONS).includes(clarificationState.reason)) {
      errors.push(
        `ClarificationState reason "${clarificationState.reason}" is invalid. Allowed: ${Object.values(CLARIFICATION_REASONS).join(', ')}.`,
      )
    }
    if (!Array.isArray(clarificationState.missingFields)) {
      errors.push('ClarificationState missingFields must be an array of strings.')
    } else {
      for (const field of clarificationState.missingFields) {
        if (typeof field !== 'string' || field.trim().length === 0) {
          errors.push(
            'ClarificationState missingFields must contain non-empty strings.',
          )
        }
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateConversation(conversation) {
  const errors = []
  if (!conversation || typeof conversation !== 'object') {
    return {
      errors: ['Conversation must be a valid object.'],
      valid: false,
    }
  }

  if (conversation.version !== CONVERSATION_VERSION) {
    errors.push(`Conversation version must be "${CONVERSATION_VERSION}".`)
  }

  if (
    typeof conversation.conversationId !== 'string' ||
    conversation.conversationId.trim().length === 0
  ) {
    errors.push('Conversation conversationId must be a non-empty string.')
  }

  if (!isValidTimestamp(conversation.createdAt)) {
    errors.push('Conversation createdAt must be a valid ISO-8601 timestamp string.')
  }

  if (!isValidTimestamp(conversation.updatedAt)) {
    errors.push('Conversation updatedAt must be a valid ISO-8601 timestamp string.')
  }

  const sessionValidation = validateSession(conversation.session)
  if (!sessionValidation.valid) {
    errors.push(...sessionValidation.errors)
  }

  const topicValidation = validateTopicState(conversation.topicState)
  if (!topicValidation.valid) {
    errors.push(...topicValidation.errors)
  }

  const clarificationValidation = validateClarificationState(
    conversation.clarificationState,
  )
  if (!clarificationValidation.valid) {
    errors.push(...clarificationValidation.errors)
  }

  if (!Array.isArray(conversation.messages)) {
    errors.push('Conversation messages must be an array.')
  } else {
    const seenIds = new Set()
    conversation.messages.forEach((msg, index) => {
      const msgValidation = validateMessage(msg)
      if (!msgValidation.valid) {
        errors.push(`Message at index ${index} invalid: ${msgValidation.errors.join('; ')}`)
      }

      if (msg?.messageId) {
        if (seenIds.has(msg.messageId)) {
          errors.push(`Duplicate messageId "${msg.messageId}" at index ${index}.`)
        }
        seenIds.add(msg.messageId)
      }

      const expectedSequence = index + 1
      if (msg?.sequence !== expectedSequence) {
        errors.push(
          `Message sequence out of order at index ${index}: expected ${expectedSequence}, got ${msg?.sequence}.`,
        )
      }
    })
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}

export function validateConversationContext(conversationContext) {
  const errors = []
  if (!conversationContext || typeof conversationContext !== 'object') {
    return {
      errors: ['ConversationContext must be a valid object.'],
      valid: false,
    }
  }

  if (conversationContext.version !== CONVERSATION_CONTEXT_VERSION) {
    errors.push(
      `ConversationContext version must be "${CONVERSATION_CONTEXT_VERSION}".`,
    )
  }

  if (!conversationContext.topic || typeof conversationContext.topic !== 'object') {
    errors.push('ConversationContext must include a topic object.')
  } else if (
    !Object.values(CONVERSATION_TOPICS).includes(
      conversationContext.topic.current,
    )
  ) {
    errors.push(
      `ConversationContext topic.current "${conversationContext.topic.current}" is invalid.`,
    )
  }

  if (
    !conversationContext.clarification ||
    typeof conversationContext.clarification !== 'object'
  ) {
    errors.push('ConversationContext must include a clarification object.')
  } else {
    const clar = conversationContext.clarification
    if (typeof clar.required !== 'boolean') {
      errors.push('ConversationContext clarification.required must be a boolean.')
    }
    if (clar.required === false) {
      if (clar.reason !== null) {
        errors.push(
          'ConversationContext clarification.reason must be null when required is false.',
        )
      }
      if (!Array.isArray(clar.missingFields) || clar.missingFields.length > 0) {
        errors.push(
          'ConversationContext clarification.missingFields must be empty when required is false.',
        )
      }
    } else {
      if (!Object.values(CLARIFICATION_REASONS).includes(clar.reason)) {
        errors.push(
          `ConversationContext clarification.reason "${clar.reason}" is invalid.`,
        )
      }
      if (!Array.isArray(clar.missingFields)) {
        errors.push(
          'ConversationContext clarification.missingFields must be an array.',
        )
      } else {
        for (const field of clar.missingFields) {
          if (typeof field !== 'string' || field.trim().length === 0) {
            errors.push(
              'ConversationContext clarification.missingFields must contain non-empty strings.',
            )
          }
        }
      }
    }
  }

  if (!Array.isArray(conversationContext.recentMessages)) {
    errors.push('ConversationContext recentMessages must be an array.')
  } else {
    if (conversationContext.recentMessages.length > MAX_RECENT_MESSAGES) {
      errors.push(
        `ConversationContext recentMessages exceeds max length of ${MAX_RECENT_MESSAGES}.`,
      )
    }

    conversationContext.recentMessages.forEach((m, idx) => {
      if (!m || typeof m !== 'object') {
        errors.push(`Recent message at index ${idx} must be a valid object.`)
        return
      }
      if (!Object.values(MESSAGE_ROLES).includes(m.role)) {
        errors.push(
          `Recent message at index ${idx} has invalid role "${m.role}". Allowed: ${Object.values(MESSAGE_ROLES).join(', ')}.`,
        )
      }
      if (typeof m.content !== 'string') {
        errors.push(`Recent message at index ${idx} content must be a string.`)
      } else {
        if (m.content.trim().length === 0) {
          errors.push(
            `Recent message at index ${idx} content must not be empty or whitespace-only.`,
          )
        }
        if (m.content.length > MAX_MESSAGE_CHARACTERS) {
          errors.push(
            `Recent message at index ${idx} content exceeds max character limit of ${MAX_MESSAGE_CHARACTERS}.`,
          )
        }
      }
    })
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}
