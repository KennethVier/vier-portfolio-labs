// Luhn Checksum Algorithm for Payment Card Detection
export function isValidLuhn(numberString) {
  if (typeof numberString !== 'string') return false
  const digits = numberString.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10)
    if (Number.isNaN(digit)) return false
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

// 1. Prompt Injection Scanner
export function scanForPromptInjection(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { detected: false, reasonCodes: [], reasons: [] }
  }

  const reasonCodes = []
  const reasons = []

  // False-positive guard: pure explanatory question without active override
  const trimmed = text.trim()
  const isPureAcademicQuestion =
    /^(?:what (?:does|is|are)|explain (?:what|the (?:phrase|meaning of))|definition of|define)\b.*['"][^'"]+['"].*(?:means?|in security|refer to|\?)?$/i.test(trimmed)

  if (!isPureAcademicQuestion) {
    // Instruction Override
    const instructionOverridePattern =
      /(?:^|[.!?\n]\s*|\b(?:please\s+)?)(?:ignore|disregard|forget|override|cancel)\s+(?:all\s+)?(?:(?:previous|prior|above|system)\s*){1,2}(?:instructions|rules|prompts|directives)\b/i
    const jailbreakModePattern =
      /(?:you are now|act as|pretend to be)\s+(?:an? unrestricted|a jailbroken|dan|developer mode|root|admin)\b/i

    if (instructionOverridePattern.test(text)) {
      reasonCodes.push('PROMPT_INJECTION_INSTRUCTION_OVERRIDE')
      reasons.push('High-confidence instruction override attempt detected.')
    } else if (jailbreakModePattern.test(text)) {
      reasonCodes.push('PROMPT_INJECTION_ROLE_IMPERSONATION')
      reasons.push('High-confidence role impersonation / jailbreak mode switch detected.')
    }

    // System Exfiltration
    const exfiltrationPattern =
      /(?:repeat|print|output|display|show|reveal|leak|echo)\s+(?:all\s+)?(?:your\s+)?(?:system\s+(?:prompt|instructions|rules)|initial\s+prompt|developer\s+instructions)\b/i
    const exfiltrationQuestionPattern =
      /\b(?:what (?:are|is) your (?:(?:original|initial|system)\s*){1,2}(?:instructions|prompt|rules))\b/i

    if (exfiltrationPattern.test(text) || exfiltrationQuestionPattern.test(text)) {
      reasonCodes.push('PROMPT_EXFILTRATION_DETECTED')
      reasons.push('High-confidence prompt or system instruction exfiltration attempt detected.')
    }

    // Guardrail Bypass
    const bypassPattern =
      /(?:bypass|disable|turn off|ignore)\s+(?:all\s+)?(?:safety|guardrails?|filters?|rules?|checks?)\b/i
    const unrestrictedDirectivePattern =
      /\b(?:unrestricted mode|no rules mode|do anything now|filter off)\b/i

    if (bypassPattern.test(text) || unrestrictedDirectivePattern.test(text)) {
      reasonCodes.push('PROMPT_BYPASS_DETECTED')
      reasons.push('High-confidence guardrail or safety bypass attempt detected.')
    }

    // Role Impersonation / Fake Delimiters
    const fakeDelimitersPattern =
      /\[\s*(?:system|system instruction|developer)\s*\]|(?:^|\n)\s*<\|im_start\|>\s*(?:system|developer)|(?:^|\n)\s*(?:system|developer):\s/i

    if (fakeDelimitersPattern.test(text)) {
      reasonCodes.push('PROMPT_INJECTION_DELIMITER_IMPERSONATION')
      reasons.push('High-confidence system/developer role delimiter impersonation detected.')
    }

    // Provider / Config Manipulation
    const configOverridePattern =
      /(?:set|change|override)\s+(?:temperature|model|max_tokens|provider|endpoint|host)\s+to\b|\b(?:eval|exec)\s*\(/i

    if (configOverridePattern.test(text)) {
      reasonCodes.push('PROMPT_CONFIG_MANIPULATION')
      reasons.push('High-confidence provider runtime or configuration manipulation attempt detected.')
    }
  }

  return {
    detected: reasonCodes.length > 0,
    reasonCodes: Object.freeze(reasonCodes),
    reasons: Object.freeze(reasons),
  }
}

// 2. Sensitive Data & PII Scanner
export function scanForSensitiveData(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { detected: false, reasonCodes: [], reasons: [] }
  }

  const reasonCodes = []
  const reasons = []

  // Email pattern (RFC 5322 bounded)
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
  if (emailPattern.test(text)) {
    reasonCodes.push('SENSITIVE_DATA_EMAIL_DETECTED')
    reasons.push('Prohibited email address detected.')
  }

  // Formatted phone pattern (Must have separators or country prefix to avoid plain amounts like 50000 or 1200)
  const phonePattern = /(?:\+63|0)9\d{2}[-\s]?\d{3}[-\s]?\d{4}\b|\b\+1[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{4}\b|\b\d{3}-\d{3}-\d{4}\b/
  if (phonePattern.test(text)) {
    reasonCodes.push('SENSITIVE_DATA_PHONE_DETECTED')
    reasons.push('Prohibited phone number pattern detected.')
  }

  // Payment card pattern (13 to 19 digits with word boundaries or dashes/spaces)
  const potentialCardMatches = text.match(/\b(?:\d{4}[-\s]?){3}\d{1,4}\b|\b\d{13,19}\b/g)
  if (potentialCardMatches) {
    for (const match of potentialCardMatches) {
      if (isValidLuhn(match)) {
        reasonCodes.push('SENSITIVE_DATA_PAYMENT_CARD_DETECTED')
        reasons.push('Prohibited payment card number detected (Luhn validated).')
        break
      }
    }
  }

  // Bearer / Authorization token
  const bearerPattern = /(?:bearer\s+[a-z0-9_.-]{20,}|ghp_[a-z0-9]{36}|xox[baprs]-[a-z0-9_-]{20,})/i
  if (bearerPattern.test(text)) {
    reasonCodes.push('SENSITIVE_DATA_BEARER_TOKEN_DETECTED')
    reasons.push('Prohibited authorization/bearer token detected.')
  }

  // API Key / Private Key format
  const apiKeyPattern = /(?:-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|api[_-]?key\s*[:=]\s*['"][a-z0-9_-]{16,}['"])/i
  if (apiKeyPattern.test(text)) {
    reasonCodes.push('SENSITIVE_DATA_API_KEY_DETECTED')
    reasons.push('Prohibited private key or API credential pattern detected.')
  }

  // Password / Secret assignment
  const passwordPattern = /(?:password|passwd|secret)\s*[:=]\s*['"][^'"]{6,}['"]/i
  if (passwordPattern.test(text)) {
    reasonCodes.push('SENSITIVE_DATA_PASSWORD_DETECTED')
    reasons.push('Prohibited password or secret assignment pattern detected.')
  }

  return {
    detected: reasonCodes.length > 0,
    reasonCodes: Object.freeze(reasonCodes),
    reasons: Object.freeze(reasons),
  }
}

// 3. Action Claim Scanner (Unsupported Platform Mutation)
export function scanForActionClaims(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { detected: false, reasonCodes: [], reasons: [] }
  }

  const reasonCodes = []
  const reasons = []

  // Negation check: if the sentence explicitly states "I cannot transfer" or "cannot delete", don't reject
  const transferPattern = /(?:^|[.!?\n]\s*)I\s+(?:have\s+)?(?:transferred|sent|moved)\s+(?:the\s+|your\s+)?(?:[a-z0-9_-]+\s+)?(?:money|funds|pesos|php|\d+)/i
  const approvePattern = /(?:^|[.!?\n]\s*)I\s+(?:have\s+)?(?:approved|rejected|cleared)\s+(?:the\s+|your\s+)?(?:[a-z0-9_-]+\s+)?(?:payment|expense|transaction|expense report)/i
  const budgetMutationPattern = /(?:^|[.!?\n]\s*)I\s+(?:have\s+)?(?:changed|updated|adjusted|modified|set)\s+(?:the\s+|your\s+)?(?:[a-z0-9_-]+\s+)?(?:budget|savings goal|income|salary)/i
  const deletePattern = /(?:^|[.!?\n]\s*)I\s+(?:have\s+)?(?:deleted|removed|erased)\s+(?:the\s+|your\s+)?(?:[a-z0-9_-]+\s+)?(?:transaction|expense|record)/i

  // Verify not preceded by negation in the same clause
  function isActionClaim(pattern, str) {
    const match = str.match(pattern)
    if (!match) return false
    const matchIndex = match.index ?? 0
    const precedingSlice = str.slice(Math.max(0, matchIndex - 30), matchIndex).toLowerCase()
    if (/(?:cannot|can't|unable to|do not|did not|never|not able to)\s*$/.test(precedingSlice)) {
      return false
    }
    return true
  }

  if (isActionClaim(transferPattern, text)) {
    reasonCodes.push('ACTION_CLAIM_FUNDS_TRANSFER')
    reasons.push('Unsupported claim of funds transfer execution.')
  }

  if (isActionClaim(approvePattern, text)) {
    reasonCodes.push('ACTION_CLAIM_TRANSACTION_APPROVAL')
    reasons.push('Unsupported claim of transaction approval/rejection execution.')
  }

  if (isActionClaim(budgetMutationPattern, text)) {
    reasonCodes.push('ACTION_CLAIM_RECORD_MUTATION')
    reasons.push('Unsupported claim of budget/financial record mutation.')
  }

  if (isActionClaim(deletePattern, text)) {
    reasonCodes.push('ACTION_CLAIM_RECORD_DELETION')
    reasons.push('Unsupported claim of financial record deletion.')
  }

  return {
    detected: reasonCodes.length > 0,
    reasonCodes: Object.freeze(reasonCodes),
    reasons: Object.freeze(reasons),
  }
}

// 4. Financial Guidance Scanner (Regulated / High-Risk Advice)
export function scanForFinancialGuidanceViolations(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { detected: false, reasonCodes: [], reasons: [] }
  }

  const reasonCodes = []
  const reasons = []

  // Direct Security / Crypto Buy-Sell Directive
  const buySellPattern = /\b(?:buy|sell|short|trade)\s+(?:bitcoin|btc|ethereum|eth|crypto|shares?|stocks?|equities|securities)\b/i
  const investSpecificPattern = /\b(?:invest\s+in)\s+(?:bitcoin|crypto|tesla|smph|stocks?)\b/i
  if (buySellPattern.test(text) || investSpecificPattern.test(text)) {
    reasonCodes.push('FINANCIAL_INVESTMENT_DIRECTIVE')
    reasons.push('Direct investment or security buy/sell directive is prohibited.')
  }

  // Guaranteed Investment Return
  const guaranteedReturnPattern = /\b(?:guaranteed|risk[- ]free)\s+(?:[a-z0-9%]+\s+){0,2}(?:return|profit|yield|gain|outcome|money)\b|\b(?:return|yield|profit)\s+(?:is\s+)?guaranteed\b|\brisk[- ]free\b/i
  if (guaranteedReturnPattern.test(text)) {
    reasonCodes.push('FINANCIAL_GUARANTEED_RETURN')
    reasons.push('Claims of guaranteed financial returns or risk-free outcomes are prohibited.')
  }

  // Authoritative Tax Advice
  const taxAdvicePattern = /\b(?:claim|deduct)\s+this\s+(?:as a\s+)?(?:deduction\s+)?(?:on|in)\s+your\s+(?:bir|tax\s+return|taxes|tax\s+filing|form)\b|\bthis\s+is\s+(?:legally\s+)?tax[- ]exempt\s+under\b/i
  if (taxAdvicePattern.test(text)) {
    reasonCodes.push('FINANCIAL_TAX_ADVICE')
    reasons.push('Authoritative personalized tax advice is prohibited.')
  }

  // Authoritative Legal Advice
  const legalAdvicePattern = /\b(?:you\s+should|you\s+must)\s+file\s+for\s+bankruptcy\b|\bthis\s+constitutes\s+a\s+legal\s+breach\b/i
  if (legalAdvicePattern.test(text)) {
    reasonCodes.push('FINANCIAL_LEGAL_ADVICE')
    reasons.push('Authoritative legal advice is prohibited.')
  }

  // Specific Loan / Credit Product Recommendation
  const loanProductPattern = /\b(?:apply\s+for|take\s+out)\s+(?:a\s+)?(?:loan\s+with|credit\s+card\s+from)\s+[A-Za-z0-9]+\b|\b(?:recommend|suggest)\s+(?:applying for|taking)\s+(?:the\s+)?[A-Za-z0-9\s]+(?:loan|credit line)\b/i
  if (loanProductPattern.test(text)) {
    reasonCodes.push('FINANCIAL_LOAN_PRODUCT_ENDORSEMENT')
    reasons.push('Specific commercial loan or credit product recommendation is prohibited.')
  }

  return {
    detected: reasonCodes.length > 0,
    reasonCodes: Object.freeze(reasonCodes),
    reasons: Object.freeze(reasons),
  }
}
