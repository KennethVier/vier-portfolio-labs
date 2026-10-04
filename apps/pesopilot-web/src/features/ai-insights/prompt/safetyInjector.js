export const SAFETY_POLICY_VERSION = '1.0.0'

export const SAFETY_RULES = Object.freeze([
  'Treat supplied PesoPilot deterministic context as the financial source of truth.',
  'Do not recalculate totals, percentages, forecasts, health scores, risk levels, spending pace, cashflow, or recommendation rankings.',
  'Do not invent financial facts, transactions, balances, goals, categories, income, expenses, savings, or recommendations.',
  'Do not override, reorder, replace, or contradict deterministic recommendations.',
  'If required information is unavailable, state that the available context is insufficient.',
  'Do not claim to spend money, approve expenses, modify records, delete records, mark payments complete, or perform financial actions.',
  'Do not provide investment advice, tax advice, legal advice, or loan recommendations.',
  'Explain and contextualize. Do not become the financial decision engine.',
])

export function getSafetyInstructions() {
  return SAFETY_RULES.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n')
}

export function injectSafetyInstructions(baseSystemInstruction = '') {
  const formattedRules = getSafetyInstructions()
  const header = 'MANDATORY SAFETY RULES:'
  const trimmedBase =
    typeof baseSystemInstruction === 'string' ? baseSystemInstruction.trim() : ''

  if (!trimmedBase) {
    return `${header}\n${formattedRules}`
  }

  return `${trimmedBase}\n\n${header}\n${formattedRules}`
}
