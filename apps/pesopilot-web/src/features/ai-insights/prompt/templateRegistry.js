export const PROMPT_TEMPLATE_IDS = Object.freeze({
  financialSummaryExplanation: 'financial-summary-explanation',
})

const TEMPLATES = Object.freeze({
  [PROMPT_TEMPLATE_IDS.financialSummaryExplanation]: Object.freeze({
    id: PROMPT_TEMPLATE_IDS.financialSummaryExplanation,
    instruction:
      'Explain the supplied deterministic financial summary and recommendations in clear, concise language.\n\n' +
      'Use only the provided context.\n\n' +
      'Preserve the supplied financial values and recommendation ordering.\n\n' +
      'Do not perform new financial calculations.\n\n' +
      'Do not invent missing financial information.',
    purpose:
      'Explain the supplied deterministic financial position in clear language without altering financial truth.',
    task: 'financial-summary-explanation',
    version: '1.0.0',
  }),
})

export const PROMPT_TEMPLATES = TEMPLATES

export function getPromptTemplate(templateId) {
  if (!templateId || typeof templateId !== 'string') {
    throw new Error(
      `Invalid templateId: "${templateId}". Expected a non-empty string.`,
    )
  }

  const template = TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Unknown prompt template ID: "${templateId}".`)
  }

  return template
}
