export const GUARDRAIL_POLICY_VERSION = '1.0.0'

export const ALLOWED_ORCHESTRATION_INPUT_FIELDS = Object.freeze(new Set([
  'templateId',
  'insightBundle',
  'recommendationBundle',
  'financialSummary',
  'conversationContext',
  'memoryState',
  'provider',
  'workflowId',
]))

export const ALLOWED_PROVIDER_FIELDS = Object.freeze(new Set([
  'id',
  'model',
  'config',
]))

export const ALLOWED_PROVIDER_CONFIG_FIELDS = Object.freeze(new Set([
  'baseUrl',
  'transportTimeoutMs',
]))

export const DEFAULT_GUARDRAIL_POLICY = Object.freeze({
  version: GUARDRAIL_POLICY_VERSION,
  supportedWorkflows: Object.freeze([
    'financial-summary-explanation',
    'recommendation-explanation',
    'cutoff-spending-explanation',
  ]),
  supportedProviders: Object.freeze(['ollama']),
  allowedLocalities: Object.freeze(['local']),
  maxPromptLength: 16000,
  maxResponseLength: 5000,
  maxConversationMessages: 50,
  maxConversationMessageLength: 2000,
  maxMemoryItems: 5,
  maxMemoryItemLength: 500,
})
