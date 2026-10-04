import { injectSafetyInstructions } from './safetyInjector.js'

export const BASE_SYSTEM_ROLE =
  "You are PesoPilot's financial explanation assistant.\n\n" +
  'You explain deterministic financial intelligence produced by PesoPilot.\n\n' +
  "You are not the financial calculation engine and you must not replace or contradict PesoPilot's deterministic results."

export function composePrompts({
  baseSystemRole = BASE_SYSTEM_ROLE,
  context,
  template,
} = {}) {
  const systemPrompt = injectSafetyInstructions(baseSystemRole)
  const templateInstruction = template?.instruction ?? ''

  const conversationContext = context?.conversationContext ?? null
  const deterministicFinancialContext = { ...(context ?? {}) }
  delete deterministicFinancialContext.conversationContext
  delete deterministicFinancialContext.memoryContext

  const serializedFinancial = JSON.stringify(
    deterministicFinancialContext,
    null,
    2,
  )

  let userPrompt = `${templateInstruction}\n\nDETERMINISTIC_FINANCIAL_CONTEXT_JSON:\n${serializedFinancial}`

  if (conversationContext) {
    const serializedConversation = JSON.stringify(conversationContext, null, 2)
    userPrompt += `\n\nUNTRUSTED_CONVERSATION_CONTEXT_JSON:\n${serializedConversation}`
  }

  return {
    systemPrompt,
    userPrompt,
  }
}
