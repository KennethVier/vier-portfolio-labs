import {
  createSummaryParagraph,
  createSummarySection,
} from '../models/summarySection.js'
import {
  CANONICAL_SECTION_ORDER,
  DOMAINS_ORDER,
  NARRATIVE_TONES,
  SECTION_CAPS,
  SEVERITY_WEIGHT,
  SUMMARY_SECTION_TITLES,
  SUMMARY_SECTION_TYPES,
} from './summaryConstants.js'
import { renderTemplate } from './templateRegistry.js'

const POSITION_ORDER = Object.freeze([
  'position.cash',
  'position.income',
  'position.expenses',
  'position.savingsRate',
  'position.topCategory',
  'position.pace',
  'position.goals',
  'position.health',
])

function getSeverityWeight(severity) {
  if (
    severity &&
    Object.prototype.hasOwnProperty.call(SEVERITY_WEIGHT, severity)
  ) {
    return SEVERITY_WEIGHT[severity]
  }
  return -1
}

function getDomainOrder(domain) {
  const index = DOMAINS_ORDER.indexOf(domain)
  return index >= 0 ? index : 999
}

function compareStrings(a, b) {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function determineTone(candidates) {
  const hasCriticalRisk = candidates.some(
    (c) =>
      c.sectionType === 'risks' &&
      (c.severity === 'critical' ||
        c.key === 'risk_cashflow_negative' ||
        (c.key === 'risk_health_status' &&
          (c.variables?.healthStatus === 'Critical' ||
            c.variables?.healthStatus === 'Needs Attention'))),
  )

  if (hasCriticalRisk) {
    return NARRATIVE_TONES.attention
  }

  const hasStableSignal = candidates.some(
    (c) =>
      c.key === 'positive_cashflow_position' ||
      c.key === 'positive_health_status' ||
      (c.key === 'position_health' &&
        (c.variables?.healthStatus === 'Healthy' ||
          c.variables?.healthStatus === 'Excellent')),
  )

  if (hasStableSignal) {
    return NARRATIVE_TONES.stable
  }

  return NARRATIVE_TONES.neutral
}

function buildParagraphFromCandidate(candidate, omitted) {
  const text = renderTemplate(candidate.templateId, candidate.variables)
  if (text == null) {
    omitted.push({ key: candidate.key, reason: 'missing_data' })
    return null
  }

  return createSummaryParagraph({
    evidence: candidate.evidence ?? [],
    horizon: candidate.horizon ?? 'current',
    key: candidate.key,
    relatedInsights: candidate.relatedInsights ?? [],
    relatedRecommendations: candidate.relatedRecommendations ?? [],
    templateId: candidate.templateId,
    text,
    variables: candidate.variables ?? {},
  })
}

export function composeNarrative({ candidates = [] }) {
  const omitted = []

  // Split candidates by sectionType
  const byType = {
    currentPosition: [],
    highlights: [],
    positiveObservations: [],
    priorityActions: [],
    risks: [],
  }

  for (const c of candidates) {
    if (byType[c.sectionType]) {
      byType[c.sectionType].push(c)
    }
  }

  // 1. Filter and Rank Risks
  // Sort: explicit severity descending, then domain order ascending, then key ascending
  byType.risks.sort((a, b) => {
    const wA = getSeverityWeight(a.severity)
    const wB = getSeverityWeight(b.severity)
    if (wA !== wB) return wB - wA

    const domA = getDomainOrder(a.domain)
    const domB = getDomainOrder(b.domain)
    if (domA !== domB) return domA - domB

    return compareStrings(a.key, b.key)
  })

  const selectedRisks = []
  const seenRiskSubjects = new Set()
  for (const r of byType.risks) {
    if (seenRiskSubjects.has(r.subject)) {
      omitted.push({ key: r.key, reason: 'duplicate' })
      continue
    }
    if (selectedRisks.length >= SECTION_CAPS.risks) {
      omitted.push({ key: r.key, reason: 'cap' })
      continue
    }
    seenRiskSubjects.add(r.subject)
    selectedRisks.push(r)
  }

  const riskSubjects = new Set(selectedRisks.map((r) => r.subject))

  // 2. Filter and Rank Highlights
  byType.highlights.sort((a, b) => {
    const domA = getDomainOrder(a.domain)
    const domB = getDomainOrder(b.domain)
    if (domA !== domB) return domA - domB

    return compareStrings(a.key, b.key)
  })

  const selectedHighlights = []
  const seenHighlightSubjects = new Set()
  for (const h of byType.highlights) {
    if (riskSubjects.has(h.subject)) {
      omitted.push({ key: h.key, reason: 'contradicted' })
      continue
    }
    if (seenHighlightSubjects.has(h.subject)) {
      omitted.push({ key: h.key, reason: 'duplicate' })
      continue
    }
    if (selectedHighlights.length >= SECTION_CAPS.highlights) {
      omitted.push({ key: h.key, reason: 'cap' })
      continue
    }
    seenHighlightSubjects.add(h.subject)
    selectedHighlights.push(h)
  }

  // 3. Filter and Rank Positive Observations
  byType.positiveObservations.sort((a, b) => {
    const domA = getDomainOrder(a.domain)
    const domB = getDomainOrder(b.domain)
    if (domA !== domB) return domA - domB

    return compareStrings(a.key, b.key)
  })

  const selectedPositives = []
  const seenPositiveSubjects = new Set()
  for (const p of byType.positiveObservations) {
    if (riskSubjects.has(p.subject)) {
      omitted.push({ key: p.key, reason: 'contradicted' })
      continue
    }
    if (seenPositiveSubjects.has(p.subject)) {
      omitted.push({ key: p.key, reason: 'duplicate' })
      continue
    }
    if (selectedPositives.length >= SECTION_CAPS.positiveObservations) {
      omitted.push({ key: p.key, reason: 'cap' })
      continue
    }
    seenPositiveSubjects.add(p.subject)
    selectedPositives.push(p)
  }

  // 4. Rank Priority Actions
  byType.priorityActions.sort((a, b) => {
    const rankA = a.rank != null ? a.rank : Infinity
    const rankB = b.rank != null ? b.rank : Infinity
    if (rankA !== rankB) return rankA - rankB
    return compareStrings(a.key, b.key)
  })

  const selectedActions = []
  const seenActionKeys = new Set()
  for (const act of byType.priorityActions) {
    if (seenActionKeys.has(act.key)) {
      omitted.push({ key: act.key, reason: 'duplicate' })
      continue
    }
    if (selectedActions.length >= SECTION_CAPS.priorityActions) {
      omitted.push({ key: act.key, reason: 'cap' })
      continue
    }
    seenActionKeys.add(act.key)
    selectedActions.push(act)
  }

  // 5. Position order
  byType.currentPosition.sort((a, b) => {
    const posA = POSITION_ORDER.indexOf(a.subject)
    const posB = POSITION_ORDER.indexOf(b.subject)
    const indexA = posA >= 0 ? posA : 999
    const indexB = posB >= 0 ? posB : 999
    if (indexA !== indexB) return indexA - indexB
    return compareStrings(a.key, b.key)
  })

  const selectedPositions = []
  const seenPositionSubjects = new Set()
  for (const pos of byType.currentPosition) {
    if (seenPositionSubjects.has(pos.subject)) {
      omitted.push({ key: pos.key, reason: 'duplicate' })
      continue
    }
    seenPositionSubjects.add(pos.subject)
    selectedPositions.push(pos)
  }

  // 6. Build Paragraphs for body sections
  const positionParagraphs = []
  for (const c of selectedPositions) {
    const p = buildParagraphFromCandidate(c, omitted)
    if (p) positionParagraphs.push(p)
  }

  const highlightParagraphs = []
  for (const c of selectedHighlights) {
    const p = buildParagraphFromCandidate(c, omitted)
    if (p) highlightParagraphs.push(p)
  }

  const riskParagraphs = []
  for (const c of selectedRisks) {
    const p = buildParagraphFromCandidate(c, omitted)
    if (p) riskParagraphs.push(p)
  }

  const positiveParagraphs = []
  for (const c of selectedPositives) {
    const p = buildParagraphFromCandidate(c, omitted)
    if (p) positiveParagraphs.push(p)
  }

  const actionParagraphs = []
  for (const c of selectedActions) {
    const p = buildParagraphFromCandidate(c, omitted)
    if (p) actionParagraphs.push(p)
  }

  // 7. Tone and Executive / Closing Paragraphs
  const tone = determineTone(candidates)
  const topAction = actionParagraphs[0]

  const execTemplateId = topAction
    ? `exec.${tone}.action`
    : `exec.${tone}`
  const execVariables = topAction
    ? { topActionTitle: topAction.variables.title ?? '' }
    : {}
  const execText = renderTemplate(execTemplateId, execVariables)

  const executiveParagraph = createSummaryParagraph({
    evidence: [],
    horizon: 'current',
    key: 'executive_summary',
    relatedInsights: ['health', 'cashflow'],
    relatedRecommendations: topAction
      ? [...topAction.relatedRecommendations]
      : [],
    templateId: execTemplateId,
    text: execText,
    variables: execVariables,
  })

  const closingTemplateId = `closing.${tone}`
  const closingText = renderTemplate(closingTemplateId, {})
  const closingParagraph = createSummaryParagraph({
    evidence: [],
    horizon: 'current',
    key: 'closing_summary',
    relatedInsights: ['health', 'cashflow'],
    relatedRecommendations: [],
    templateId: closingTemplateId,
    text: closingText,
    variables: {},
  })

  // 8. Assemble Sections in Canonical Order
  function makeSection(type, paragraphs) {
    const relatedInsights = Array.from(
      new Set(paragraphs.flatMap((p) => p.relatedInsights)),
    ).sort(compareStrings)
    const relatedRecommendations = Array.from(
      new Set(paragraphs.flatMap((p) => p.relatedRecommendations)),
    ).sort(compareStrings)

    return createSummarySection({
      paragraphs,
      relatedInsights,
      relatedRecommendations,
      title: SUMMARY_SECTION_TITLES[type],
      type,
    })
  }

  const sectionMap = {
    [SUMMARY_SECTION_TYPES.executive]: makeSection(
      SUMMARY_SECTION_TYPES.executive,
      [executiveParagraph],
    ),
    [SUMMARY_SECTION_TYPES.currentPosition]: makeSection(
      SUMMARY_SECTION_TYPES.currentPosition,
      positionParagraphs,
    ),
    [SUMMARY_SECTION_TYPES.highlights]: makeSection(
      SUMMARY_SECTION_TYPES.highlights,
      highlightParagraphs,
    ),
    [SUMMARY_SECTION_TYPES.risks]: makeSection(
      SUMMARY_SECTION_TYPES.risks,
      riskParagraphs,
    ),
    [SUMMARY_SECTION_TYPES.positiveObservations]: makeSection(
      SUMMARY_SECTION_TYPES.positiveObservations,
      positiveParagraphs,
    ),
    [SUMMARY_SECTION_TYPES.priorityActions]: makeSection(
      SUMMARY_SECTION_TYPES.priorityActions,
      actionParagraphs,
    ),
    [SUMMARY_SECTION_TYPES.closing]: makeSection(
      SUMMARY_SECTION_TYPES.closing,
      [closingParagraph],
    ),
  }

  const sections = []
  for (const type of CANONICAL_SECTION_ORDER) {
    const sec = sectionMap[type]
    // Omit optional empty sections if paragraphs is 0
    const isRequired =
      type === SUMMARY_SECTION_TYPES.executive ||
      type === SUMMARY_SECTION_TYPES.currentPosition ||
      type === SUMMARY_SECTION_TYPES.closing

    if (isRequired || sec.paragraphs.length > 0) {
      sections.push(sec)
    }
  }

  const counts = {
    actions: actionParagraphs.length,
    highlights: highlightParagraphs.length,
    positives: positiveParagraphs.length,
    risks: riskParagraphs.length,
  }

  return {
    counts,
    omitted,
    sections,
    tone,
  }
}
