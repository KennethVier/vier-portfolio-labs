import { DOMAINS_ORDER } from './recommendationRuleConstants.js'

export function normalizeText(value, maxLength = 300) {
  if (value == null) return ''
  const str = String(value).replace(/\s+/g, ' ').trim()
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength)
}

export function formatRecommendation(recommendation) {
  if (!recommendation || typeof recommendation !== 'object') {
    return null
  }

  return {
    ...recommendation,
    title: normalizeText(recommendation.title, 150),
    explanation: normalizeText(recommendation.explanation, 300),
    evidence: Array.isArray(recommendation.evidence)
      ? recommendation.evidence.map((item) => ({
          label: normalizeText(item?.label, 100),
          value: item?.value,
          ruleId: item?.ruleId,
          ...(item?.description
            ? { description: normalizeText(item.description, 200) }
            : {}),
        }))
      : [],
  }
}

export function buildRecommendationGroups(recommendations = []) {
  const groups = {}
  for (const domain of DOMAINS_ORDER) {
    groups[domain] = []
  }

  for (const rec of recommendations) {
    if (rec?.domain && Array.isArray(groups[rec.domain])) {
      groups[rec.domain].push(rec.id)
    }
  }

  return groups
}
