export const MERCHANT_MATCH_TYPES = {
  contains: 'contains',
  exact: 'exact',
}

export const MERCHANT_RULE_SOURCES = {
  default: 'default',
  user: 'user',
}

export const CATEGORY_SOURCES = {
  manualOverride: 'manual_override',
  merchantRule: 'merchant_rule',
  parserGuess: 'parser_guess',
  unknown: 'unknown',
}

export function normalizeMerchantText(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function getRuleKeyword(rule) {
  return rule?.keyword ?? rule?.merchantPattern ?? ''
}

function getMatchType(rule) {
  return rule?.matchType === MERCHANT_MATCH_TYPES.exact
    ? MERCHANT_MATCH_TYPES.exact
    : MERCHANT_MATCH_TYPES.contains
}

function doesRuleMatch(merchant, rule) {
  const normalizedMerchant = normalizeMerchantText(merchant)
  const normalizedKeyword = normalizeMerchantText(getRuleKeyword(rule))

  if (!normalizedMerchant || !normalizedKeyword) {
    return false
  }

  if (getMatchType(rule) === MERCHANT_MATCH_TYPES.exact) {
    return normalizedMerchant === normalizedKeyword
  }

  return normalizedMerchant.includes(normalizedKeyword)
}

function compareMatchedRules(firstRule, secondRule) {
  const firstPriority = Number(firstRule.priority ?? 0)
  const secondPriority = Number(secondRule.priority ?? 0)

  if (firstPriority !== secondPriority) {
    return secondPriority - firstPriority
  }

  const firstIsExact = getMatchType(firstRule) === MERCHANT_MATCH_TYPES.exact
  const secondIsExact = getMatchType(secondRule) === MERCHANT_MATCH_TYPES.exact

  if (firstIsExact !== secondIsExact) {
    return firstIsExact ? -1 : 1
  }

  const firstLength = normalizeMerchantText(getRuleKeyword(firstRule)).length
  const secondLength = normalizeMerchantText(getRuleKeyword(secondRule)).length

  if (firstLength !== secondLength) {
    return secondLength - firstLength
  }

  return Number(firstRule.__ruleOrder ?? 0) - Number(secondRule.__ruleOrder ?? 0)
}

export function matchMerchantRule(merchant, rules = []) {
  const matches = rules
    .map((rule, index) => ({ ...rule, __ruleOrder: index }))
    .filter((rule) => doesRuleMatch(merchant, rule))
    .sort(compareMatchedRules)

  const matchedRule = matches[0]

  if (!matchedRule) {
    return {
      categoryId: null,
      confidence: 0,
      matched: false,
      merchantRuleId: null,
      rule: null,
      source: 'unknown',
    }
  }

  const matchType = getMatchType(matchedRule)

  return {
    categoryId: matchedRule.categoryId,
    confidence: matchType === MERCHANT_MATCH_TYPES.exact ? 0.95 : 0.9,
    matched: true,
    merchantRuleId: matchedRule.id ?? null,
    rule: matchedRule,
    source: 'merchant_rule',
  }
}

export const merchantRuleMatcherInternals = {
  compareMatchedRules,
  doesRuleMatch,
  getRuleKeyword,
}
