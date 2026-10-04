import {
  WORKFLOW_ERROR_CODES,
  WorkflowError,
} from './workflowErrors.js'

export const WORKFLOW_TEMPLATE_VERSION = '1.0.0'

export const WORKFLOW_TEMPLATE_IDS = Object.freeze({
  financialSummaryExplanation: 'financial-summary-explanation',
})

const TEMPLATES = Object.freeze({
  [WORKFLOW_TEMPLATE_IDS.financialSummaryExplanation]: Object.freeze({
    id: WORKFLOW_TEMPLATE_IDS.financialSummaryExplanation,
    version: WORKFLOW_TEMPLATE_VERSION,
    task: 'financial-summary-explanation',
    promptTemplateId: 'financial-summary-explanation',
  }),
})

export function getWorkflowTemplate(templateId) {
  if (typeof templateId !== 'string' || !templateId.trim()) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.UNKNOWN_WORKFLOW_TEMPLATE,
      message: `Invalid workflow template ID: "${templateId}". Expected a non-empty string.`,
    })
  }

  const template = TEMPLATES[templateId.trim()]
  if (!template) {
    throw new WorkflowError({
      code: WORKFLOW_ERROR_CODES.UNKNOWN_WORKFLOW_TEMPLATE,
      message: `Unknown workflow template: "${templateId}".`,
      templateId,
    })
  }

  return template
}

export function listWorkflowTemplates() {
  return Object.freeze(Object.values(TEMPLATES))
}
