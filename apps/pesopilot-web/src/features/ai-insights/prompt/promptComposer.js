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
  const serializedContext = JSON.stringify(context, null, 2)
  const userPrompt = `${templateInstruction}\n\nDETERMINISTIC_CONTEXT_JSON:\n${serializedContext}`

  return {
    systemPrompt,
    userPrompt,
  }
}
