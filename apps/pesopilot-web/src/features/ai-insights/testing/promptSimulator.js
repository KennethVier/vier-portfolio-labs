import {
  promptBuilder as defaultPromptBuilder,
  buildPromptPackage,
} from '../prompt/promptBuilder.js'
import { validatePromptPackage } from '../prompt/promptValidator.js'
import { PROMPT_TEMPLATE_IDS } from '../prompt/templateRegistry.js'

export function createPromptSimulator({
  promptBuilder = defaultPromptBuilder,
} = {}) {
  function simulatePrompt({
    insightBundle,
    recommendationBundle,
    financialSummary,
    conversationContext = null,
    memoryContext = null,
    templateId = PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
  } = {}) {
    const builderFn = typeof promptBuilder.build === 'function'
      ? promptBuilder.build
      : buildPromptPackage

    const promptPackage = builderFn({
      insightBundle,
      recommendationBundle,
      financialSummary,
      conversationContext,
      memoryContext,
      templateId,
    })

    const validation = validatePromptPackage(promptPackage)

    return Object.freeze({
      promptPackage,
      validation,
      context: promptPackage.context,
      systemPrompt: promptPackage.systemPrompt,
      userPrompt: promptPackage.userPrompt,
      template: promptPackage.template,
      task: promptPackage.task,
    })
  }

  return Object.freeze({
    simulatePrompt,
    build: simulatePrompt,
  })
}
