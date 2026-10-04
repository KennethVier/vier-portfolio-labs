import { createServiceCoordinator } from './serviceCoordinator.js'
import {
  getWorkflowTemplate,
  listWorkflowTemplates,
} from './workflowTemplates.js'
import { validateWorkflow } from './aiWorkflow.js'
import { validateWorkflowDiagnostics } from './workflowDiagnostics.js'

const defaultCoordinator = createServiceCoordinator()

export const aiOrchestrator = Object.freeze({
  name: 'ai-orchestrator',
  status: 'ready',

  executeWorkflow: (input) => defaultCoordinator.executeWorkflow(input),

  getWorkflowTemplate,
  listWorkflowTemplates,

  validateWorkflow,
  validateWorkflowDiagnostics,
})
