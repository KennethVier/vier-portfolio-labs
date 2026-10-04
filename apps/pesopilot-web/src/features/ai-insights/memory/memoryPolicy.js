import { CONVERSATION_TOPICS } from '../conversation/topicTracker.js'

export const MEMORY_TYPES = Object.freeze({
  communicationPreference: 'communication_preference',
  coachingPreference: 'coaching_preference',
  userPreference: 'user_preference',
})

export const ALLOWED_WORKFLOW_TYPES = Object.freeze([
  'financial-summary-explanation',
])

export const MEMORY_IMPORTANCES = Object.freeze({
  high: 'high',
  medium: 'medium',
  low: 'low',
})

export const DEFAULT_MEMORY_POLICY = Object.freeze({
  version: '1.0.0',
  allowedMemoryTypes: Object.freeze([
    MEMORY_TYPES.communicationPreference,
    MEMORY_TYPES.coachingPreference,
    MEMORY_TYPES.userPreference,
  ]),
  allowedSources: Object.freeze(['user']),
  allowedImportances: Object.freeze([
    MEMORY_IMPORTANCES.high,
    MEMORY_IMPORTANCES.medium,
    MEMORY_IMPORTANCES.low,
  ]),
  allowedTopics: Object.freeze(Object.values(CONVERSATION_TOPICS)),
  allowedWorkflowTypes: Object.freeze([...ALLOWED_WORKFLOW_TYPES]),
  maxContentLength: 300,
  maxRetrievedItems: 5,
  maxTotalContextChars: 1500,
  requireExplicitConfirmation: true,
})

export function getDefaultPolicy() {
  return DEFAULT_MEMORY_POLICY
}
