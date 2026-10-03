import {
  CANONICAL_SECTION_ORDER,
  EMPTY_SUMMARY_TEXT,
  SUMMARY_SECTION_TYPES,
} from './summaryConstants.js'
import { renderTemplate } from './templateRegistry.js'

function resolvePath(obj, path) {
  if (!obj || typeof obj !== 'object' || typeof path !== 'string') {
    return undefined
  }
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

export function validateFinancialSummary({
  financialSummary,
  insightBundle,
  recommendationBundle,
}) {
  const errors = []

  if (!financialSummary || typeof financialSummary !== 'object') {
    return {
      errors: ['FinancialSummary must be a valid object.'],
      valid: false,
    }
  }

  // Version & top-level structure
  if (!financialSummary.version || typeof financialSummary.version !== 'string') {
    errors.push('FinancialSummary must have a valid version string.')
  }
  if (!financialSummary.scope || typeof financialSummary.scope !== 'string') {
    errors.push('FinancialSummary must have a valid scope string.')
  }
  if (
    !financialSummary.generatedAt ||
    typeof financialSummary.generatedAt !== 'string'
  ) {
    errors.push('FinancialSummary must have a valid generatedAt timestamp.')
  }

  // Metadata
  const meta = financialSummary.metadata
  if (!meta || typeof meta !== 'object') {
    errors.push('FinancialSummary must include a metadata object.')
  } else {
    if (!meta.summaryId || typeof meta.summaryId !== 'string') {
      errors.push('Metadata must include a valid summaryId.')
    }
    if (meta.summaryType !== 'standard') {
      errors.push('Metadata summaryType must be "standard".')
    }
    if (!meta.narrativeVersion || !meta.engineVersion || !meta.templateVersion) {
      errors.push('Metadata must include versioning details.')
    }
    if (meta.language !== 'en') {
      errors.push('Metadata language must be "en".')
    }
  }

  // Diagnostics
  const diag = financialSummary.diagnostics
  if (!diag || typeof diag !== 'object') {
    errors.push('FinancialSummary must include a diagnostics object.')
    return { errors, valid: false }
  }

  if (diag.state !== 'empty' && diag.state !== 'ready') {
    errors.push('Diagnostics state must be "empty" or "ready".')
  }

  const sections = financialSummary.sections
  if (!Array.isArray(sections)) {
    errors.push('Sections must be an array.')
    return { errors, valid: false }
  }

  // Canonical ordering and duplicate checking
  const seenTypes = new Set()
  let lastOrderIndex = -1

  for (const section of sections) {
    if (!section || typeof section !== 'object') {
      errors.push('Section must be a valid object.')
      continue
    }

    if (seenTypes.has(section.type)) {
      errors.push(`Duplicate section type: ${section.type}`)
    }
    seenTypes.add(section.type)

    const orderIndex = CANONICAL_SECTION_ORDER.indexOf(section.type)
    if (orderIndex === -1) {
      errors.push(`Unknown section type: ${section.type}`)
    } else if (orderIndex < lastOrderIndex) {
      errors.push(`Section ${section.type} violates canonical section order.`)
    } else {
      lastOrderIndex = orderIndex
    }
  }

  // ==========================================
  // Branch 1: EMPTY SUMMARY CONTRACT (Correction 5)
  // ==========================================
  if (diag.state === 'empty') {
    if (sections.length !== 1) {
      errors.push('Empty FinancialSummary must contain exactly 1 section.')
    } else {
      const exec = sections[0]
      if (exec.type !== SUMMARY_SECTION_TYPES.executive) {
        errors.push('Empty FinancialSummary single section must be executive.')
      }
      if (!Array.isArray(exec.paragraphs) || exec.paragraphs.length !== 1) {
        errors.push(
          'Empty FinancialSummary executive section must contain exactly 1 paragraph.',
        )
      } else {
        const p = exec.paragraphs[0]
        if (p.text !== EMPTY_SUMMARY_TEXT) {
          errors.push(
            'Empty FinancialSummary paragraph text must match the fixed empty narrative.',
          )
        }
        if (p.evidence && p.evidence.length > 0) {
          errors.push('Empty FinancialSummary must not contain evidence.')
        }
        if (
          p.relatedRecommendations &&
          p.relatedRecommendations.length > 0
        ) {
          errors.push(
            'Empty FinancialSummary must not contain related recommendations.',
          )
        }
      }
    }

    if (
      seenTypes.has(SUMMARY_SECTION_TYPES.risks) ||
      seenTypes.has(SUMMARY_SECTION_TYPES.positiveObservations) ||
      seenTypes.has(SUMMARY_SECTION_TYPES.priorityActions)
    ) {
      errors.push(
        'Empty FinancialSummary must not contain risks, positives, or priority actions.',
      )
    }

    return { errors, valid: errors.length === 0 }
  }

  // ==========================================
  // Branch 2: READY SUMMARY CONTRACT (Correction 5)
  // ==========================================
  const requiredTypes = [
    SUMMARY_SECTION_TYPES.executive,
    SUMMARY_SECTION_TYPES.currentPosition,
    SUMMARY_SECTION_TYPES.closing,
  ]

  for (const req of requiredTypes) {
    if (!seenTypes.has(req)) {
      errors.push(`Ready FinancialSummary is missing required section: ${req}`)
    }
  }

  // Paragraph checks across sections
  const seenParagraphKeys = new Set()
  const recsInBundle = new Set(
    recommendationBundle?.recommendations?.map((r) => r.id) ?? [],
  )

  for (const section of sections) {
    if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
      errors.push(
        `Section ${section.type} must contain at least 1 paragraph when present.`,
      )
      continue
    }

    if (
      (section.type === SUMMARY_SECTION_TYPES.executive ||
        section.type === SUMMARY_SECTION_TYPES.closing) &&
      section.paragraphs.length !== 1
    ) {
      errors.push(
        `Section ${section.type} must contain exactly 1 paragraph.`,
      )
    }

    for (const paragraph of section.paragraphs) {
      if (!paragraph || typeof paragraph !== 'object') {
        errors.push(`Section ${section.type} contains invalid paragraph.`)
        continue
      }

      if (seenParagraphKeys.has(paragraph.key)) {
        errors.push(`Duplicate paragraph key detected: ${paragraph.key}`)
      }
      seenParagraphKeys.add(paragraph.key)

      // 1. Template determinism: templateId + variables deterministically re-renders paragraph.text
      const reRendered = renderTemplate(
        paragraph.templateId,
        paragraph.variables,
      )
      if (reRendered !== paragraph.text) {
        errors.push(
          `Paragraph '${paragraph.key}' text does not match re-rendered template '${paragraph.templateId}'.`,
        )
      }

      // 2. Evidence validation (Correction 3):
      // evidence.source resolves against supplied insightBundle and equals evidence.value
      if (Array.isArray(paragraph.evidence)) {
        for (const ev of paragraph.evidence) {
          if (!ev.source || typeof ev.source !== 'string') {
            errors.push(
              `Paragraph '${paragraph.key}' evidence missing source path.`,
            )
            continue
          }

          if (insightBundle) {
            const resolvedValue = resolvePath(insightBundle, ev.source)
            if (!Object.is(resolvedValue, ev.value)) {
              errors.push(
                `Evidence '${ev.source}' value '${ev.value}' does not match resolved bundle value '${resolvedValue}'.`,
              )
            }
          }
        }
      }

      // 3. Recommendation references must exist in recommendationBundle
      if (Array.isArray(paragraph.relatedRecommendations)) {
        for (const recId of paragraph.relatedRecommendations) {
          if (!recsInBundle.has(recId)) {
            errors.push(
              `Paragraph '${paragraph.key}' references recommendation '${recId}' not present in RecommendationBundle.`,
            )
          }
        }
      }
    }
  }

  // Priority Actions ordering check
  const actionSection = sections.find(
    (s) => s.type === SUMMARY_SECTION_TYPES.priorityActions,
  )
  if (actionSection && recommendationBundle?.recommendations) {
    const rawOrder = recommendationBundle.recommendations.map((r) => r.id)
    const sectionRecIds = actionSection.paragraphs.flatMap(
      (p) => p.relatedRecommendations,
    )

    let lastIdx = -1
    for (const recId of sectionRecIds) {
      const idx = rawOrder.indexOf(recId)
      if (idx !== -1) {
        if (idx < lastIdx) {
          errors.push(
            `Priority action '${recId}' violates RecommendationBundle ranking order.`,
          )
        }
        lastIdx = idx
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  }
}
