import { selectPromptContext } from './contextSelector.js'
import { composePrompts } from './promptComposer.js'
import { createPromptPackage } from './promptPackage.js'
import { validatePromptPackage } from './promptValidator.js'
import {
  getPromptTemplate,
  PROMPT_TEMPLATE_IDS,
} from './templateRegistry.js'

export function buildPromptPackage({
  conversationContext = null,
  financialSummary,
  insightBundle,
  recommendationBundle,
  templateId = PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
} = {}) {
  if (!insightBundle || typeof insightBundle !== 'object') {
    throw new Error(
      'buildPromptPackage requires a valid insightBundle object.',
    )
  }
  if (!recommendationBundle || typeof recommendationBundle !== 'object') {
    throw new Error(
      'buildPromptPackage requires a valid recommendationBundle object.',
    )
  }
  if (!financialSummary || typeof financialSummary !== 'object') {
    throw new Error(
      'buildPromptPackage requires a valid financialSummary object.',
    )
  }

  const template = getPromptTemplate(templateId)

  const context = selectPromptContext({
    conversationContext,
    financialSummary,
    insightBundle,
    recommendationBundle,
  })

  const { systemPrompt, userPrompt } = composePrompts({
    context,
    template,
  })

  const promptPackage = createPromptPackage({
    context,
    systemPrompt,
    task: template.task,
    template: {
      id: template.id,
      version: template.version,
    },
    userPrompt,
  })

  const validation = validatePromptPackage(promptPackage)
  if (!validation.valid) {
    throw new Error(
      `PromptPackage validation failed: ${validation.errors.join('; ')}`,
    )
  }

  return promptPackage
}

export const promptBuilder = Object.freeze({
  build: buildPromptPackage,
  name: 'prompt-builder',
  status: 'ready',
})
