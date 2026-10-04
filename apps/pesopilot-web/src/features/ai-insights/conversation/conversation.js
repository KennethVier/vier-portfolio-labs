import {
  closeSession,
  createSession,
  isValidTimestamp,
  SESSION_STATUSES,
} from './conversationSession.js'
import { createMessage } from './conversationMessage.js'
import {
  CONVERSATION_TOPICS,
  createTopicState,
  updateTopicState,
} from './topicTracker.js'
import {
  createClarificationState,
  requestClarificationState,
  resolveClarificationState,
} from './clarificationManager.js'

export const CONVERSATION_VERSION = '1.0.0'

export function createConversation({
  clarificationState,
  conversationId,
  createdAt,
  messages = [],
  session,
  topicState,
  updatedAt,
  version = CONVERSATION_VERSION,
} = {}) {
  if (version !== CONVERSATION_VERSION) {
    throw new Error(`Conversation version must be "${CONVERSATION_VERSION}".`)
  }
  if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length === 0) {
    throw new Error('createConversation requires a non-empty conversationId string.')
  }
  if (!session || typeof session !== 'object') {
    throw new Error('createConversation requires a valid session object.')
  }
  if (!topicState || typeof topicState !== 'object') {
    throw new Error('createConversation requires a valid topicState object.')
  }
  if (!clarificationState || typeof clarificationState !== 'object') {
    throw new Error('createConversation requires a valid clarificationState object.')
  }
  if (!createdAt || typeof createdAt !== 'string' || !isValidTimestamp(createdAt)) {
    throw new Error('createConversation requires a valid ISO-8601 createdAt timestamp.')
  }
  if (!updatedAt || typeof updatedAt !== 'string' || !isValidTimestamp(updatedAt)) {
    throw new Error('createConversation requires a valid ISO-8601 updatedAt timestamp.')
  }
  if (!Array.isArray(messages)) {
    throw new Error('createConversation messages must be an array.')
  }

  return Object.freeze({
    clarificationState,
    conversationId,
    createdAt,
    messages: Object.freeze([...messages]),
    session,
    topicState,
    updatedAt,
    version,
  })
}

export function startConversation({
  conversationId,
  createdAt,
  topic = CONVERSATION_TOPICS.general,
} = {}) {
  if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length === 0) {
    throw new Error('startConversation requires a non-empty conversationId string.')
  }
  if (!createdAt || typeof createdAt !== 'string' || !isValidTimestamp(createdAt)) {
    throw new Error('startConversation requires a valid ISO-8601 createdAt timestamp.')
  }

  const session = createSession({
    startedAt: createdAt,
    status: SESSION_STATUSES.active,
  })

  const topicState = createTopicState({
    current: topic,
    previous: null,
    updatedAt: createdAt,
  })

  const clarificationState = createClarificationState({
    required: false,
  })

  return createConversation({
    clarificationState,
    conversationId,
    createdAt,
    messages: [],
    session,
    topicState,
    updatedAt: createdAt,
  })
}

export function appendConversationMessage(conversation, {
  content,
  createdAt,
  messageId,
  role,
} = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error('appendConversationMessage requires a valid conversation object.')
  }
  if (conversation.session?.status === SESSION_STATUSES.closed) {
    throw new Error('Cannot append message to a closed conversation.')
  }

  const existingMessages = Array.isArray(conversation.messages) ? conversation.messages : []
  const hasDuplicateId = existingMessages.some((m) => m.messageId === messageId)
  if (hasDuplicateId) {
    throw new Error(`Duplicate messageId "${messageId}" in conversation messages.`)
  }

  const nextSequence = existingMessages.length + 1
  const message = createMessage({
    content,
    createdAt,
    messageId,
    role,
    sequence: nextSequence,
  })

  return createConversation({
    ...conversation,
    messages: [...existingMessages, message],
    updatedAt: createdAt,
  })
}

export function updateConversationTopic(conversation, {
  topic,
  updatedAt,
} = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error('updateConversationTopic requires a valid conversation object.')
  }
  if (conversation.session?.status === SESSION_STATUSES.closed) {
    throw new Error('Cannot update topic of a closed conversation.')
  }

  const nextTopicState = updateTopicState(conversation.topicState, {
    newTopic: topic,
    updatedAt,
  })

  return createConversation({
    ...conversation,
    topicState: nextTopicState,
    updatedAt,
  })
}

export function requestConversationClarification(conversation, {
  missingFields = [],
  reason,
  updatedAt,
} = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error('requestConversationClarification requires a valid conversation object.')
  }
  if (conversation.session?.status === SESSION_STATUSES.closed) {
    throw new Error('Cannot request clarification on a closed conversation.')
  }
  if (!updatedAt || typeof updatedAt !== 'string' || !isValidTimestamp(updatedAt)) {
    throw new Error('requestConversationClarification requires a valid ISO-8601 updatedAt timestamp.')
  }

  const nextClarificationState = requestClarificationState({
    missingFields,
    reason,
  })

  return createConversation({
    ...conversation,
    clarificationState: nextClarificationState,
    updatedAt,
  })
}

export function resolveConversationClarification(conversation, {
  updatedAt,
} = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error('resolveConversationClarification requires a valid conversation object.')
  }
  if (conversation.session?.status === SESSION_STATUSES.closed) {
    throw new Error('Cannot resolve clarification on a closed conversation.')
  }
  if (!updatedAt || typeof updatedAt !== 'string' || !isValidTimestamp(updatedAt)) {
    throw new Error('resolveConversationClarification requires a valid ISO-8601 updatedAt timestamp.')
  }

  const nextClarificationState = resolveClarificationState()

  return createConversation({
    ...conversation,
    clarificationState: nextClarificationState,
    updatedAt,
  })
}

export function closeConversation(conversation, {
  endedAt,
} = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error('closeConversation requires a valid conversation object.')
  }
  if (conversation.session?.status === SESSION_STATUSES.closed) {
    throw new Error('Conversation is already closed.')
  }

  const nextSession = closeSession(conversation.session, { endedAt })

  return createConversation({
    ...conversation,
    session: nextSession,
    updatedAt: endedAt,
  })
}
