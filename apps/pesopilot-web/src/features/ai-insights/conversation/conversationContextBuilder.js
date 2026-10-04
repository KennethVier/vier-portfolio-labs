import { CONVERSATION_TOPICS } from './topicTracker.js'

export const CONVERSATION_CONTEXT_VERSION = '1.0.0'
export const MAX_RECENT_MESSAGES = 10

export function buildConversationContext({ conversation } = {}) {
  if (!conversation || typeof conversation !== 'object') {
    throw new Error(
      'buildConversationContext requires a valid conversation object.',
    )
  }

  const rawMessages = Array.isArray(conversation.messages)
    ? conversation.messages
    : []

  const recentMessages = rawMessages
    .slice(-MAX_RECENT_MESSAGES)
    .map((m) =>
      Object.freeze({
        content: m?.content ?? '',
        role: m?.role ?? '',
      }),
    )

  return Object.freeze({
    clarification: Object.freeze({
      missingFields: Object.freeze(
        Array.isArray(conversation.clarificationState?.missingFields)
          ? [...conversation.clarificationState.missingFields]
          : [],
      ),
      reason: conversation.clarificationState?.reason ?? null,
      required: Boolean(conversation.clarificationState?.required),
    }),
    recentMessages: Object.freeze(recentMessages),
    topic: Object.freeze({
      current: conversation.topicState?.current ?? CONVERSATION_TOPICS.general,
    }),
    version: CONVERSATION_CONTEXT_VERSION,
  })
}
