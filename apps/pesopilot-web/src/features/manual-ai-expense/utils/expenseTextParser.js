import { PAYMENT_METHODS } from '@/features/expenses/constants/expenseConstants.js'

export const MANUAL_AI_DETECTED_SOURCE = 'manual_ai_input'

const categoryNamesById = {
  bills: 'Bills',
  food: 'Food',
  groceries: 'Groceries',
  other: 'Other',
  shopping: 'Shopping',
  transport: 'Transport',
}

const merchantRules = [
  { pattern: /\bjollibee\b/i, merchant: 'Jollibee', categoryId: 'food' },
  {
    pattern: /\b(mcdo|mcdonald'?s)\b/i,
    merchant: 'McDonalds',
    categoryId: 'food',
  },
  { pattern: /\bstarbucks\b/i, merchant: 'Starbucks', categoryId: 'food' },
  { pattern: /\bgrab\b/i, merchant: 'Grab', categoryId: 'transport' },
  { pattern: /\bangkas\b/i, merchant: 'Angkas', categoryId: 'transport' },
  { pattern: /\bmove it\b/i, merchant: 'Move It', categoryId: 'transport' },
  { pattern: /\bmeralco\b/i, merchant: 'Meralco', categoryId: 'bills' },
  { pattern: /\bmaynilad\b/i, merchant: 'Maynilad', categoryId: 'bills' },
  { pattern: /\bshopee\b/i, merchant: 'Shopee', categoryId: 'shopping' },
  { pattern: /\blazada\b/i, merchant: 'Lazada', categoryId: 'shopping' },
  { pattern: /\b7-eleven\b/i, merchant: '7-Eleven', categoryId: 'groceries' },
  { pattern: /\bpuregold\b/i, merchant: 'Puregold', categoryId: 'groceries' },
  {
    pattern: /\bsm supermarket\b/i,
    merchant: 'SM Supermarket',
    categoryId: 'groceries',
  },
]

const paymentAliases = [
  { pattern: /\bgcash\b/i, value: 'GCash' },
  { pattern: /\bmaya\b/i, value: 'Maya' },
  { pattern: /\bcash\b/i, value: 'Cash' },
  { pattern: /\bdebit( card)?\b/i, value: 'Debit Card' },
  { pattern: /\bcredit( card)?\b/i, value: 'Credit Card' },
  { pattern: /\bbank transfer\b/i, value: 'Bank Transfer' },
  { pattern: /\b(bpi|bdo|unionbank|metrobank)\b/i, value: 'Bank Transfer' },
]

const monthNumbers = {
  april: 4,
  apr: 4,
  august: 8,
  aug: 8,
  december: 12,
  dec: 12,
  february: 2,
  feb: 2,
  january: 1,
  jan: 1,
  july: 7,
  jul: 7,
  june: 6,
  jun: 6,
  march: 3,
  mar: 3,
  may: 5,
  november: 11,
  nov: 11,
  october: 10,
  oct: 10,
  september: 9,
  sep: 9,
  sept: 9,
}

function toDateOnly(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseReferenceDate(referenceDate) {
  if (referenceDate instanceof Date) {
    return new Date(referenceDate)
  }

  const [year, month, day] = String(referenceDate)
    .split('-')
    .map((value) => Number(value))

  if (year && month && day) {
    return new Date(year, month - 1, day)
  }

  return new Date(referenceDate)
}

function toIsoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

function extractDate(rawText, referenceDate) {
  const text = rawText.toLowerCase()
  const reference = parseReferenceDate(referenceDate)

  const isoMatch = rawText.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    const date = toIsoDate(
      Number(isoMatch[1]),
      Number(isoMatch[2]),
      Number(isoMatch[3]),
    )
    if (date) {
      return { date, detected: true }
    }
  }

  const slashMatch = rawText.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/)
  if (slashMatch) {
    const date = toIsoDate(
      Number(slashMatch[3]),
      Number(slashMatch[1]),
      Number(slashMatch[2]),
    )
    if (date) {
      return { date, detected: true }
    }
  }

  const monthMatch = rawText.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:,\s*(20\d{2}))?\b/i,
  )
  if (monthMatch) {
    const date = toIsoDate(
      Number(monthMatch[3] ?? reference.getFullYear()),
      monthNumbers[monthMatch[1].toLowerCase()],
      Number(monthMatch[2]),
    )
    if (date) {
      return { date, detected: true }
    }
  }

  if (/\byesterday\b/.test(text)) {
    const yesterday = new Date(reference)
    yesterday.setDate(yesterday.getDate() - 1)
    return { date: toDateOnly(yesterday), detected: true }
  }

  if (/\bthe other day\b/.test(text)) {
    const otherDay = new Date(reference)
    otherDay.setDate(otherDay.getDate() - 2)
    return { date: toDateOnly(otherDay), detected: true }
  }

  if (/\btoday\b/.test(text)) {
    return { date: toDateOnly(reference), detected: true }
  }

  return { date: toDateOnly(reference), detected: false }
}

function sanitizeAmountText(rawText) {
  let sanitized = rawText
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}\/20\d{2}\b/g, ' ')

  merchantRules.forEach((rule) => {
    sanitized = sanitized.replace(rule.pattern, ' ')
  })

  return sanitized
}

function extractAmount(rawText) {
  const sanitized = sanitizeAmountText(rawText)
  const moneyPattern =
    /(?:â‚±|php\s*)?\b(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\b/gi
  const candidates = []
  let match = moneyPattern.exec(sanitized)

  while (match) {
    const value = Number(match[1].replaceAll(',', ''))
    const windowStart = Math.max(0, match.index - 24)
    const windowEnd = Math.min(sanitized.length, match.index + match[0].length + 24)
    const nearbyText = sanitized.slice(windowStart, windowEnd).toLowerCase()
    const beforeText = sanitized.slice(windowStart, match.index).toLowerCase()
    const afterText = sanitized
      .slice(match.index + match[0].length, windowEnd)
      .toLowerCase()
    const throughCandidateText = sanitized
      .slice(windowStart, match.index + match[0].length)
      .toLowerCase()
    const hasStrongCurrency = /â‚±|php/i.test(match[0])
    const hasPesoCurrency = /^\s*(?:peso|pesos)\b/.test(afterText)
    const hasExpenseContext =
      /\b(worth|for|cost|costing|spent|paid|bill|ride|order|groceries|lunch|coffee|snacks|bought)\b/.test(
        nearbyText,
      )
    const hasTenderContext =
      /\b(using|with|gave|tendered|cash tendered)\s*$/.test(beforeText) ||
      /\b(using|with|gave|tendered|cash tendered)\s+\d[\d,.]*\b/.test(
        throughCandidateText,
      ) ||
      /^\s*(?:peso|pesos)?\s*(?:cash|payment|change)\b/.test(afterText) ||
      /\bpaid\s+with\s*$/.test(beforeText)

    if (Number.isFinite(value) && value > 0) {
      candidates.push({
        isTender: hasTenderContext,
        score:
          (hasStrongCurrency ? 40 : 0) +
          (hasPesoCurrency ? 10 : 0) +
          (hasExpenseContext ? 30 : 0) -
          (hasTenderContext ? 80 : 0) +
          match.index / 1000,
        value,
      })
    }

    match = moneyPattern.exec(sanitized)
  }

  if (candidates.length === 0) {
    return null
  }

  const rankedCandidates = candidates.some((candidate) => !candidate.isTender)
    ? candidates.filter((candidate) => !candidate.isTender)
    : candidates

  rankedCandidates.sort((firstCandidate, secondCandidate) => {
    if (firstCandidate.score !== secondCandidate.score) {
      return secondCandidate.score - firstCandidate.score
    }
    return secondCandidate.value - firstCandidate.value
  })

  return rankedCandidates[0].value
}

function extractMerchant(rawText) {
  const knownRule = merchantRules.find((rule) => rule.pattern.test(rawText))
  if (knownRule) {
    return {
      categoryId: knownRule.categoryId,
      detected: true,
      merchant: knownRule.merchant,
    }
  }

  const phraseMatch = rawText.match(
    /\b(?:at|from|paid|bought|buy|coffee at|lunch at)\s+([a-z][a-z0-9 '&.-]{1,40}?)(?:\s+(?:for|using|today|yesterday|on|from|to|\d|php|₱)|$)/i,
  )
  const merchant = phraseMatch?.[1]?.trim()

  if (merchant) {
    return {
      categoryId: 'other',
      detected: true,
      merchant,
    }
  }

  return {
    categoryId: 'other',
    detected: false,
    merchant: 'Unknown Merchant',
  }
}

function guessFallbackCategory(rawText, currentCategoryId) {
  if (currentCategoryId !== 'other') {
    return currentCategoryId
  }

  if (/\b(grocer(?:y|ies)|supermarket|puregold)\b/i.test(rawText)) {
    return 'groceries'
  }

  if (/\b(lunch|dinner|breakfast|coffee|snacks|food)\b/i.test(rawText)) {
    return 'food'
  }

  if (/\b(ride|jeepney|tricycle|transport|fare)\b/i.test(rawText)) {
    return 'transport'
  }

  if (/\b(bill|electric|water|internet|utilities)\b/i.test(rawText)) {
    return 'bills'
  }

  if (/\b(order|shopping|shop)\b/i.test(rawText)) {
    return 'shopping'
  }

  return currentCategoryId
}

function extractPaymentMethod(rawText) {
  const alias = paymentAliases.find((paymentAlias) =>
    paymentAlias.pattern.test(rawText),
  )

  if (alias && PAYMENT_METHODS.includes(alias.value)) {
    return alias.value
  }

  return ''
}

function buildConfidence({
  amount,
  categoryDetected,
  dateDetected,
  merchantDetected,
}) {
  const confidence =
    0.4 +
    (amount ? 0.2 : 0) +
    (merchantDetected ? 0.2 : 0) +
    (dateDetected ? 0.1 : 0) +
    (categoryDetected ? 0.1 : 0)

  return Math.min(1, Math.max(0, Number(confidence.toFixed(2))))
}

export function parseExpenseText(rawText, options = {}) {
  const input = String(rawText ?? '').trim()
  const referenceDate = options.referenceDate ?? new Date()
  const warnings = []

  const amount = extractAmount(input)
  const dateResult = extractDate(input, referenceDate)
  const merchantResult = extractMerchant(input)
  const suggestedPaymentMethod = extractPaymentMethod(input)
  const suggestedCategoryId = guessFallbackCategory(
    input,
    merchantResult.categoryId ?? 'other',
  )
  const categoryDetected = suggestedCategoryId !== 'other'

  if (!amount) {
    warnings.push('Could not confidently detect amount.')
  }

  if (!merchantResult.detected) {
    warnings.push('Could not confidently detect merchant.')
  }

  if (!suggestedPaymentMethod) {
    warnings.push('Could not detect payment method.')
  }

  if (!dateResult.detected) {
    warnings.push('Could not confidently detect date. Using today as fallback.')
  }

  if (!categoryDetected) {
    warnings.push('Could not confidently guess category.')
  }

  return {
    amount,
    categoryName: categoryNamesById[suggestedCategoryId] ?? 'Other',
    confidence: buildConfidence({
      amount,
      categoryDetected,
      dateDetected: dateResult.detected,
      merchantDetected: merchantResult.detected,
    }),
    detectedSource: MANUAL_AI_DETECTED_SOURCE,
    merchant: merchantResult.merchant,
    note: '',
    rawText: input,
    suggestedCategoryId,
    suggestedPaymentMethod,
    transactionDate: dateResult.date,
    warnings,
  }
}

export const expenseTextParserInternals = {
  extractAmount,
  extractDate,
  extractMerchant,
  extractPaymentMethod,
}
