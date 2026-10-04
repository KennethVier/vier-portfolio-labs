import { isValidTimestamp } from './conversationSession.js'

export const CONVERSATION_TOPICS = Object.freeze({
  cashflow: 'cashflow',
  cutoff: 'cutoff',
  expenses: 'expenses',
  general: 'general',
  goals: 'goals',
  health: 'health',
  income: 'income',
  recommendations: 'recommendations',
  savings: 'savings',
  summary: 'summary',
})

export function createTopicState({
  current = CONVERSATION_TOPICS.general,
  previous = null,
  updatedAt,
} = {}) {
  if (!updatedAt || typeof updatedAt !== 'string' || !isValidTimestamp(updatedAt)) {
    throw new Error('createTopicState requires a valid ISO-8601 updatedAt timestamp.')
  }
  if (!Object.values(CONVERSATION_TOPICS).includes(current)) {
    throw new Error(
      `Invalid topic "${current}". Allowed: ${Object.values(CONVERSATION_TOPICS).join(', ')}.`,
    )
  }
  if (previous !== null && !Object.values(CONVERSATION_TOPICS).includes(previous)) {
    throw new Error(
      `Invalid previous topic "${previous}". Allowed: ${Object.values(CONVERSATION_TOPICS).join(', ')}.`,
    )
  }

  return Object.freeze({
    current,
    previous,
    updatedAt,
  })
}

export function updateTopicState(topicState, { newTopic, updatedAt } = {}) {
  if (!topicState || typeof topicState !== 'object') {
    throw new Error('updateTopicState requires a valid topicState object.')
  }
  return createTopicState({
    current: newTopic,
    previous: topicState.current,
    updatedAt,
  })
}
