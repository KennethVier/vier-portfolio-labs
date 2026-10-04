import { PROMPT_PACKAGE_VERSION } from './promptPackage.js'
import { PROMPT_TEMPLATE_IDS } from './templateRegistry.js'

const REQUIRED_INSIGHT_DOMAINS = [
  'health',
  'income',
  'expenses',
  'savings',
  'goals',
  'cashflow',
  'cutoff',
]

const KNOWN_TEMPLATE_IDS = new Set(Object.values(PROMPT_TEMPLATE_IDS))

export function validatePromptPackage(promptPackage) {
  const errors = []

  if (!promptPackage || typeof promptPackage !== 'object') {
    return {
      errors: ['PromptPackage must be a valid object.'],
      valid: false,
    }
  }

  // Version
  if (promptPackage.version !== PROMPT_PACKAGE_VERSION) {
    errors.push(`PromptPackage version must be "${PROMPT_PACKAGE_VERSION}".`)
  }

  // Template
  if (!promptPackage.template || typeof promptPackage.template !== 'object') {
    errors.push('PromptPackage must include a template object.')
  } else {
    if (
      !promptPackage.template.id ||
      typeof promptPackage.template.id !== 'string'
    ) {
      errors.push('Template must have a valid id string.')
    } else if (!KNOWN_TEMPLATE_IDS.has(promptPackage.template.id)) {
      errors.push(
        `Template id "${promptPackage.template.id}" is not registered in template registry.`,
      )
    }

    if (
      !promptPackage.template.version ||
      typeof promptPackage.template.version !== 'string'
    ) {
      errors.push('Template must have a valid version string.')
    }
  }

  // Task
  if (
    !promptPackage.task ||
    typeof promptPackage.task !== 'string' ||
    promptPackage.task.trim() === ''
  ) {
    errors.push('PromptPackage must have a non-empty task string.')
  }

  // Prompts
  if (
    !promptPackage.systemPrompt ||
    typeof promptPackage.systemPrompt !== 'string' ||
    promptPackage.systemPrompt.trim() === ''
  ) {
    errors.push('PromptPackage must have a non-empty systemPrompt string.')
  }

  if (
    !promptPackage.userPrompt ||
    typeof promptPackage.userPrompt !== 'string' ||
    promptPackage.userPrompt.trim() === ''
  ) {
    errors.push('PromptPackage must have a non-empty userPrompt string.')
  }

  // Metadata
  if (!promptPackage.metadata || typeof promptPackage.metadata !== 'object') {
    errors.push('PromptPackage must include a metadata object.')
  } else {
    if (promptPackage.metadata.language !== 'en') {
      errors.push('Metadata language must be "en".')
    }
    if (promptPackage.metadata.contextVersion !== '1.0.0') {
      errors.push('Metadata contextVersion must be "1.0.0".')
    }
    if (promptPackage.metadata.safetyVersion !== '1.0.0') {
      errors.push('Metadata safetyVersion must be "1.0.0".')
    }
  }

  // Context
  const context = promptPackage.context
  if (!context || typeof context !== 'object') {
    errors.push('PromptPackage must include a context object.')
  } else {
    if (!context.version || typeof context.version !== 'string') {
      errors.push('Context must include a valid version string.')
    }
    if (typeof context.scope !== 'string') {
      errors.push('Context must include a scope string.')
    }
    if (
      !context.sourceTimestamps ||
      typeof context.sourceTimestamps !== 'object'
    ) {
      errors.push('Context must include a sourceTimestamps object.')
    }
    if (
      !context.financialSummary ||
      typeof context.financialSummary !== 'object'
    ) {
      errors.push('Context must include a financialSummary object.')
    }
    if (!Array.isArray(context.recommendations)) {
      errors.push('Context recommendations must be an array.')
    }

    if (!context.insights || typeof context.insights !== 'object') {
      errors.push('Context must include an insights object.')
    } else {
      for (const domain of REQUIRED_INSIGHT_DOMAINS) {
        if (!(domain in context.insights)) {
          errors.push(
            `Context insights missing required domain key: "${domain}".`,
          )
        }
      }
    }

    if (context.conversationContext !== null) {
      errors.push('Context conversationContext must be null in Phase 11B.1.')
    }
    if (context.memoryContext !== null) {
      errors.push('Context memoryContext must be null in Phase 11B.1.')
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}
