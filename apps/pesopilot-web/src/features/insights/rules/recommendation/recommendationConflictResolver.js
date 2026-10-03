import { getInsightPriorityWeight } from '../../utils/insightPriority.js'
import {
  CONTRADICTION_RULES,
  DOMAINS_ORDER,
  SEVERITY_WEIGHT,
} from './recommendationRuleConstants.js'

export function compareRecommendations(a, b) {
  // 1. Severity descending
  const sevDiff =
    (SEVERITY_WEIGHT[b?.severity] ?? 0) - (SEVERITY_WEIGHT[a?.severity] ?? 0)
  if (sevDiff !== 0) return sevDiff

  // 2. Priority descending
  const prioDiff =
    getInsightPriorityWeight(b?.priority) - getInsightPriorityWeight(a?.priority)
  if (prioDiff !== 0) return prioDiff

  // 3. Deterministic domain order
  const domainAIndex = DOMAINS_ORDER.indexOf(a?.domain)
  const domainBIndex = DOMAINS_ORDER.indexOf(b?.domain)
  const resolvedDomainA =
    domainAIndex === -1 ? DOMAINS_ORDER.length : domainAIndex
  const resolvedDomainB =
    domainBIndex === -1 ? DOMAINS_ORDER.length : domainBIndex
  if (resolvedDomainA !== resolvedDomainB) {
    return resolvedDomainA - resolvedDomainB
  }

  // 4. ID ascending using code-unit comparison
  const idA = String(a?.id ?? '')
  const idB = String(b?.id ?? '')
  if (idA < idB) return -1
  if (idA > idB) return 1
  return 0
}

export function resolveRecommendationConflicts(candidates = []) {
  // Step 1: Validate evidence and sourceRuleIds
  const validCandidates = []
  for (const item of candidates) {
    if (
      item &&
      typeof item === 'object' &&
      Array.isArray(item.evidence) &&
      item.evidence.length > 0 &&
      Array.isArray(item.sourceRuleIds) &&
      item.sourceRuleIds.length > 0
    ) {
      validCandidates.push(item)
    }
  }

  const suppressed = []

  // Step 2: Explicit contradiction handling
  // Sort candidates first so highest-ranking winner triggers contradiction
  const sortedCandidates = [...validCandidates].sort(compareRecommendations)
  const contradictedIds = new Set()

  for (const rule of CONTRADICTION_RULES) {
    const winner = sortedCandidates.find(
      (c) =>
        rule.winnerActionKeys.includes(c.actionKey) &&
        (SEVERITY_WEIGHT[c.severity] ?? 0) >=
          (SEVERITY_WEIGHT[rule.winnerMinSeverity] ?? 0),
    )

    if (winner) {
      for (const candidate of sortedCandidates) {
        if (
          rule.loserActionKeys.includes(candidate.actionKey) &&
          !contradictedIds.has(candidate.id)
        ) {
          contradictedIds.add(candidate.id)
          suppressed.push({
            id: candidate.id,
            actionKey: candidate.actionKey,
            domain: candidate.domain,
            reason: rule.reason,
            sourceRuleIds: candidate.sourceRuleIds,
            evidence: candidate.evidence,
            suppressedBy: winner.id,
          })
        }
      }
    }
  }

  const nonContradicted = sortedCandidates.filter(
    (c) => !contradictedIds.has(c.id),
  )

  // Step 3: Deduplicate by actionKey
  const actionGroups = new Map()
  for (const item of nonContradicted) {
    const group = actionGroups.get(item.actionKey) ?? []
    group.push(item)
    actionGroups.set(item.actionKey, group)
  }

  const winners = []
  for (const [, group] of actionGroups) {
    group.sort(compareRecommendations)
    const winner = group[0]
    winners.push(winner)

    for (let i = 1; i < group.length; i++) {
      const loser = group[i]
      suppressed.push({
        id: loser.id,
        actionKey: loser.actionKey,
        domain: loser.domain,
        reason: 'duplicate_action',
        sourceRuleIds: loser.sourceRuleIds,
        evidence: loser.evidence,
        suppressedBy: winner.id,
      })
    }
  }

  // Step 4: Final deterministic sort
  winners.sort(compareRecommendations)

  // Step 5: Assign rank
  const rankedRecommendations = winners.map((rec, index) => ({
    ...rec,
    rank: index + 1,
  }))

  return {
    recommendations: rankedRecommendations,
    suppressed,
  }
}
